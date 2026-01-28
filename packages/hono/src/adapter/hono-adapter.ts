/**
 * BarefootJS Hono Adapter
 *
 * Generates Hono JSX from Pure IR with integrated script collection logic.
 */

import {
  type ComponentIR,
  type IRNode,
  type IRElement,
  type IRText,
  type IRExpression,
  type IRConditional,
  type IRLoop,
  type IRComponent,
  type IRFragment,
  type IRTemplateLiteral,
  type ParamInfo,
  type AdapterOutput,
  type TemplateAdapter,
  isBooleanAttr,
} from '@barefootjs/jsx'

export interface HonoAdapterOptions {
  /**
   * Enable script collection for SSR with Hono's useRequestContext.
   * When enabled, generated components will include logic to collect
   * client JS scripts for BfScripts component.
   */
  injectScriptCollection?: boolean

  /**
   * Base path for client JS files (e.g., '/static/components/')
   * Used to generate script src attributes.
   */
  clientJsBasePath?: string

  /**
   * Path to barefoot.js runtime (e.g., '/static/components/barefoot.js')
   */
  barefootJsPath?: string

  /**
   * Client JS filename (without path). When set, all components use this filename.
   * When not set, uses `{componentName}.client.js`.
   * Useful for files with multiple components that share a single client JS file.
   */
  clientJsFilename?: string
}

export class HonoAdapter implements TemplateAdapter {
  name = 'hono'
  extension = '.hono.tsx'

  private componentName: string = ''
  private options: HonoAdapterOptions

  constructor(options: HonoAdapterOptions = {}) {
    this.options = {
      injectScriptCollection: options.injectScriptCollection ?? false,
      clientJsBasePath: options.clientJsBasePath ?? '/static/components/',
      barefootJsPath: options.barefootJsPath ?? '/static/components/barefoot.js',
      clientJsFilename: options.clientJsFilename,
    }
  }

  generate(ir: ComponentIR): AdapterOutput {
    this.componentName = ir.metadata.componentName

    const imports = this.generateImports(ir)
    const types = this.generateTypes(ir)
    const component = this.generateComponent(ir)

    // Add default export if the original had one
    const defaultExport = ir.metadata.hasDefaultExport
      ? `\nexport default ${this.componentName}`
      : ''

    const template = [imports, types, component].filter(Boolean).join('\n\n') + defaultExport

    return {
      template,
      types: types || undefined,
      extension: this.extension,
    }
  }

  // ===========================================================================
  // Imports Generation
  // ===========================================================================

  private generateImports(ir: ComponentIR): string {
    const lines: string[] = []

    // Add useRequestContext import if script collection is enabled
    if (this.options.injectScriptCollection) {
      lines.push("import { useRequestContext } from 'hono/jsx-renderer'")
    }

    // Add bfComment for conditional reconciliation markers
    lines.push("import { bfComment } from '@barefootjs/hono/utils'")

    // Re-export original imports (excluding @barefootjs/dom)
    for (const imp of ir.metadata.imports) {
      if (imp.source === '@barefootjs/dom') continue
      if (imp.isTypeOnly) {
        lines.push(`import type ${this.formatImportSpecifiers(imp.specifiers)} from '${imp.source}'`)
      } else {
        lines.push(`import ${this.formatImportSpecifiers(imp.specifiers)} from '${imp.source}'`)
      }
    }

    return lines.join('\n')
  }

  private formatImportSpecifiers(
    specifiers: { name: string; alias: string | null; isDefault: boolean; isNamespace: boolean }[]
  ): string {
    const defaultSpec = specifiers.find((s) => s.isDefault)
    const namespaceSpec = specifiers.find((s) => s.isNamespace)
    const namedSpecs = specifiers.filter((s) => !s.isDefault && !s.isNamespace)

    const parts: string[] = []

    if (defaultSpec) {
      parts.push(defaultSpec.alias || defaultSpec.name)
    }

    if (namespaceSpec) {
      parts.push(`* as ${namespaceSpec.name}`)
    }

    if (namedSpecs.length > 0) {
      const named = namedSpecs
        .map((s) => (s.alias ? `${s.name} as ${s.alias}` : s.name))
        .join(', ')
      parts.push(`{ ${named} }`)
    }

    return parts.join(', ')
  }

