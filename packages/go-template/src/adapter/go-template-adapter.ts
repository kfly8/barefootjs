/**
 * BarefootJS Go html/template Adapter
 *
 * Generates Go html/template files from BarefootJS IR.
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
  IRSlot,
  TypeInfo,
} from '@barefootjs/jsx'
import { BaseAdapter, type AdapterOutput } from '@barefootjs/jsx'

export interface GoTemplateAdapterOptions {
  /** Go package name for generated types (default: 'components') */
  packageName?: string
}

export class GoTemplateAdapter extends BaseAdapter {
  name = 'go-template'
  extension = '.tmpl'

  private componentName: string = ''
  private options: Required<GoTemplateAdapterOptions>

  constructor(options: GoTemplateAdapterOptions = {}) {
    super()
    this.options = {
      packageName: options.packageName ?? 'components',
    }
  }

  generate(ir: ComponentIR): AdapterOutput {
    this.componentName = ir.metadata.componentName

    const templateBody = this.renderNode(ir.root)
    const template = `{{define "${this.componentName}"}}\n${templateBody}\n{{end}}\n`
    const types = this.generateTypes(ir)

    return {
      template,
      types: types || undefined,
      extension: this.extension,
    }
  }

  generateTypes(ir: ComponentIR): string | null {
    const lines: string[] = []
    lines.push(`package ${this.options.packageName}`)
    lines.push('')

    const componentName = ir.metadata.componentName
    const propsTypeName = `${componentName}Props`
    lines.push(`type ${propsTypeName} struct {`)
    lines.push('\tScopeID string')

    for (const param of ir.metadata.propsParams) {
      const goType = this.typeInfoToGo(param.type)
      const fieldName = this.capitalizeFieldName(param.name)
      lines.push(`\t${fieldName} ${goType}`)
    }

    for (const signal of ir.metadata.signals) {
      const goType = this.typeInfoToGo(signal.type)
      const fieldName = this.capitalizeFieldName(signal.getter)
      lines.push(`\t${fieldName} ${goType}`)
    }

    lines.push('}')

    return lines.join('\n')
  }

  private typeInfoToGo(typeInfo: TypeInfo): string {
    switch (typeInfo.kind) {
      case 'primitive':
        switch (typeInfo.primitive) {
          case 'string':
            return 'string'
          case 'number':
            return 'int'
          case 'boolean':
            return 'bool'
          default:
            return 'interface{}'
        }
      case 'array':
        if (typeInfo.elementType) {
          return `[]${this.typeInfoToGo(typeInfo.elementType)}`
        }
        return '[]interface{}'
      case 'object':
        return 'map[string]interface{}'
      default:
        return 'interface{}'
    }
  }

  private capitalizeFieldName(name: string): string {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  renderNode(node: IRNode): string {
    switch (node.type) {
      case 'element':
        return this.renderElement(node)
      case 'text':
        return (node as IRText).value
      case 'expression':
        return this.renderExpression(node)
      case 'conditional':
        return this.renderConditional(node)
      case 'loop':
        return this.renderLoop(node)
      case 'component':
        return this.renderComponent(node)
      case 'fragment':
        return this.renderFragment(node as IRFragment)
      case 'slot':
        return this.renderSlot(node as IRSlot)
      default:
        return ''
    }
  }

  renderElement(element: IRElement): string {
    const tag = element.tag
    const attrs = this.renderAttributes(element)
    const children = this.renderChildren(element.children)

    let hydrationAttrs = ''
    if (element.needsScope) {
      hydrationAttrs += ` ${this.renderScopeMarker('.ScopeID')}`
    }
    if (element.slotId) {
      hydrationAttrs += ` ${this.renderSlotMarker(element.slotId)}`
    }

    const voidElements = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]

    if (voidElements.includes(tag.toLowerCase())) {
      return `<${tag}${attrs}${hydrationAttrs}>`
    }

    return `<${tag}${attrs}${hydrationAttrs}>${children}</${tag}>`
  }

  renderExpression(expr: IRExpression): string {
    const goExpr = this.convertExpressionToGo(expr.expr)

    if (expr.reactive && expr.slotId) {
      return `<span ${this.renderSlotMarker(expr.slotId)}>{{${goExpr}}}</span>`
    }

    return `{{${goExpr}}}`
  }

