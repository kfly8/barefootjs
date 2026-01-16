/**
 * BarefootJS Compiler v2 - Hono Adapter
 *
 * Generates Hono JSX from Pure IR.
 */

import type {
  ComponentIR,
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRFragment,
  ParamInfo,
} from '../types'
import { type AdapterOutput, BaseAdapter } from './interface'

export class HonoAdapter extends BaseAdapter {
  name = 'hono'
  extension = '.hono.tsx'

  private componentName: string = ''

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
    const hasClientInteractivity = ir.metadata.signals.length > 0 ||
      ir.metadata.memos.length > 0 ||
      this.hasEventHandlers(ir.root)

    // Build props parameter
    const propsParams = ir.metadata.propsParams
      .map((p: ParamInfo) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
      .join(', ')

    const restPropsName = ir.metadata.restPropsName

    // Build full destructure with hydration props
    // Rest props must be at the end in TypeScript
    const hydrationProps = '__instanceId, __bfScope'
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
    const jsxBody = this.renderNode(ir.root)

    // Generate props serialization for hydration (for components with props)
    const propsToSerialize = ir.metadata.propsParams.filter(p => {
      // Skip function props and internal props
      return !p.name.startsWith('on') && !p.name.startsWith('__')
    })
    const hasPropsToSerialize = propsToSerialize.length > 0 && hasClientInteractivity

    const lines: string[] = []
    lines.push(`export function ${name}(${fullPropsDestructure}${typeAnnotation}) {`)

    // Always generate scope ID - components with interactivity use their name,
    // others just pass through parent's scope
    if (hasClientInteractivity) {
      lines.push(`  // Generate unique scope ID for hydration`)
      lines.push(`  const __scopeId = __bfScope || __instanceId || \`${name}_\${Math.random().toString(36).slice(2, 8)}\``)
    } else {
      // Pass through parent's scope (may be undefined, which is fine for non-interactive components)
      lines.push(`  const __scopeId = __bfScope || __instanceId`)
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

    // Wrap JSX with fragment to include props script if needed
    if (hasPropsToSerialize) {
      lines.push(`  return (`)
      lines.push(`    <>`)
      lines.push(`      ${jsxBody}`)
      lines.push(`      {Object.keys(__hydrateProps).length > 0 && (`)
      lines.push(`        <script`)
      lines.push(`          type="application/json"`)
      lines.push(`          data-bf-props={__scopeId}`)
      lines.push(`          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}`)
      lines.push(`        />`)
      lines.push(`      )}`)
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

  renderNode(node: IRNode): string {
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
        return this.renderComponent(node)
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
      // Use __scopeId which is generated by the component with client interactivity
      hydrationAttrs += ' data-bf-scope={__scopeId}'
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
    const whenTrue = this.renderNodeRaw(cond.whenTrue)
    let whenFalse = this.renderNodeRaw(cond.whenFalse)

    // Handle empty/null whenFalse
    if (!whenFalse || whenFalse === '' || whenFalse === 'null') {
      whenFalse = 'null'
    }

    // If reactive, wrap with markers
    if (cond.slotId) {
      const trueWithMarker = this.wrapWithCondMarker(whenTrue, cond.slotId)
      // For null false branch, use fragment with comment markers
      const falseWithMarker = cond.whenFalse.type === 'expression' && cond.whenFalse.expr === 'null'
        ? 'null'
        : this.wrapWithCondMarker(whenFalse, cond.slotId)

      return `{${cond.condition} ? ${trueWithMarker} : ${falseWithMarker}}`
    }

    return `{${cond.condition} ? ${whenTrue} : ${whenFalse}}`
  }

  private wrapWithCondMarker(content: string, condId: string): string {
    // If content is a JSX element, add data-bf-cond attribute
    if (content.startsWith('<')) {
      const match = content.match(/^<(\w+)/)
      if (match) {
        return content.replace(`<${match[1]}`, `<${match[1]} data-bf-cond="${condId}"`)
      }
    }
    // Otherwise wrap in span
    return `<span data-bf-cond="${condId}">${content}</span>`
  }

  renderLoop(loop: IRLoop): string {
    const indexParam = loop.index ? `, ${loop.index}` : ''
    const children = this.renderChildren(loop.children)

    return `{${loop.array}.map((${loop.param}${indexParam}) => ${children})}`
  }

  renderComponent(comp: IRComponent): string {
    const props = this.renderComponentProps(comp)
    const children = this.renderChildren(comp.children)

    // For components with event handlers, pass a unique scope ID
    // so the parent's client JS can find and attach handlers
    // The component's root element will have data-bf-scope={this unique ID}
    let scopeAttr: string
    if (comp.slotId) {
      // Generate a unique scope ID for this component instance
      // Format: ParentName_slotX to ensure uniqueness
      scopeAttr = ` __bfScope={\`\${__scopeId}_${comp.slotId}\`}`
    } else {
      // Non-interactive components inherit parent's scope
      scopeAttr = ' __bfScope={__scopeId}'
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

  // ===========================================================================
  // Attribute Rendering
  // ===========================================================================

  private renderAttributes(element: IRElement): string {
    const parts: string[] = []

    for (const attr of element.attrs) {
      // Convert 'class' to 'className' for JSX
      const attrName = attr.name === 'class' ? 'className' : attr.name

      if (attr.name === '...') {
        // Spread attribute
        parts.push(`{...${attr.value}}`)
      } else if (attr.value === null) {
        // Boolean attribute
        parts.push(attrName)
      } else if (attr.dynamic) {
        // Dynamic attribute
        parts.push(`${attrName}={${attr.value}}`)
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

    for (const prop of comp.props) {
      if (prop.name === '...') {
        parts.push(`{...${prop.value}}`)
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

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
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
  // Hydration Markers
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

// Export singleton instance
export const honoAdapter = new HonoAdapter()