  // ===========================================================================
  // Types Generation
  // ===========================================================================

  generateTypes(ir: ComponentIR): string | null {
    const lines: string[] = []

    // Include original type definitions
    for (const typeDef of ir.metadata.typeDefinitions) {
      lines.push(typeDef.definition)
    }

    // Generate hydration props type
    const propsTypeName = this.getPropsTypeName(ir)
    if (propsTypeName) {
      lines.push('')
      lines.push(`type ${this.componentName}PropsWithHydration = ${propsTypeName} & {`)
      lines.push('  __instanceId?: string')
      lines.push('  __bfScope?: string')
      lines.push('  "data-key"?: string | number')
      lines.push('}')
    }

    return lines.length > 0 ? lines.join('\n') : null
  }

  private getPropsTypeName(ir: ComponentIR): string | null {
    if (ir.metadata.propsType?.raw) {
      return ir.metadata.propsType.raw
    }
    return null
  }

  // ===========================================================================
  // Component Generation
  // ===========================================================================

  private generateComponent(ir: ComponentIR): string {
    const name = ir.metadata.componentName
    const propsTypeName = this.getPropsTypeName(ir)

    // Check if component has client-side features (signals, memos, event handlers)
    const hasClientFeatures =
      ir.metadata.signals.length > 0 ||
      ir.metadata.memos.length > 0 ||
      this.hasEventHandlers(ir.root)

    // Validate: components with client features must have "use client" directive
    if (hasClientFeatures && !ir.metadata.isClientComponent) {
      throw new Error(
        `Component "${name}" has client-side features (signals, memos, or event handlers) ` +
        `but is not marked as a client component. Add "use client" directive at the top of the file.`
      )
    }

    // A component is a client component only if it has "use client" directive
    const hasClientInteractivity = ir.metadata.isClientComponent

    // Build props parameter
    // Convert 'class' to 'className' (React convention, avoids JS reserved word)
    const propsParams = ir.metadata.propsParams
      .map((p: ParamInfo) => {
        const paramName = p.name === 'class' ? 'className' : p.name
        return p.defaultValue ? `${paramName} = ${p.defaultValue}` : paramName
      })
      .join(', ')

    const restPropsName = ir.metadata.restPropsName

    // Build full destructure with hydration props
    // Rest props must be at the end in TypeScript
    const hydrationProps = '__instanceId, __bfScope, "data-key": __dataKey'
    const parts: string[] = []
    if (propsParams) {
      parts.push(propsParams)
    }
    parts.push(hydrationProps)
    if (restPropsName) {
      parts.push(`...${restPropsName}`)
    }
    const fullPropsDestructure = `{ ${parts.join(', ')} }`

    // Props type annotation
    const typeAnnotation = propsTypeName
      ? `: ${name}PropsWithHydration`
      : ': { __instanceId?: string; __bfScope?: string }'

    // Generate signal initializers for SSR
    const signalInits = this.generateSignalInitializers(ir)

    // Generate JSX body
    // Pass isRootOfClientComponent flag when the root is a component and this is a client component
    // This ensures the child component receives __instanceId instead of __bfScope
    const isRootComponent = ir.root.type === 'component'
    const jsxBody = this.renderNode(ir.root, {
      isRootOfClientComponent: hasClientInteractivity && isRootComponent
    })

    // Generate props serialization for hydration (for components with props)
    const propsToSerialize = ir.metadata.propsParams.filter(p => {
      // Skip function props and internal props
      return !p.name.startsWith('on') && !p.name.startsWith('__')
    })
    const hasPropsToSerialize = propsToSerialize.length > 0 && hasClientInteractivity

    const lines: string[] = []
    lines.push(`export function ${name}(${fullPropsDestructure}${typeAnnotation}) {`)

    // Generate scope ID
    if (hasClientInteractivity) {
      // Interactive components always generate their own unique ID with component name prefix
      // This ensures client JS query `[data-bf-scope^="ComponentName_"]` matches
      lines.push(`  const __scopeId = __instanceId || \`${name}_\${Math.random().toString(36).slice(2, 8)}\``)
    } else {
      // Non-interactive components can inherit parent's scope or use fallback
      lines.push(`  const __scopeId = __bfScope || __instanceId || \`${name}_\${Math.random().toString(36).slice(2, 8)}\``)
    }

    // Generate script collection code if enabled
    if (this.options.injectScriptCollection && hasClientInteractivity) {
      lines.push(this.generateScriptCollectionCode())
    }

    if (signalInits) {
      lines.push(signalInits)
    }

    // Generate props serialization code
    if (hasPropsToSerialize) {
      lines.push('')
      lines.push(`  // Serialize props for client hydration`)
      lines.push(`  const __hydrateProps: Record<string, unknown> = {}`)
      for (const p of propsToSerialize) {
        // Skip functions and JSX elements (they can't be JSON serialized)
        lines.push(`  if (typeof ${p.name} !== 'function' && !(typeof ${p.name} === 'object' && ${p.name} !== null && 'isEscaped' in ${p.name})) __hydrateProps['${p.name}'] = ${p.name}`)
      }
    }

    lines.push('')

    // Wrap JSX with fragment to include props script and inline scripts if needed
    const needsInlineScripts = this.options.injectScriptCollection && hasClientInteractivity
    if (hasPropsToSerialize || needsInlineScripts) {
      lines.push(`  return (`)
      lines.push(`    <>`)
      lines.push(`      ${jsxBody}`)
      if (hasPropsToSerialize) {
        lines.push(`      {Object.keys(__hydrateProps).length > 0 && (`)
        lines.push(`        <script`)
        lines.push(`          type="application/json"`)
        lines.push(`          data-bf-props={__scopeId}`)
        lines.push(`          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}`)
        lines.push(`        />`)
        lines.push(`      )}`)
      }
      if (needsInlineScripts) {
        lines.push(this.generateInlineScriptTags())
      }
      lines.push(`    </>`)
      lines.push(`  )`)
    } else {
      lines.push(`  return (`)
      lines.push(`    ${jsxBody}`)
      lines.push(`  )`)
    }
    lines.push(`}`)

    return lines.join('\n')
  }