  private convertExpressionToGo(jsExpr: string): string {
    let expr = jsExpr.trim()

    // Handle null/undefined
    if (expr === 'null' || expr === 'undefined') {
      return '""'
    }

    // Handle string literals - keep as is but use printf
    if ((expr.startsWith("'") && expr.endsWith("'")) ||
        (expr.startsWith('"') && expr.endsWith('"'))) {
      return `print ${expr.replace(/'/g, '"')}`
    }

    // Handle function calls like count() -> .Count
    expr = expr.replace(/(\w+)\(\)/g, (_, name) => {
      return `.${this.capitalizeFieldName(name)}`
    })

    // Handle property access like user.name -> .User.Name
    expr = expr.replace(/(?<!\.)\b([a-z]\w*)\.(\w+)/g, (_, obj, prop) => {
      return `.${this.capitalizeFieldName(obj)}.${this.capitalizeFieldName(prop)}`
    })

    // Handle simple identifiers like count -> .Count
    expr = expr.replace(/^([a-z]\w*)$/, (_, name) => {
      return `.${this.capitalizeFieldName(name)}`
    })

    // Handle .length -> len
    expr = expr.replace(/(\.\w+)\.length/g, (_, prefix) => {
      return `len ${prefix}`
    })

    return expr
  }

  renderConditional(cond: IRConditional): string {
    const goCondition = this.convertConditionToGo(cond.condition)
    const whenTrue = this.renderNode(cond.whenTrue)

    let result = `{{if ${goCondition}}}${whenTrue}`

    if (cond.whenFalse && cond.whenFalse.type !== 'expression') {
      const whenFalse = this.renderNode(cond.whenFalse)
      if (whenFalse && whenFalse !== '{{""}}') {
        result += `{{else}}${whenFalse}`
      }
    } else if (cond.whenFalse && cond.whenFalse.type === 'expression') {
      const exprNode = cond.whenFalse as IRExpression
      if (exprNode.expr !== 'null' && exprNode.expr !== 'undefined') {
        const whenFalse = this.renderNode(cond.whenFalse)
        if (whenFalse && whenFalse !== '{{""}}') {
          result += `{{else}}${whenFalse}`
        }
      }
    }

    result += '{{end}}'
    return result
  }

  private convertConditionToGo(jsCondition: string): string {
    let cond = jsCondition.trim()

    // Handle boolean expressions with comparisons
    cond = cond.replace(/(\w+)\s*===?\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = right === 'true' || right === 'false' ? right : this.convertExpressionToGo(right)
      return `eq ${leftGo} ${rightGo}`
    })

    cond = cond.replace(/(\w+)\s*!==?\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = right === 'true' || right === 'false' ? right : this.convertExpressionToGo(right)
      return `ne ${leftGo} ${rightGo}`
    })

    cond = cond.replace(/(\w+)\s*>\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = this.convertExpressionToGo(right)
      return `gt ${leftGo} ${rightGo}`
    })

    cond = cond.replace(/(\w+)\s*<\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = this.convertExpressionToGo(right)
      return `lt ${leftGo} ${rightGo}`
    })

    cond = cond.replace(/(\w+)\s*>=\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = this.convertExpressionToGo(right)
      return `ge ${leftGo} ${rightGo}`
    })

    cond = cond.replace(/(\w+)\s*<=\s*(\w+)/g, (_, left, right) => {
      const leftGo = this.convertExpressionToGo(left)
      const rightGo = this.convertExpressionToGo(right)
      return `le ${leftGo} ${rightGo}`
    })

    // If no operators matched, convert as expression (truthy check)
    if (!cond.includes(' ')) {
      cond = this.convertExpressionToGo(cond)
    }

    return cond
  }

  renderLoop(loop: IRLoop): string {
    const goArray = this.convertExpressionToGo(loop.array)
    const param = loop.param
    const index = loop.index || '_'

    const children = this.renderChildren(loop.children)

    return `{{range $${index}, $${param} := ${goArray}}}${children}{{end}}`
  }

  renderComponent(comp: IRComponent): string {
    // In Go templates, components are rendered using {{template "name" .}}
    // Props need to be passed as the pipeline data
    return `{{template "${comp.name}" .}}`
  }

  private renderFragment(fragment: IRFragment): string {
    return this.renderChildren(fragment.children)
  }

  private renderSlot(slot: IRSlot): string {
    // Use Go template's block for slots
    const slotName = slot.name === 'default' ? 'children' : slot.name
    return `{{block "${slotName}" .}}{{end}}`
  }

  private renderAttributes(element: IRElement): string {
    const parts: string[] = []

    for (const attr of element.attrs) {
      if (attr.name === '...') {
        // Spread attributes not directly supported in Go templates
        continue
      }

      if (attr.value === null) {
        // Boolean attribute
        parts.push(attr.name)
      } else if (attr.dynamic) {
        const goValue = this.convertExpressionToGo(attr.value)
        parts.push(`${attr.name}="{{${goValue}}}"`)
      } else {
        parts.push(`${attr.name}="${attr.value}"`)
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
  }

  renderScopeMarker(instanceIdExpr: string): string {
    return `data-bf-scope="{{${instanceIdExpr}}}"`
  }

  renderSlotMarker(slotId: string): string {
    return `data-bf="${slotId}"`
  }

  renderCondMarker(condId: string): string {
    return `data-bf-cond="${condId}"`
  }
}

export const goTemplateAdapter = new GoTemplateAdapter()
