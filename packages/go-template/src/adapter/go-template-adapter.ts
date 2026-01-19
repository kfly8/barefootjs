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
  IRLoopChildComponent,
  IRComponent,
  IRFragment,
  IRSlot,
  IRTemplateLiteral,
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
  private inLoop: boolean = false

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
    lines.push('import "math/rand"')
    lines.push('')

    const componentName = ir.metadata.componentName

    // Find nested components (loops with childComponent)
    const nestedComponents = this.findNestedComponents(ir.root)

    // Generate Input struct for main component
    this.generateInputStruct(lines, ir, componentName, nestedComponents)

    // Generate Props struct for main component
    this.generatePropsStruct(lines, ir, componentName, nestedComponents)

    // Generate NewXxxProps function
    this.generateNewPropsFunction(lines, ir, componentName, nestedComponents)

    return lines.join('\n')
  }

  /**
   * Generate Input struct for a component
   */
  private generateInputStruct(
    lines: string[],
    ir: ComponentIR,
    componentName: string,
    nestedComponents: IRLoopChildComponent[]
  ): void {
    const inputTypeName = `${componentName}Input`
    lines.push(`// ${inputTypeName} is the user-facing input type.`)
    lines.push(`type ${inputTypeName} struct {`)
    lines.push('\tScopeID string // Optional: if empty, random ID is generated')

    // Collect nested component array field names to skip from propsParams
    const nestedArrayFields = new Set(nestedComponents.map(n => `${n.name}s`))

    // Add props params (excluding nested array fields)
    for (const param of ir.metadata.propsParams) {
      const fieldName = this.capitalizeFieldName(param.name)
      if (nestedArrayFields.has(fieldName)) continue
      const goType = this.typeInfoToGo(param.type, param.defaultValue)
      lines.push(`\t${fieldName} ${goType}`)
    }

    // Add nested component input arrays
    for (const nested of nestedComponents) {
      lines.push(`\t${nested.name}s []${nested.name}Input`)
    }

    lines.push('}')
    lines.push('')
  }

  /**
   * Generate Props struct for a component
   */
  private generatePropsStruct(
    lines: string[],
    ir: ComponentIR,
    componentName: string,
    nestedComponents: IRLoopChildComponent[]
  ): void {
    const propsTypeName = `${componentName}Props`
    lines.push(`// ${propsTypeName} is the props type for the ${componentName} component.`)
    lines.push(`type ${propsTypeName} struct {`)
    lines.push('\tScopeID string `json:"scopeID"`')

    // Collect nested component array field names to skip from propsParams
    const nestedArrayFields = new Set(nestedComponents.map(n => `${n.name}s`))

    for (const param of ir.metadata.propsParams) {
      const fieldName = this.capitalizeFieldName(param.name)
      // Skip if this field will be replaced by a typed array for nested components
      if (nestedArrayFields.has(fieldName)) continue
      const goType = this.typeInfoToGo(param.type, param.defaultValue)
      const jsonTag = this.toJsonTag(param.name)
      lines.push(`\t${fieldName} ${goType} \`json:"${jsonTag}"\``)
    }

    // Find signal types by looking at their initial values
    const propsParamMap = new Map(ir.metadata.propsParams.map(p => [p.name, p]))

    for (const signal of ir.metadata.signals) {
      const fieldName = this.capitalizeFieldName(signal.getter)
      const jsonTag = this.toJsonTag(signal.getter)
      // Infer type from initial value or referenced prop's type
      let goType: string
      const referencedProp = propsParamMap.get(signal.initialValue)
      if (referencedProp) {
        goType = this.typeInfoToGo(referencedProp.type, referencedProp.defaultValue)
      } else {
        goType = this.typeInfoToGo(signal.type, signal.initialValue)
      }
      lines.push(`\t${fieldName} ${goType} \`json:"${jsonTag}"\``)
    }

    // Add memos to Props (they are computed values needed for SSR)
    for (const memo of ir.metadata.memos) {
      const fieldName = this.capitalizeFieldName(memo.name)
      const jsonTag = this.toJsonTag(memo.name)
      // Memos that depend on number signals are usually numbers
      const goType = this.inferMemoType(memo, ir.metadata.signals, propsParamMap)
      lines.push(`\t${fieldName} ${goType} \`json:"${jsonTag}"\``)
    }

    // Add array fields for nested components (for template rendering)
    for (const nested of nestedComponents) {
      const jsonTag = this.toJsonTag(`${nested.name.charAt(0).toLowerCase()}${nested.name.slice(1)}s`)
      lines.push(`\t${nested.name}s []${nested.name}Props \`json:"${jsonTag}"\``)
    }

    lines.push('}')
    lines.push('')
  }

  /**
   * Generate NewXxxProps function
   */
  private generateNewPropsFunction(
    lines: string[],
    ir: ComponentIR,
    componentName: string,
    nestedComponents: IRLoopChildComponent[]
  ): void {
    const inputTypeName = `${componentName}Input`
    const propsTypeName = `${componentName}Props`

    lines.push(`// New${componentName}Props creates ${propsTypeName} from ${inputTypeName}.`)
    lines.push(`func New${componentName}Props(in ${inputTypeName}) ${propsTypeName} {`)
    lines.push('\tscopeID := in.ScopeID')
    lines.push('\tif scopeID == "" {')
    lines.push(`\t\tscopeID = "${componentName}_" + randomID(6)`)
    lines.push('\t}')
    lines.push('')

    // Handle nested components
    if (nestedComponents.length > 0) {
      for (const nested of nestedComponents) {
        const varName = `${nested.name.charAt(0).toLowerCase()}${nested.name.slice(1)}s`
        lines.push(`\t${varName} := make([]${nested.name}Props, len(in.${nested.name}s))`)
        lines.push(`\tfor i, item := range in.${nested.name}s {`)
        lines.push(`\t\t${varName}[i] = New${nested.name}Props(item)`)
        lines.push('\t}')
        lines.push('')
      }
    }

    lines.push(`\treturn ${propsTypeName}{`)
    lines.push('\t\tScopeID: scopeID,')

    // Collect nested component array field names
    const nestedArrayFields = new Set(nestedComponents.map(n => `${n.name}s`))

    // Add props params
    for (const param of ir.metadata.propsParams) {
      const fieldName = this.capitalizeFieldName(param.name)
      if (nestedArrayFields.has(fieldName)) continue
      lines.push(`\t\t${fieldName}: in.${fieldName},`)
    }

    // Add signal initial values
    for (const signal of ir.metadata.signals) {
      const fieldName = this.capitalizeFieldName(signal.getter)
      const initialValue = this.convertInitialValue(signal.initialValue, signal.type, ir.metadata.propsParams)
      lines.push(`\t\t${fieldName}: ${initialValue},`)
    }

    // Add nested component arrays
    for (const nested of nestedComponents) {
      const varName = `${nested.name.charAt(0).toLowerCase()}${nested.name.slice(1)}s`
      lines.push(`\t\t${nested.name}s: ${varName},`)
    }

    // Add memo initial values (computed from signal initial values)
    for (const memo of ir.metadata.memos) {
      const fieldName = this.capitalizeFieldName(memo.name)
      const memoValue = this.computeMemoInitialValue(memo, ir.metadata.signals, ir.metadata.propsParams)
      lines.push(`\t\t${fieldName}: ${memoValue},`)
    }

    lines.push('\t}')
    lines.push('}')
  }

  /**
   * Convert field name to JSON tag (camelCase)
   */
  private toJsonTag(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1)
  }

  /**
   * Find all nested components (loops with childComponent)
   */
  private findNestedComponents(node: IRNode): IRLoopChildComponent[] {
    const result: IRLoopChildComponent[] = []
    this.collectNestedComponents(node, result)
    return result
  }

  private collectNestedComponents(node: IRNode, result: IRLoopChildComponent[]): void {
    if (node.type === 'loop') {
      const loop = node as IRLoop
      if (loop.isStaticArray && loop.childComponent) {
        // Check for duplicates
        if (!result.some(c => c.name === loop.childComponent!.name)) {
          result.push(loop.childComponent)
        }
      }
      for (const child of loop.children) {
        this.collectNestedComponents(child, result)
      }
    } else if (node.type === 'element') {
      const element = node as IRElement
      for (const child of element.children) {
        this.collectNestedComponents(child, result)
      }
    } else if (node.type === 'fragment') {
      const fragment = node as IRFragment
      for (const child of fragment.children) {
        this.collectNestedComponents(child, result)
      }
    } else if (node.type === 'conditional') {
      const cond = node as IRConditional
      this.collectNestedComponents(cond.whenTrue, result)
      if (cond.whenFalse) {
        this.collectNestedComponents(cond.whenFalse, result)
      }
    }
  }

  /**
   * Convert JavaScript initial value to Go value for NewXxxProps function.
   * References to props params are converted to in.FieldName format.
   */
  private convertInitialValue(value: string, typeInfo: TypeInfo, propsParams?: { name: string }[]): string {
    // Check if it's a simple identifier (props param reference)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      // Check if this matches a props param
      if (propsParams?.some(p => p.name === value)) {
        return `in.${this.capitalizeFieldName(value)}`
      }
    }

    if (typeInfo.kind === 'primitive') {
      if (typeInfo.primitive === 'boolean') {
        return value === 'true' ? 'true' : 'false'
      }
      if (typeInfo.primitive === 'number') {
        // Check if it's a simple number
        if (/^\d+$/.test(value)) return value
        if (/^\d+\.\d+$/.test(value)) return value
        return '0'
      }
      if (typeInfo.primitive === 'string') {
        // Remove quotes if present and add Go string syntax
        if (value.startsWith("'") || value.endsWith("'")) {
          return value.replace(/'/g, '"')
        }
        if (value.startsWith('"') && value.endsWith('"')) {
          return value
        }
        return '""'
      }
    }

    // For arrays, use nil for complex JS expressions
    if (typeInfo.kind === 'array') {
      // Simple array literal or empty
      if (value === '[]' || value === 'null' || value === 'undefined') {
        return 'nil'
      }
      // Complex expression - use nil as placeholder
      return 'nil'
    }

    // Default for complex expressions
    return 'nil'
  }

  /**
   * Convert TypeInfo to Go type string.
   * If type is unknown, tries to infer from defaultValue.
   */
  private typeInfoToGo(typeInfo: TypeInfo, defaultValue?: string): string {
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
      case 'unknown':
        // Try to infer type from default value
        if (defaultValue !== undefined) {
          return this.inferTypeFromValue(defaultValue)
        }
        return 'interface{}'
      default:
        return 'interface{}'
    }
  }

  /**
   * Get signal's initial value as Go code.
   * Handles both literal values (0, true, "str") and props references (initial).
   */
  private getSignalInitialValueAsGo(initialValue: string, propsParams: { name: string }[]): string {
    // Check if it's a props param reference
    if (propsParams.some(p => p.name === initialValue)) {
      return `in.${this.capitalizeFieldName(initialValue)}`
    }

    // Check if it's a literal value
    // Number literals
    if (/^-?\d+$/.test(initialValue)) {
      return initialValue
    }
    if (/^-?\d+\.\d+$/.test(initialValue)) {
      return initialValue
    }
    // Boolean literals
    if (initialValue === 'true' || initialValue === 'false') {
      return initialValue
    }
    // String literals
    if ((initialValue.startsWith("'") && initialValue.endsWith("'")) ||
        (initialValue.startsWith('"') && initialValue.endsWith('"'))) {
      return initialValue.replace(/'/g, '"')
    }

    // Default: return 0 for unknown
    return '0'
  }

  /**
   * Compute the initial value for a memo based on its computation and signal initial values.
   * Handles simple cases like `() => count() * 2` → `in.Initial * 2`
   */
  private computeMemoInitialValue(
    memo: { name: string; computation: string; deps: string[] },
    signals: { getter: string; initialValue: string }[],
    propsParams: { name: string }[]
  ): string {
    const computation = memo.computation

    // Pattern: () => dep() * N or () => dep() + N etc.
    const arithmeticMatch = computation.match(/\(\)\s*=>\s*(\w+)\(\)\s*([*+\-/])\s*(\d+)/)
    if (arithmeticMatch) {
      const [, depName, operator, operand] = arithmeticMatch
      const signal = signals.find(s => s.getter === depName)
      if (signal) {
        // Get the signal's initial value in Go format
        const signalInitial = this.getSignalInitialValueAsGo(signal.initialValue, propsParams)
        return `${signalInitial} ${operator} ${operand}`
      }
    }

    // Pattern: () => dep() (just return the signal value)
    const simpleMatch = computation.match(/\(\)\s*=>\s*(\w+)\(\)$/)
    if (simpleMatch) {
      const [, depName] = simpleMatch
      const signal = signals.find(s => s.getter === depName)
      if (signal) {
        return this.getSignalInitialValueAsGo(signal.initialValue, propsParams)
      }
    }

    // Default: return 0 for unknown computations
    return '0'
  }

  /**
   * Infer the Go type for a memo based on its computation and dependencies.
   */
  private inferMemoType(
    memo: { name: string; computation: string; type: TypeInfo; deps: string[] },
    signals: { getter: string; initialValue: string; type: TypeInfo }[],
    propsParamMap: Map<string, { name: string; type: TypeInfo; defaultValue?: string }>
  ): string {
    // Check if computation involves multiplication (*) - likely number
    if (memo.computation.includes('*') || memo.computation.includes('/') ||
        memo.computation.includes('+') || memo.computation.includes('-')) {
      // Check if deps are number-typed signals
      for (const dep of memo.deps) {
        const signal = signals.find(s => s.getter === dep)
        if (signal) {
          const referencedProp = propsParamMap.get(signal.initialValue)
          if (referencedProp) {
            const propType = this.typeInfoToGo(referencedProp.type, referencedProp.defaultValue)
            if (propType === 'int' || propType === 'float64') {
              return 'int'
            }
          }
          // Check signal's own initial value
          const signalType = this.typeInfoToGo(signal.type, signal.initialValue)
          if (signalType === 'int' || signalType === 'float64') {
            return 'int'
          }
        }
      }
    }

    // Default to the memo's declared type
    return this.typeInfoToGo(memo.type)
  }

  /**
   * Infer Go type from a JavaScript value literal.
   */
  private inferTypeFromValue(value: string): string {
    // Boolean literals
    if (value === 'true' || value === 'false') return 'bool'
    // Number literals (int)
    if (/^-?\d+$/.test(value)) return 'int'
    // Number literals (float)
    if (/^-?\d+\.\d+$/.test(value)) return 'float64'
    // String literals
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      return 'string'
    }
    // Empty string
    if (value === '""' || value === "''") return 'string'
    // Array literals
    if (value.startsWith('[')) return '[]interface{}'
    // Default
    return 'interface{}'
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

    // Handle filter().length pattern: todos().filter(t => t.done).length -> .DoneCount
    // This requires server-side pre-computation
    const filterLengthMatch = expr.match(/(\w+)\(\)\.filter\([^)]+\)\.length/)
    if (filterLengthMatch) {
      // Convert to a pre-computed field name
      // todos().filter(t => t.done).length -> .DoneCount
      return '.DoneCount'
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

    // If reactive (has slotId), wrap each branch with cond marker
    if (cond.slotId) {
      const whenTrueWrapped = this.wrapWithCondMarker(whenTrue, cond.slotId)
      let result = `{{if ${goCondition}}}${whenTrueWrapped}`

      if (cond.whenFalse) {
        // Skip null/undefined branches
        if (cond.whenFalse.type === 'expression') {
          const exprNode = cond.whenFalse as IRExpression
          if (exprNode.expr !== 'null' && exprNode.expr !== 'undefined') {
            const whenFalse = this.renderNode(cond.whenFalse)
            const whenFalseWrapped = this.wrapWithCondMarker(whenFalse, cond.slotId)
            result += `{{else}}${whenFalseWrapped}`
          }
        } else {
          const whenFalse = this.renderNode(cond.whenFalse)
          const whenFalseWrapped = this.wrapWithCondMarker(whenFalse, cond.slotId)
          result += `{{else}}${whenFalseWrapped}`
        }
      }

      result += '{{end}}'
      return result
    }

    // Non-reactive: original logic
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

    // Handle complex logical expressions with && and ||
    if (cond.includes('&&') || cond.includes('||')) {
      return this.convertLogicalExpression(cond)
    }

    // Handle negation: !showCounter -> not .ShowCounter
    if (cond.startsWith('!')) {
      const inner = cond.slice(1).trim()
      const innerGo = this.convertConditionToGo(inner)
      return `not ${innerGo}`
    }

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

  private convertLogicalExpression(expr: string): string {
    // Split by && (AND) first, then handle || (OR)
    // Handle: !showCounter && !showMessage

    // Check for && (AND)
    if (expr.includes('&&')) {
      const parts = expr.split('&&').map(p => p.trim())
      const goParts = parts.map(p => {
        const converted = this.convertConditionToGo(p)
        // Wrap in parentheses if it's a function call like 'not .X'
        if (converted.startsWith('not ') || converted.startsWith('and ') || converted.startsWith('or ')) {
          return `(${converted})`
        }
        return converted
      })
      // Build nested and: and (a) (b)
      if (goParts.length === 2) {
        return `and ${goParts[0]} ${goParts[1]}`
      }
      return goParts.reduce((acc, part) => {
        if (!acc) return part
        return `and (${acc}) ${part}`
      }, '')
    }

    // Check for || (OR)
    if (expr.includes('||')) {
      const parts = expr.split('||').map(p => p.trim())
      const goParts = parts.map(p => {
        const converted = this.convertConditionToGo(p)
        if (converted.startsWith('not ') || converted.startsWith('and ') || converted.startsWith('or ')) {
          return `(${converted})`
        }
        return converted
      })
      if (goParts.length === 2) {
        return `or ${goParts[0]} ${goParts[1]}`
      }
      return goParts.reduce((acc, part) => {
        if (!acc) return part
        return `or (${acc}) ${part}`
      }, '')
    }

    return this.convertConditionToGo(expr)
  }

  renderLoop(loop: IRLoop): string {
    let goArray = this.convertExpressionToGo(loop.array)
    const param = loop.param
    const index = loop.index || '_'

    // Check if the loop contains a component child
    // If so, use .{ComponentName}s which has ScopeID for each item
    // e.g., TodoItem children use .TodoItems, ToggleItem children use .ToggleItems
    const childComponent = this.findChildComponent(loop.children)
    if (childComponent) {
      goArray = `.${childComponent.name}s`
    }

    this.inLoop = true
    const children = this.renderChildren(loop.children)
    this.inLoop = false

    return `{{range $${index}, $${param} := ${goArray}}}${children}{{end}}`
  }

  /**
   * Find the first component child in a list of nodes
   */
  private findChildComponent(nodes: IRNode[]): IRComponent | null {
    for (const node of nodes) {
      if (node.type === 'component') {
        return node as IRComponent
      }
      // Check children of elements
      if (node.type === 'element' && (node as IRElement).children) {
        const found = this.findChildComponent((node as IRElement).children)
        if (found) return found
      }
      // Check children of fragments
      if (node.type === 'fragment' && (node as IRFragment).children) {
        const found = this.findChildComponent((node as IRFragment).children)
        if (found) return found
      }
    }
    return null
  }

  renderComponent(comp: IRComponent): string {
    // In Go templates, components are rendered using {{template "name" data}}
    if (this.inLoop) {
      // Loop children: dot becomes loop item (already has correct props)
      return `{{template "${comp.name}" .}}`
    }
    // Static children: access via .ChildName field
    return `{{template "${comp.name}" .${comp.name}}}`
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
      } else if (typeof attr.value === 'object' && attr.value.type === 'template-literal') {
        // Template literal with structured ternaries
        const output = this.renderTemplateLiteral(attr.value)
        parts.push(`${attr.name}="${output}"`)
      } else if (attr.dynamic) {
        const value = attr.value as string
        // Check for ternary operator: cond ? 'a' : 'b'
        const ternaryMatch = value.match(/^(.+?)\s*\?\s*['"](.+?)['"]\s*:\s*['"](.+?)['"]$/)
        if (ternaryMatch) {
          const [, condition, trueVal, falseVal] = ternaryMatch
          const goCond = this.convertConditionToGo(condition)
          parts.push(`${attr.name}="{{if ${goCond}}}${trueVal}{{else}}${falseVal}{{end}}"`)
        } else {
          const goValue = this.convertExpressionToGo(value)
          parts.push(`${attr.name}="{{${goValue}}}"`)
        }
      } else {
        parts.push(`${attr.name}="${attr.value}"`)
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : ''
  }

  private renderTemplateLiteral(literal: IRTemplateLiteral): string {
    let output = ''
    for (const part of literal.parts) {
      if (part.type === 'string') {
        output += part.value
      } else if (part.type === 'ternary') {
        const goCond = this.convertConditionToGo(part.condition)
        output += `{{if ${goCond}}}${part.whenTrue}{{else}}${part.whenFalse}{{end}}`
      }
    }
    return output
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

  private wrapWithCondMarker(content: string, condId: string): string {
    // If content is an HTML element, add data-bf-cond attribute
    if (content.startsWith('<')) {
      const match = content.match(/^<(\w+)/)
      if (match) {
        return content.replace(`<${match[1]}`, `<${match[1]} ${this.renderCondMarker(condId)}`)
      }
    }
    // Text: use bfComment function to output comment markers
    // Go's html/template strips raw HTML comments, so we use a custom function
    // bfComment automatically adds "bf-" prefix, so "cond-start:x" becomes "<!--bf-cond-start:x-->"
    return `{{bfComment "cond-start:${condId}"}}${content}{{bfComment "cond-end:${condId}"}}`
  }
}

export const goTemplateAdapter = new GoTemplateAdapter()