  private generateScriptCollectionCode(): string {
    const barefootSrc = this.options.barefootJsPath
    const clientJsBasePath = this.options.clientJsBasePath
    const clientJsFilename = this.options.clientJsFilename || `${this.componentName}.client.js`
    // Use filename without extension as component ID for deduplication
    const componentId = clientJsFilename.replace(/\.client\.js$/, '')

    return `
  // Script collection for client JS hydration (Suspense-aware)
  let __shouldOutputInline = false
  let __shouldOutputBarefoot = false
  let __shouldOutputThis = false
  const __barefootSrc = '${barefootSrc}'
  const __thisSrc = '${clientJsBasePath}${clientJsFilename}'
  try {
    const __c = useRequestContext()
    const __outputScripts: Set<string> = __c.get('bfOutputScripts') || new Set()
    const __scriptsRendered = __c.get('bfScriptsRendered') ?? false

    // Check if we need to output each script (not already output)
    __shouldOutputBarefoot = !__outputScripts.has('__barefoot__')
    __shouldOutputThis = !__outputScripts.has('${componentId}')

    if (__scriptsRendered) {
      // BfScripts already rendered (e.g., inside Suspense boundary)
      // Output scripts inline and mark as output
      __shouldOutputInline = true
      if (__shouldOutputBarefoot) __outputScripts.add('__barefoot__')
      if (__shouldOutputThis) __outputScripts.add('${componentId}')
    } else {
      // BfScripts not yet rendered - collect for deferred rendering
      const __scripts: { src: string }[] = __c.get('bfCollectedScripts') || []
      if (__shouldOutputBarefoot) {
        __outputScripts.add('__barefoot__')
        __scripts.push({ src: __barefootSrc })
      }
      if (__shouldOutputThis) {
        __outputScripts.add('${componentId}')
        __scripts.push({ src: __thisSrc })
      }
      __c.set('bfCollectedScripts', __scripts)
    }
    __c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Context unavailable - output inline as fallback
    __shouldOutputInline = true
    __shouldOutputBarefoot = true
    __shouldOutputThis = true
  }`
  }

