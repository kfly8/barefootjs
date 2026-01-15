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

    const template = [imports, types, component].filter(Boolean).join('\n\n')

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

    // Build props parameter
    const propsParams = ir.metadata.propsParams
      .map((p: ParamInfo) => (p.defaultValue ? `${p.name} = ${p.defaultValue}` : p.name))
      .join(', ')

    const restProps = ir.metadata.localConstants.find((c) => c.name === 'restProps')
    const propsDestructure = restProps
      ? `{ ${propsParams}, ...${restProps.name} }`
      : propsParams
        ? `{ ${propsParams} }`
        : ''

    // Add hydration props
    const hydrationProps = '__instanceId, __bfScope'
    const fullPropsDestructure = propsDestructure
      ? `{ ${propsDestructure.slice(2, -2)}, ${hydrationProps} }`
      : `{ ${hydrationProps} }`

    // Props type annotation
    const typeAnnotation = propsTypeName
      ? `: ${name}PropsWithHydration`
      : ': { __instanceId?: string; __bfScope?: string }'

    // Generate signal initializers for SSR
    const signalInits = this.generateSignalInitializers(ir)

    // Generate JSX body
    const jsxBody = this.renderNode(ir.root)

    const lines: string[] = []
    lines.push(`export function ${name}(${fullPropsDestructure}${typeAnnotation}) {`)

    if (signalInits) {
      lines.push(signalInits)
    }

    lines.push('')
    lines.push(`  return (`)
    lines.push(`    ${jsxBody}`)
    lines.push(`  )`)
    lines.push(`}`)

    return lines.join('\n')
  }

  private generateSignalInitializers(ir: ComponentIR): string {
    const lines: string[] = []

    for (const signal of ir.metadata.signals) {
      // Create a getter that returns the initial value for SSR
      lines.push(`  const ${signal.getter} = () => ${signal.initialValue}`)
    }

    for (const memo of ir.metadata.memos) {
      // Evaluate memo computation at SSR time
      lines.push(`  const ${memo.name} = ${memo.computation}`)
    }

    return lines.join('\n')
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
      hydrationAttrs += ' {...(__bfScope ? { "data-bf-scope": __bfScope } : { "data-bf-scope": __instanceId })}'
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
    if (expr.expr === 'null' || expr.expr === 'undefined') {
      return ''
    }
    return `{${expr.expr}}`
  }

  renderConditional(cond: IRConditional): string {
    const whenTrue = this.renderNode(cond.whenTrue)
    const whenFalse = this.renderNode(cond.whenFalse)

    // If reactive, wrap with markers
    if (cond.slotId) {
      const trueWithMarker = this.wrapWithCondMarker(whenTrue, cond.slotId)
      const falseWithMarker = cond.whenFalse.type === 'expression' && cond.whenFalse.expr === 'null'
        ? `{__rawHtml("<!--bf-cond-start:${cond.slotId}-->")}{__rawHtml("<!--bf-cond-end:${cond.slotId}-->")}`
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

    if (children) {
      return `<${comp.name}${props}>${children}</${comp.name}>`
    } else {
      return `<${comp.name}${props} />`
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
      if (attr.name === '...') {
        // Spread attribute
        parts.push(`{...${attr.value}}`)
      } else if (attr.value === null) {
        // Boolean attribute
        parts.push(attr.name)
      } else if (attr.dynamic) {
        // Dynamic attribute
        parts.push(`${attr.name}={${attr.value}}`)
      } else {
        // Static attribute
        // Convert 'class' to 'className' for JSX
        const name = attr.name === 'class' ? 'className' : attr.name
        parts.push(`${name}="${attr.value}"`)
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
        parts.push(prop.name)
      } else {
        parts.push(`${prop.name}="${prop.value}"`)
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
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
