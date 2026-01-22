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
  CompilerError,
  SourceLocation,
} from '@barefootjs/jsx'
import { BaseAdapter, type AdapterOutput, isBooleanAttr } from '@barefootjs/jsx'
import { parseExpression, isSupported, type ParsedExpr } from './expression-parser'

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
  private errors: CompilerError[] = []

  constructor(options: GoTemplateAdapterOptions = {}) {
    super()
    this.options = {
      packageName: options.packageName ?? 'components',
    }
  }

  generate(ir: ComponentIR): AdapterOutput {
    this.componentName = ir.metadata.componentName
    this.errors = []

    const templateBody = this.renderNode(ir.root)
    const template = `{{define "${this.componentName}"}}\n${templateBody}\n{{end}}\n`
    const types = this.generateTypes(ir)

    // Merge collected errors into IR errors
    if (this.errors.length > 0) {
      ir.errors.push(...this.errors)
    }

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
    // Handle @client directive - render as template with data-bf-client attribute
    if (expr.clientOnly) {
      return this.renderClientOnlyExpression(expr)
    }

    const goExpr = this.convertExpressionToGo(expr.expr)

    if (expr.reactive && expr.slotId) {
      return `<span ${this.renderSlotMarker(expr.slotId)}>{{${goExpr}}}</span>`
    }

    return `{{${goExpr}}}`
  }

  /**
   * Render a client-only expression as a template element.
   * Used when @client directive is applied to an unsupported expression.
   */
  private renderClientOnlyExpression(expr: IRExpression): string {
    // Escape the expression for HTML attribute
    const escapedExpr = this.escapeForAttribute(expr.expr)
    return `<template data-bf-client="${escapedExpr}"></template>`
  }

  /**
   * Escape a string for use in an HTML attribute.
   */
  private escapeForAttribute(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Render a client-only conditional as a template element.
   * Used when @client directive is applied to an unsupported conditional.
   */
  private renderClientOnlyConditional(cond: IRConditional): string {
    const whenTrue = this.renderNode(cond.whenTrue)
    const escapedCondition = this.escapeForAttribute(cond.condition)
    // Render the whenTrue content inside a template element
    // The client JS will evaluate the condition and show/hide accordingly
    return `<template data-bf-client="${escapedCondition}">${whenTrue}</template>`
  }

  /**
   * Render a ParsedExpr to Go template syntax.
   */
  private renderParsedExpr(expr: ParsedExpr): string {
    switch (expr.kind) {
      case 'identifier':
        return `.${this.capitalizeFieldName(expr.name)}`

      case 'literal':
        if (expr.literalType === 'string') {
          return `"${expr.value}"`
        }
        if (expr.literalType === 'null') {
          return '""'
        }
        return String(expr.value)

      case 'call': {
        // Handle signal calls: count() -> .Count
        if (expr.callee.kind === 'identifier' && expr.args.length === 0) {
          return `.${this.capitalizeFieldName(expr.callee.name)}`
        }
        // Handle method calls on objects: items().length is handled by member
        // For other calls, render callee and args
        const callee = this.renderParsedExpr(expr.callee)
        if (expr.args.length === 0) {
          return callee
        }
        // Function calls with args - this is unusual in templates
        const args = expr.args.map(a => this.renderParsedExpr(a)).join(' ')
        return `${callee} ${args}`
      }

      case 'member': {
        const obj = this.renderParsedExpr(expr.object)
        // Handle .length -> len
        if (expr.property === 'length') {
          // If object already starts with . (like .Items), use "len .Items"
          if (obj.startsWith('.')) {
            return `len ${obj}`
          }
          return `len ${obj}`
        }
        // Normal property access: .User.Name
        return `${obj}.${this.capitalizeFieldName(expr.property)}`
      }

      case 'binary': {
        const left = this.renderParsedExpr(expr.left)
        const right = this.renderParsedExpr(expr.right)

        // Comparison operators -> Go template functions
        switch (expr.op) {
          case '===':
          case '==':
            return `eq ${left} ${right}`
          case '!==':
          case '!=':
            return `ne ${left} ${right}`
          case '>':
            return `gt ${left} ${right}`
          case '<':
            return `lt ${left} ${right}`
          case '>=':
            return `ge ${left} ${right}`
          case '<=':
            return `le ${left} ${right}`

          // Arithmetic operators -> runtime functions
          case '+':
            return `bf_add ${left} ${right}`
          case '-':
            return `bf_sub ${left} ${right}`
          case '*':
            return `bf_mul ${left} ${right}`
          case '/':
            return `bf_div ${left} ${right}`
          case '%':
            return `bf_mod ${left} ${right}`

          default:
            return `${left} ${expr.op} ${right}`
        }
      }

      case 'unary': {
        const arg = this.renderParsedExpr(expr.argument)
        if (expr.op === '!') {
          return `not ${arg}`
        }
        if (expr.op === '-') {
          return `bf_neg ${arg}`
        }
        return arg
      }

      case 'logical': {
        const left = this.renderParsedExpr(expr.left)
        const right = this.renderParsedExpr(expr.right)
        // Wrap in parentheses if needed for complex expressions
        const wrapLeft = this.needsParens(expr.left) ? `(${left})` : left
        const wrapRight = this.needsParens(expr.right) ? `(${right})` : right
        if (expr.op === '&&') {
          return `and ${wrapLeft} ${wrapRight}`
        }
        return `or ${wrapLeft} ${wrapRight}`
      }

      case 'conditional': {
        const test = this.renderParsedExpr(expr.test)
        // Nested conditionals already return complete {{if}}...{{end}} blocks
        // Literals return bare text (used within attributes)
        const consequent = this.renderConditionalBranch(expr.consequent)
        const alternate = this.renderConditionalBranch(expr.alternate)
        return `{{if ${test}}}${consequent}{{else}}${alternate}{{end}}`
      }

      case 'template-literal': {
        let result = ''
        for (const part of expr.parts) {
          if (part.type === 'string') {
            result += part.value
          } else {
            const partExpr = this.renderParsedExpr(part.expr)
            result += `{{${partExpr}}}`
          }
        }
        return result
      }

      case 'unsupported':
        // This should not happen if isSupported was checked
        return `[UNSUPPORTED: ${expr.raw}]`
    }
  }

  /**
   * Check if expression needs parentheses when used in and/or.
   */
  private needsParens(expr: ParsedExpr): boolean {
    return expr.kind === 'logical' || expr.kind === 'unary' || expr.kind === 'conditional'
  }

  /**
   * Render a branch of a conditional expression.
   * String literals render as bare text (no quotes).
   * Nested conditionals render as complete {{if}}...{{end}} blocks.
   */
  private renderConditionalBranch(expr: ParsedExpr): string {
    if (expr.kind === 'literal' && expr.literalType === 'string') {
      // String literals return as bare text
      return String(expr.value)
    }
    if (expr.kind === 'conditional') {
      // Nested ternary renders as complete Go template block
      const test = this.renderParsedExpr(expr.test)
      const consequent = this.renderConditionalBranch(expr.consequent)
      const alternate = this.renderConditionalBranch(expr.alternate)
      return `{{if ${test}}}${consequent}{{else}}${alternate}{{end}}`
    }
    // Other expressions render normally with {{...}} wrapper
    return `{{${this.renderParsedExpr(expr)}}}`
  }

  /**
   * Check if a ParsedExpr renders to a Go template function call that needs parentheses.
   * In Go templates, function calls like `len .X` or `bf_add .A .B` need parentheses
   * when used as arguments to comparison operators (eq, gt, lt, etc.).
   */
  private needsParensInGoTemplate(expr: ParsedExpr): boolean {
    switch (expr.kind) {
      case 'member':
        // .length becomes `len .X` which is a function call
        return expr.property === 'length'

      case 'binary':
        // Arithmetic operators become function calls (bf_add, bf_sub, etc.)
        return ['+', '-', '*', '/', '%'].includes(expr.op)

      case 'unary':
        // Negation becomes `bf_neg .X`
        return expr.op === '-'

      default:
        return false
    }
  }

  /**
   * Convert a JS expression to Go template syntax.
   */
  private convertExpressionToGo(jsExpr: string): string {
    const trimmed = jsExpr.trim()

    // Handle null/undefined specially
    if (trimmed === 'null' || trimmed === 'undefined') {
      return '""'
    }

    const parsed = parseExpression(trimmed)
    const support = isSupported(parsed)

    if (!support.supported) {
      // Log error and return Go template comment (safe for parsing)
      this.errors.push({
        code: 'BF101',
        severity: 'error',
        message: `Expression not supported: ${trimmed}`,
        loc: this.makeLoc(),
        suggestion: {
          message: support.reason
            ? `${support.reason}\n\nOptions:\n1. Use @client directive for client-side evaluation\n2. Pre-compute the value in Go code`
            : 'Options:\n1. Use @client directive for client-side evaluation\n2. Pre-compute the value in Go code',
        },
      })
      // Return empty string - Go template comments must be separate actions
      return `""`
    }

    return this.renderParsedExpr(parsed)
  }

  /**
   * Create a source location for error reporting.
   */
  private makeLoc(): SourceLocation {
    return {
      file: this.componentName + '.tsx',
      start: { line: 1, column: 0 },
      end: { line: 1, column: 0 },
    }
  }

  renderConditional(cond: IRConditional): string {
    // Handle @client directive - render as template with data-bf-client attribute
    if (cond.clientOnly) {
      return this.renderClientOnlyConditional(cond)
    }

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

  /**
   * Convert a JS condition to Go template condition syntax.
   */
  private convertConditionToGo(jsCondition: string): string {
    const trimmed = jsCondition.trim()
    const parsed = parseExpression(trimmed)
    const support = isSupported(parsed)

    if (!support.supported) {
      this.errors.push({
        code: 'BF102',
        severity: 'error',
        message: `Condition not supported: ${trimmed}`,
        loc: this.makeLoc(),
        suggestion: {
          message: support.reason
            ? `${support.reason}\n\nOptions:\n1. Use @client directive for client-side evaluation\n2. Pre-compute the value in Go code`
            : 'Expression contains unsupported syntax',
        },
      })
      // Return false - Go template comments must be separate actions
      return `false`
    }

    return this.renderConditionExpr(parsed)
  }

  /**
   * Render a ParsedExpr as a Go template condition.
   */
  private renderConditionExpr(expr: ParsedExpr): string {
    switch (expr.kind) {
      case 'identifier':
        return `.${this.capitalizeFieldName(expr.name)}`

      case 'literal':
        if (expr.literalType === 'string') {
          return `"${expr.value}"`
        }
        if (expr.literalType === 'null') {
          return '""'
        }
        return String(expr.value)

      case 'call': {
        // Signal call: count() -> .Count
        if (expr.callee.kind === 'identifier' && expr.args.length === 0) {
          return `.${this.capitalizeFieldName(expr.callee.name)}`
        }
        return this.renderParsedExpr(expr)
      }

      case 'member': {
        const obj = this.renderConditionExpr(expr.object)
        if (expr.property === 'length') {
          return `len ${obj}`
        }
        return `${obj}.${this.capitalizeFieldName(expr.property)}`
      }

      case 'binary': {
        // Check if left operand needs parentheses (e.g., function calls in Go template)
        const leftNeedsParens = this.needsParensInGoTemplate(expr.left)
        let left = this.renderConditionExpr(expr.left)
        if (leftNeedsParens) {
          left = `(${left})`
        }

        const rightNeedsParens = this.needsParensInGoTemplate(expr.right)
        let right = this.renderConditionExpr(expr.right)
        if (rightNeedsParens) {
          right = `(${right})`
        }

        switch (expr.op) {
          case '===':
          case '==':
            return `eq ${left} ${right}`
          case '!==':
          case '!=':
            return `ne ${left} ${right}`
          case '>':
            return `gt ${left} ${right}`
          case '<':
            return `lt ${left} ${right}`
          case '>=':
            return `ge ${left} ${right}`
          case '<=':
            return `le ${left} ${right}`
          // Arithmetic in conditions
          case '+':
            return `bf_add ${left} ${right}`
          case '-':
            return `bf_sub ${left} ${right}`
          case '*':
            return `bf_mul ${left} ${right}`
          case '/':
            return `bf_div ${left} ${right}`
          default:
            return `${left} ${expr.op} ${right}`
        }
      }

      case 'unary': {
        const arg = this.renderConditionExpr(expr.argument)
        if (expr.op === '!') {
          return `not ${arg}`
        }
        if (expr.op === '-') {
          return `bf_neg ${arg}`
        }
        return arg
      }

      case 'logical': {
        const left = this.renderConditionExpr(expr.left)
        const right = this.renderConditionExpr(expr.right)
        // Wrap in parentheses if needed
        const wrapLeft = this.needsParens(expr.left) ? `(${left})` : left
        const wrapRight = this.needsParens(expr.right) ? `(${right})` : right
        if (expr.op === '&&') {
          return `and ${wrapLeft} ${wrapRight}`
        }
        return `or ${wrapLeft} ${wrapRight}`
      }

      case 'conditional': {
        // Ternary in condition: (cond ? a : b) is unusual but handle it
        const test = this.renderConditionExpr(expr.test)
        return test // Just return the test part for condition context
      }

      case 'template-literal':
        // Template literals as conditions are unusual
        return this.renderParsedExpr(expr)

      case 'unsupported':
        return expr.raw
    }
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

      // Convert JSX className to HTML class attribute
      const attrName = attr.name === 'className' ? 'class' : attr.name

      if (attr.value === null) {
        // Boolean attribute
        parts.push(attrName)
      } else if (typeof attr.value === 'object' && attr.value.type === 'template-literal') {
        // Template literal with structured ternaries
        const output = this.renderTemplateLiteral(attr.value)
        parts.push(`${attrName}="${output}"`)
      } else if (attr.dynamic) {
        const value = attr.value as string
        if (isBooleanAttr(attrName)) {
          // Boolean attrs: render attr name only when truthy, omit when falsy
          const goCond = this.convertConditionToGo(value)
          parts.push(`{{if ${goCond}}}${attrName}{{end}}`)
        } else {
          // Check for ternary/conditional expressions using the parser
          const parsed = parseExpression(value.trim())
          if (parsed.kind === 'conditional') {
            // Conditional expressions return complete Go template syntax
            const goValue = this.renderParsedExpr(parsed)
            parts.push(`${attrName}="${goValue}"`)
          } else {
            const goValue = this.convertExpressionToGo(value)
            parts.push(`${attrName}="{{${goValue}}}"`)
          }
        }
      } else {
        parts.push(`${attrName}="${attr.value}"`)
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