  private generateInlineScriptTags(): string {
    return `      {__shouldOutputInline && __shouldOutputBarefoot && <script type="module" src={__barefootSrc} />}
      {__shouldOutputInline && __shouldOutputThis && <script type="module" src={__thisSrc} />}`
  }

  private hasEventHandlers(node: IRNode): boolean {
    if (node.type === 'element') {
      if (node.events.length > 0) return true
      for (const child of node.children) {
        if (this.hasEventHandlers(child)) return true
      }
    } else if (node.type === 'component') {
      // Check if any props look like event handlers
      for (const prop of node.props) {
        if (prop.name.startsWith('on') && prop.name.length > 2) return true
      }
      for (const child of node.children) {
        if (this.hasEventHandlers(child)) return true
      }
    } else if (node.type === 'fragment') {
      for (const child of node.children) {
        if (this.hasEventHandlers(child)) return true
      }
    } else if (node.type === 'conditional') {
      if (this.hasEventHandlers(node.whenTrue)) return true
      if (this.hasEventHandlers(node.whenFalse)) return true
    } else if (node.type === 'loop') {
      for (const child of node.children) {
        if (this.hasEventHandlers(child)) return true
      }
    }
    return false
  }

  private generateSignalInitializers(ir: ComponentIR): string {
    const lines: string[] = []

    for (const signal of ir.metadata.signals) {
      // Create a getter that returns the initial value for SSR
      lines.push(`  const ${signal.getter} = () => ${signal.initialValue}`)
      // Create a no-op setter for SSR (in case it's passed to child components)
      lines.push(`  const ${signal.setter} = () => {}`)
    }

    for (const memo of ir.metadata.memos) {
      // Evaluate memo computation at SSR time
      lines.push(`  const ${memo.name} = ${memo.computation}`)
    }

    // Include local constants
    for (const constant of ir.metadata.localConstants) {
      const value = constant.value.trim()
      // Check if it's an arrow function or function expression
      const isArrowFunc =
        value.startsWith('(') ||
        value.startsWith('async (') ||
        value.startsWith('async(') ||
        value.startsWith('function') ||
        /^\w+\s*=>/.test(value) ||
        /^\([^)]*\)\s*=>/.test(value)

      if (isArrowFunc) {
        // Generate a stub function for SSR (these may be referenced as props)
        // Extract parameters if possible
        const params = this.extractFunctionParams(value)
        lines.push(`  const ${constant.name} = (${params}) => {}`)
      } else {
        // Output non-function constants directly
        lines.push(`  const ${constant.name} = ${constant.value}`)
      }
    }

    return lines.join('\n')
  }

  private extractFunctionParams(value: string): string {
    // Match arrow function parameters: (a, b) => ... or a => ...
    const arrowMatch = value.match(/^(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/)
    if (arrowMatch) {
      // Remove type annotations from parameters
      return arrowMatch[1]
        .split(',')
        .map((p) => p.trim().split(':')[0].split('=')[0].trim())
        .filter(Boolean)
        .join(', ')
    }
    // Single param arrow function: a => ...
    const singleMatch = value.match(/^(?:async\s*)?(\w+)\s*=>/)
    if (singleMatch) {
      return singleMatch[1]
    }
    // Function expression: function(a, b) { ... }
    const funcMatch = value.match(/^(?:async\s*)?function\s*\w*\s*\(([^)]*)\)/)
    if (funcMatch) {
      return funcMatch[1]
        .split(',')
        .map((p) => p.trim().split(':')[0].split('=')[0].trim())
        .filter(Boolean)
        .join(', ')
    }
    return ''
  }

  // ===========================================================================
  // Node Rendering
  // ===========================================================================

  renderNode(node: IRNode, ctx?: { isRootOfClientComponent?: boolean; isInsideLoop?: boolean }): string {
    switch (node.type) {
      case 'element':
        return this.renderElement(node)
      case 'text':
        return this.renderText(node)
      case 'expression':
        return this.renderExpression(node)
      case 'conditional':
        return this.renderConditional(node)
      case 'loop':
        return this.renderLoop(node)
      case 'component':
        return this.renderComponent(node, ctx)
      case 'fragment':
        return this.renderFragment(node)
      case 'slot':
        return '{children}'
      default:
        return ''
    }
  }

  renderElement(element: IRElement): string {
    const tag = element.tag
    const attrs = this.renderAttributes(element)
    const children = this.renderChildren(element.children)

    // Add hydration markers
    let hydrationAttrs = ''
    if (element.needsScope) {
      // Use __scopeId which is generated by the component
      hydrationAttrs += ' data-bf-scope={__scopeId}'
      // Add data-key for list reconciliation (only on root elements with scope)
      hydrationAttrs += ' {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})}'
    }
    if (element.slotId) {
      hydrationAttrs += ` data-bf="${element.slotId}"`
    }

    if (children) {
      return `<${tag}${attrs}${hydrationAttrs}>${children}</${tag}>`
    } else {
      return `<${tag}${attrs}${hydrationAttrs} />`
    }
  }

  private renderText(text: IRText): string {
    return text.value
  }

  renderExpression(expr: IRExpression): string {
    // Keep null as 'null' for proper JSX rendering
    if (expr.expr === 'null' || expr.expr === 'undefined') {
      return 'null'
    }
    // Handle @client directive - render comment marker for client-side evaluation
    if (expr.clientOnly && expr.slotId) {
      return `{bfComment("client:${expr.slotId}")}`
    }
    // Wrap reactive expressions in a span with slot marker for client JS to find
    if (expr.reactive && expr.slotId) {
      return `<span data-bf="${expr.slotId}">{${expr.expr}}</span>`
    }
    return `{${expr.expr}}`
  }

  // Render a node without wrapping braces (for use inside ternary expressions)
  private renderNodeRaw(node: IRNode): string {
    if (node.type === 'expression') {
      // Return expression without braces
      if (node.expr === 'null' || node.expr === 'undefined') {
        return 'null'
      }
      // Strip quotes from string literals for text content
      const trimmed = node.expr.trim()
      if (
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ) {
        return trimmed.slice(1, -1)
      }
      return node.expr
    }
    return this.renderNode(node)
  }

  renderConditional(cond: IRConditional): string {
    // Handle @client directive - render comment markers for client-side evaluation
    if (cond.clientOnly && cond.slotId) {
      return `{bfComment("cond-start:${cond.slotId}")}{bfComment("cond-end:${cond.slotId}")}`
    }

    const whenTrue = this.renderNodeRaw(cond.whenTrue)
    let whenFalse = this.renderNodeRaw(cond.whenFalse)

    // Handle empty/null whenFalse
    if (!whenFalse || whenFalse === '' || whenFalse === 'null') {
      whenFalse = 'null'
    }

    // If reactive, wrap with markers
    if (cond.slotId) {
      const trueWithMarker = this.wrapWithCondMarker(cond.whenTrue, whenTrue, cond.slotId)
      // For null false branch, use fragment with comment markers
      const falseWithMarker = cond.whenFalse.type === 'expression' && cond.whenFalse.expr === 'null'
        ? 'null'
        : this.wrapWithCondMarker(cond.whenFalse, whenFalse, cond.slotId)

      return `{${cond.condition} ? ${trueWithMarker} : ${falseWithMarker}}`
    }

    return `{${cond.condition} ? ${whenTrue} : ${whenFalse}}`
  }

  private wrapWithCondMarker(node: IRNode, content: string, condId: string): string {
    // If content is a JSX element, add data-bf-cond attribute
    if (content.startsWith('<')) {
      const match = content.match(/^<(\w+)/)
      if (match) {
        return content.replace(`<${match[1]}`, `<${match[1]} data-bf-cond="${condId}"`)
      }
    }

    // Determine if content should be wrapped in braces
    if (node.type === 'expression') {
      const trimmed = (node as IRExpression).expr.trim()
      // String literal: output as text (quotes already stripped by renderNodeRaw)
      if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
          (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return `<>{bfComment("cond-start:${condId}")}${content}{bfComment("cond-end:${condId}")}</>`
      }
      // Other expression: wrap in braces
      return `<>{bfComment("cond-start:${condId}")}{${content}}{bfComment("cond-end:${condId}")}</>`
    }

    // Text node or other: output as text
    return `<>{bfComment("cond-start:${condId}")}${content}{bfComment("cond-end:${condId}")}</>`
  }

  renderLoop(loop: IRLoop): string {
    // clientOnly loops should not be rendered at SSR time
    if (loop.clientOnly) {
      return ''
    }

    const indexParam = loop.index ? `, ${loop.index}` : ''
    // Render children with isInsideLoop flag so components generate their own scope IDs
    const children = this.renderChildrenInLoop(loop.children)

    return `{${loop.array}.map((${loop.param}${indexParam}) => ${children})}`
  }

  private renderChildrenInLoop(children: IRNode[]): string {
    return children.map((child) => this.renderNode(child, { isInsideLoop: true })).join('')
  }

  renderComponent(comp: IRComponent, ctx?: { isRootOfClientComponent?: boolean; isInsideLoop?: boolean }): string {
    const props = this.renderComponentProps(comp)
    const children = this.renderChildren(comp.children)

    // Determine how to pass scope to child component
    let scopeAttr: string
    if (ctx?.isInsideLoop) {
      // Components inside loops should generate their own unique scope IDs
      // Pass __bfScope so they use it as fallback but generate unique IDs
      // This ensures each loop iteration has a distinct component instance
      if (comp.slotId) {
        scopeAttr = ` __bfScope={\`\${__scopeId}_${comp.slotId}\`}`
      } else {
        scopeAttr = ' __bfScope={__scopeId}'
      }
    } else if (comp.slotId) {
      // Components with slotId need unique scope with slot suffix
      // Format: ParentName_slotX for client JS matching
      scopeAttr = ` __instanceId={\`\${__scopeId}_${comp.slotId}\`}`
    } else if (ctx?.isRootOfClientComponent) {
      // Root component without slotId: pass parent's scope directly
      scopeAttr = ' __instanceId={__scopeId}'
    } else {
      // Non-interactive components inherit parent's scope
      scopeAttr = ' __instanceId={__scopeId}'
    }

    if (children) {
      return `<${comp.name}${props}${scopeAttr}>${children}</${comp.name}>`
    } else {
      return `<${comp.name}${props}${scopeAttr} />`
    }
  }

  private renderFragment(fragment: IRFragment): string {
    const children = this.renderChildren(fragment.children)
    return `<>${children}</>`
  }

  renderChildren(children: IRNode[]): string {
    return children.map((child) => this.renderNode(child)).join('')
  }

  // ===========================================================================
  // Attribute Rendering
  // ===========================================================================

  private renderAttributes(element: IRElement): string {
    const parts: string[] = []

    for (const attr of element.attrs) {
      // Convert JSX className to HTML class attribute
      const attrName = attr.name === 'className' ? 'class' : attr.name

      if (attr.name === '...') {
        // Spread attribute
        parts.push(`{...${attr.value}}`)
      } else if (attr.value === null) {
        // Boolean attribute
        parts.push(attrName)
      } else if (typeof attr.value === 'object' && attr.value.type === 'template-literal') {
        // Template literal with structured ternaries
        const output = this.renderTemplateLiteral(attr.value)
        parts.push(`${attrName}={${output}}`)
      } else if (attr.dynamic) {
        // Dynamic attribute
        if (isBooleanAttr(attrName)) {
          // Boolean attrs: pass undefined when falsy so Hono omits the attribute
          parts.push(`${attrName}={${attr.value} || undefined}`)
        } else {
          parts.push(`${attrName}={${attr.value}}`)
        }
      } else {
        // Static attribute
        parts.push(`${attrName}="${attr.value}"`)
      }
    }

    // Add event handlers (as no-op for SSR)
    for (const event of element.events) {
      const handlerName = `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`
      parts.push(`${handlerName}={() => {}}`)
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
  }

  private renderComponentProps(comp: IRComponent): string {
    const parts: string[] = []
    let keyValue: string | null = null

    for (const prop of comp.props) {
      if (prop.name === '...') {
        parts.push(`{...${prop.value}}`)
      } else if (prop.name === 'key') {
        // JSX key prop - also add data-key for reconciliation
        parts.push(`${prop.name}={${prop.value}}`)
        keyValue = prop.value
      } else if (prop.dynamic) {
        parts.push(`${prop.name}={${prop.value}}`)
      } else if (prop.value === 'true') {
        // Boolean true: <Component disabled />
        parts.push(prop.name)
      } else if (prop.value === 'false') {
        // Boolean false: <Component disabled={false} />
        // Note: we output this explicitly rather than omitting it
        // because the child component may need the explicit false value
        parts.push(`${prop.name}={false}`)
      } else if (this.isJsExpression(prop.value)) {
        // JavaScript expressions (arrow functions, etc.)
        parts.push(`${prop.name}={${prop.value}}`)
      } else {
        // String literals
        parts.push(`${prop.name}="${prop.value}"`)
      }
    }

    // Add data-key prop when key is present for client-side reconciliation
    // This allows the child component to add data-key attribute to its root element
    if (keyValue) {
      parts.push(`data-key={${keyValue}}`)
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
  }

  private renderTemplateLiteral(literal: IRTemplateLiteral): string {
    let output = '`'
    for (const part of literal.parts) {
      if (part.type === 'string') {
        output += part.value
      } else if (part.type === 'ternary') {
        output += `\${${part.condition} ? '${part.whenTrue}' : '${part.whenFalse}'}`
      }
    }
    output += '`'
    return output
  }

  private isJsExpression(value: string): boolean {
    // Arrow function: () => ..., (x) => ..., x => ...
    if (/^(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/.test(value)) {
      return true
    }
    // Function call with parentheses: foo(), bar(x)
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*\(/.test(value)) {
      return true
    }
    // Function/setter reference: setFoo, handleClick (common naming patterns)
    // These are likely function references, not string values
    if (/^(set[A-Z]|handle[A-Z]|on[A-Z])[a-zA-Z0-9_$]*$/.test(value)) {
      return true
    }
    return false
  }

  // ===========================================================================
  // Hydration Markers (TemplateAdapter interface)
  // ===========================================================================

  renderScopeMarker(instanceIdExpr: string): string {
    return `data-bf-scope={${instanceIdExpr}}`
  }

  renderSlotMarker(slotId: string): string {
    return `data-bf="${slotId}"`
  }

  renderCondMarker(condId: string): string {
    return `data-bf-cond="${condId}"`
  }
}

// Export singleton instance for convenience (without script collection)
export const honoAdapter = new HonoAdapter()
