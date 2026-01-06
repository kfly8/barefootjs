/**
 * JSX Compiler - Template String Generator
 *
 * Converts JSX elements within map expressions to template literal strings.
 * Event handlers are converted to data-index and data-event-id attributes,
 * and component tags are inlined.
 */

import ts from 'typescript'
import type { CompileResult, TemplateStringResult, IRNode, IRElement, IRText, IRExpression, IRComponent, IRConditional, IRFragment } from '../types'
import { isPascalCase } from '../utils/helpers'
import { substitutePropCallsAST, substituteIdentifiersAST } from '../extractors/expression'

/**
 * Boolean HTML attributes that should only be present when truthy.
 * When value is false, the attribute should be omitted entirely.
 */
/**
 * Escapes backticks for nesting inside another template literal.
 * When embedding a template literal result inside another template literal,
 * only backticks need to be escaped. ${...} expressions should remain
 * uneescaped so they are evaluated within the nested template.
 */
function escapeForNestedTemplate(str: string): string {
  return str.replace(/`/g, '\\`')
}

const BOOLEAN_HTML_ATTRS = new Set([
  'disabled',
  'readonly',
  'checked',
  'selected',
  'multiple',
  'autofocus',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'required',
  'hidden',
  'open',
  'novalidate',
  'formnovalidate',
  'async',
  'defer',
  'ismap',
  'reversed',
  'scoped',
  'itemscope',
])

/**
 * Normalizes JSX text following React-like whitespace rules:
 * 1. Pure indentation (starts with newline) is removed
 * 2. Inline spaces only (spaces/tabs without newlines) are preserved
 * 3. Leading/trailing whitespace with newlines is trimmed
 * 4. Internal newlines are converted to single space
 */
function normalizeJsxText(rawText: string): string {
  // If text is only whitespace
  if (/^\s*$/.test(rawText)) {
    // Pure indentation (starts with newline) - skip it
    if (rawText.startsWith('\n') || rawText.startsWith('\r')) {
      return ''
    }
    // Inline spaces (e.g., " " between elements) - preserve
    if (/^[ \t]+$/.test(rawText)) {
      return rawText
    }
    // Other whitespace patterns with embedded newlines - skip
    return ''
  }

  // Normalize: collapse leading/trailing whitespace with newlines, preserve inline spaces
  return rawText
    // Remove leading whitespace that includes newlines
    .replace(/^[\t ]*\n[\s]*/, '')
    // Remove trailing whitespace that includes newlines
    .replace(/[\s]*\n[\t ]*$/, '')
    // Convert internal newlines to single space
    .replace(/\s*\n\s*/g, ' ')
}

/**
 * Converts JSX element to template literal string.
 * <li>{item}</li> → `<li>${item}</li>`
 */
export function jsxToTemplateString(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
  paramName: string,
  components: Map<string, CompileResult> = new Map()
): TemplateStringResult {
  const events: Array<{ eventId: number; eventName: string; handler: string }> = []
  let eventIdCounter = 0

  /**
   * Converts IR to HTML template string.
   * Defined inside jsxToTemplateString to access events array and eventIdCounter.
   *
   * @param rootEventAttrs - Pre-built event attributes string (e.g., ' data-index="${__index}" data-event-id="0"')
   *                        for injecting into the root element. Used when inlining components that have
   *                        event handlers passed from parent (e.g., <Button onClick={...}>).
   *                        The events are registered separately in the events array by the caller.
   * @param restPropsToExpand - Map of rest props to expand when encountering spreadAttrs.
   *                           Key is the prop name, value is the expression. Used when inlining
   *                           components that use {...props} spread (e.g., Button passing disabled to <button>).
   */
  function irToHtmlTemplate(
    ir: IRNode,
    propsMap: Map<string, string>,
    keyAttr?: string,
    isRoot: boolean = true,
    rootEventAttrs: string = '',
    restPropsToExpand: Map<string, string> = new Map()
  ): string {
    /**
     * Substitutes prop references in expression using AST transformation.
     * Handles both prop function calls and simple identifier references.
     */
    function substituteProps(expr: string): string {
      // First, handle prop function calls (e.g., onToggle() → expanded body)
      let result = substitutePropCallsAST(expr, propsMap)
      // Then, handle simple identifier references (e.g., item → todo)
      result = substituteIdentifiersAST(result, propsMap)
      return result
    }

    function processIRNode(node: IRNode, injectDataKey: boolean = false): string {
      switch (node.type) {
        case 'element': {
          const el = node as IRElement
          const dataKeyAttr = injectDataKey && keyAttr ? ` data-key="\${${keyAttr}}"` : ''

          // Inject event attributes from parent component (e.g., onClick passed to <Button>).
          // These are pre-built by inlineComponent and passed down to be added to the root element.
          // This enables event delegation for inlined components in list templates.
          const injectedEventAttrs = injectDataKey ? rootEventAttrs : ''

          // Build attributes
          let attrs = ''
          let eventAttrs = ''
          let elementEventId: number | null = null

          for (const attr of el.staticAttrs) {
            const attrName = attr.name === 'class' ? 'class' : attr.name
            attrs += ` ${attrName}="${attr.value}"`
          }
          for (const attr of el.dynamicAttrs) {
            const expr = substituteProps(attr.expression)
            const attrNameLower = attr.name.toLowerCase()
            if (BOOLEAN_HTML_ATTRS.has(attrNameLower)) {
              // Boolean attrs should only be present when truthy
              attrs += `\${${expr} ? ' ${attr.name}' : ''}`
            } else if (expr.startsWith('__STATIC_CLASS__')) {
              // Static class value from CVA pattern - output directly without template expression
              const staticValue = expr.slice('__STATIC_CLASS__'.length)
              attrs += ` ${attr.name}="${staticValue}"`
            } else {
              attrs += ` ${attr.name}="\${${expr}}"`
            }
          }

          // Expand spread attributes ({...props}) with actual prop values.
          // When inlining a component that uses {...props} spread, we need to expand
          // the rest props from the parent component into individual attributes.
          if (el.spreadAttrs && el.spreadAttrs.length > 0 && restPropsToExpand.size > 0) {
            for (const [propName, propExpr] of restPropsToExpand) {
              const propNameLower = propName.toLowerCase()
              if (BOOLEAN_HTML_ATTRS.has(propNameLower)) {
                // Boolean attrs should only be present when truthy
                attrs += `\${${propExpr} ? ' ${propName}' : ''}`
              } else {
                attrs += ` ${propName}="\${${propExpr}}"`
              }
            }
          }

          // Handle events - convert to data-index and data-event-id for list item delegation
          for (const event of el.events) {
            const eventName = event.name.replace(/^on/, '').toLowerCase()
            let handler = substituteProps(event.handler)
            if (elementEventId === null) {
              elementEventId = eventIdCounter++
              eventAttrs = ` data-index="\${__index}" data-event-id="${elementEventId}"`
            }
            events.push({ eventId: elementEventId, eventName, handler })
          }

          // Build children
          let children = ''
          for (const child of el.children) {
            children += processIRNode(child, false)
          }

          if (el.children.length === 0 && !children) {
            return `<${el.tagName}${dataKeyAttr}${injectedEventAttrs}${eventAttrs}${attrs} />`
          }
          return `<${el.tagName}${dataKeyAttr}${injectedEventAttrs}${eventAttrs}${attrs}>${children}</${el.tagName}>`
        }

        case 'text': {
          const text = node as IRText
          return text.content
        }

        case 'expression': {
          const expr = node as IRExpression
          const substituted = substituteProps(expr.expression)
          return `\${${substituted}}`
        }

        case 'component': {
          // Nested components - for now return empty (would need recursive inline)
          return ''
        }

        case 'conditional': {
          const cond = node as IRConditional
          const condition = substituteProps(cond.condition)
          const whenTrue = processIRNode(cond.whenTrue, false)
          const whenFalse = cond.whenFalse ? processIRNode(cond.whenFalse, false) : ''
          // Escape inner template literal characters to prevent syntax errors in nested templates
          const escapedTrue = escapeForNestedTemplate(whenTrue)
          const escapedFalse = escapeForNestedTemplate(whenFalse)
          return `\${${condition} ? \`${escapedTrue}\` : \`${escapedFalse}\`}`
        }

        case 'fragment': {
          const frag = node as IRFragment
          return frag.children.map(c => processIRNode(c, false)).join('')
        }

        default:
          return ''
      }
    }

    return processIRNode(ir, isRoot)
  }

  /**
   * Processes expression (detects and converts JSX within ternary operators)
   */
  function processExpression(expr: ts.Expression): string {
    // Ternary operator case
    if (ts.isConditionalExpression(expr)) {
      const condition = expr.condition.getText(sourceFile)
      const whenTrue = processExpressionOrJsx(expr.whenTrue)
      const whenFalse = processExpressionOrJsx(expr.whenFalse)
      return `\${${condition} ? ${whenTrue} : ${whenFalse}}`
    }

    // ParenthesizedExpression case
    if (ts.isParenthesizedExpression(expr)) {
      return processExpression(expr.expression)
    }

    // Other expressions are output as-is
    return `\${${expr.getText(sourceFile)}}`
  }

  /**
   * Processes expression or JSX
   */
  function processExpressionOrJsx(node: ts.Expression): string {
    // Convert JSX elements to template string
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      return `\`${processNode(node)}\``
    }

    // Parenthesized expression case
    if (ts.isParenthesizedExpression(node)) {
      return processExpressionOrJsx(node.expression)
    }

    // Other expressions as-is
    return node.getText(sourceFile)
  }

  /**
   * Extracts props and events from component's JSX attributes.
   * Handles both regular props and spread attributes.
   * For spread attributes, generates mappings like `name` → `spreadExpr.name`
   * based on the component's expected props.
   *
   * Returns both props (for substitution) and events (for event delegation).
   */
  function extractComponentPropsAndEvents(
    attributes: ts.JsxAttributes,
    sf: ts.SourceFile,
    componentExpectedProps?: Array<{ name: string }>
  ): { props: Map<string, string>; componentEvents: Array<{ name: string; handler: string }> } {
    const props = new Map<string, string>()
    const componentEvents: Array<{ name: string; handler: string }> = []

    // First, collect spread expressions
    const spreadExprs: string[] = []
    attributes.properties.forEach((attr) => {
      if (ts.isJsxSpreadAttribute(attr)) {
        spreadExprs.push(attr.expression.getText(sf))
      }
    })

    // If there are spread attributes and we know expected props, create mappings
    if (spreadExprs.length > 0 && componentExpectedProps) {
      for (const expectedProp of componentExpectedProps) {
        // For spread, each expected prop gets mapped to spreadExpr.propName
        // Use the last spread expression (later spreads override earlier ones)
        const spreadExpr = spreadExprs[spreadExprs.length - 1]
        props.set(expectedProp.name, `${spreadExpr}.${expectedProp.name}`)
      }
    }

    // Build set of explicit prop names for checking if an event-like prop is a callback
    const explicitPropNames = new Set(componentExpectedProps?.map(p => p.name) || [])

    // Then process regular attributes (which override spread values)
    attributes.properties.forEach((attr) => {
      if (ts.isJsxAttribute(attr) && attr.name) {
        const propName = attr.name.getText(sf)
        if (attr.initializer) {
          // Check if this looks like an event handler AND is NOT an explicit prop
          // - onClick on <Button> → not explicit, extract as event for delegation
          // - onToggle on <TodoItem> → explicit callback prop, treat as regular prop
          const isEventLike = propName.startsWith('on') && propName.length > 2
          const isExplicitProp = explicitPropNames.has(propName)

          if (isEventLike && !isExplicitProp) {
            // Event handler for spread - extract for event delegation
            if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const eventName = propName.slice(2).toLowerCase()
              const handler = attr.initializer.expression.getText(sf)
              componentEvents.push({ name: eventName, handler })
            }
          } else if (ts.isStringLiteral(attr.initializer)) {
            props.set(propName, `"${attr.initializer.text}"`)
          } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            props.set(propName, attr.initializer.expression.getText(sf))
          }
        }
      }
    })
    return { props, componentEvents }
  }

  /**
   * Inlines a component.
   * Uses IR to generate template when available (more reliable for same-file components).
   * Falls back to source parsing if IR is not available.
   *
   * @param componentEvents - Events passed from parent to this component (e.g., onClick handlers)
   *                         These need to be attached to the root element of the inlined component.
   */
  function inlineComponent(
    componentResult: CompileResult,
    propsMap: Map<string, string>,
    componentEvents: Array<{ name: string; handler: string }> = []
  ): string {
    // Extract key prop for data-key attribute on root element
    const keyAttr = propsMap.get('key')
    if (keyAttr) {
      propsMap.delete('key')  // Don't substitute 'key' as a regular prop
    }

    // Add default values for props that aren't explicitly passed
    // This ensures that props like `inputDisabled = false` are resolved correctly
    for (const prop of componentResult.props) {
      if (!propsMap.has(prop.name) && prop.defaultValue !== undefined) {
        propsMap.set(prop.name, prop.defaultValue)
      }
    }

    // Handle localVariables that use CVA patterns
    // For CVA-based local variables like `const buttonClass = buttonVariants({ variant, size, className })`
    // we need to inline the computed class value directly (without quotes, as it will be used in template expressions)
    if (componentResult.localVariables && componentResult.cvaPatterns) {
      for (const localVar of componentResult.localVariables) {
        // Check if this local variable's code contains a CVA pattern call
        const cvaPattern = componentResult.cvaPatterns.find(p => localVar.code.includes(p.name + '('))
        if (cvaPattern) {
          // Compute the class from CVA lookup map
          const variantValue = propsMap.get('variant') || `"${cvaPattern.defaultVariants?.variant || 'default'}"`
          const sizeValue = propsMap.get('size') || `"${cvaPattern.defaultVariants?.size || 'default'}"`
          // Get variant and size keys by stripping quotes
          const variantKey = variantValue.replace(/^["']|["']$/g, '')
          const sizeKey = sizeValue.replace(/^["']|["']$/g, '')
          // Build the class by combining base, variant class, and size class
          const baseClass = cvaPattern.baseClass
          const variantClass = cvaPattern.variantDefs?.variant?.[variantKey] || ''
          const sizeClass = cvaPattern.variantDefs?.size?.[sizeKey] || ''
          const classNameValue = propsMap.get('className') || propsMap.get('class') || ''
          const cleanClassName = classNameValue.replace(/^["']|["']$/g, '')
          const computedClass = [baseClass, variantClass, sizeClass, cleanClassName].filter(Boolean).join(' ').trim()
          // Mark as static string value (for template generation, it will be used directly without template expression)
          propsMap.set(localVar.name, `__STATIC_CLASS__${computedClass}`)
        }
      }
    }

    // Build event delegation attributes for the inlined component's root element.
    // When a component like <Button onClick={handler}> is used in a list template,
    // the onClick is extracted as a componentEvent. We register it in the events array
    // and create data-index/data-event-id attributes so the client-side event delegation
    // can find and invoke the correct handler.
    let componentEventAttrs = ''
    if (componentEvents.length > 0) {
      const eventId = eventIdCounter++
      componentEventAttrs = ` data-index="\${__index}" data-event-id="${eventId}"`
      for (const event of componentEvents) {
        events.push({ eventId, eventName: event.name, handler: event.handler })
      }
    }

    // Calculate rest props to expand when the component uses {...props} spread.
    // Rest props are props passed from parent that are NOT explicit props of the component.
    // For example, when <Button disabled={...}> is used, 'disabled' is a rest prop
    // because Button destructures {class, variant, size, asChild, children, ...props}.
    const restPropsToExpand = new Map<string, string>()
    if (componentResult.restPropsName) {
      const explicitPropNames = new Set(componentResult.props.map(p => p.name))
      // Also consider common prop aliases
      if (explicitPropNames.has('class')) explicitPropNames.add('className')
      if (explicitPropNames.has('className')) explicitPropNames.add('class')

      for (const [propName, propExpr] of propsMap) {
        // Skip explicit props (they're substituted via propsMap)
        if (explicitPropNames.has(propName)) continue
        // Skip internal props used by the compiler
        if (propName === 'key' || propName === 'children') continue
        // Skip local variables (like buttonClass from CVA)
        if (propExpr.startsWith('__STATIC_CLASS__')) continue
        // This is a rest prop - should be expanded in {...props} spread
        restPropsToExpand.set(propName, propExpr)
      }
    }

    // Prefer IR when available - it's component-specific and more reliable
    // This is especially important for same-file components where source
    // contains multiple components and parsing would find the wrong one
    if (componentResult.ir) {
      return irToHtmlTemplate(componentResult.ir, propsMap, keyAttr, true, componentEventAttrs, restPropsToExpand)
    }

    // Fall back to parsing source if no IR
    const componentSource = componentResult.source
    if (!componentSource) {
      return ''
    }

    const componentSf = ts.createSourceFile(
      'component.tsx',
      componentSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )

    // Find component's JSX
    let componentJsx: ts.JsxElement | ts.JsxSelfClosingElement | null = null

    function findJsxReturn(node: ts.Node) {
      if (ts.isReturnStatement(node) && node.expression) {
        let expr = node.expression
        if (ts.isParenthesizedExpression(expr)) {
          expr = expr.expression
        }
        if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
          componentJsx = expr
        }
      }
      ts.forEachChild(node, findJsxReturn)
    }

    ts.forEachChild(componentSf, (node) => {
      if (ts.isFunctionDeclaration(node)) {
        findJsxReturn(node)
      }
    })

    if (!componentJsx) {
      // No JSX found in source
      return ''
    }

    // Convert component's JSX to template (with props substitution)
    return processComponentJsx(componentJsx, componentSf, propsMap, keyAttr)
  }

  /**
   * Processes component's JSX and converts to template (with props substitution)
   * @param keyAttr - Optional key attribute value to add as data-key on root element
   */
  function processComponentJsx(
    n: ts.JsxElement | ts.JsxSelfClosingElement,
    sf: ts.SourceFile,
    propsMap: Map<string, string>,
    keyAttr?: string
  ): string {
    /**
     * Substitutes prop references in expression using AST transformation.
     * Handles both prop function calls and simple identifier references.
     */
    function substituteProps(expr: string): string {
      // First, handle prop function calls (e.g., onToggle() → expanded body)
      let result = substitutePropCallsAST(expr, propsMap)
      // Then, handle simple identifier references (e.g., item → todo)
      result = substituteIdentifiersAST(result, propsMap)
      return result
    }

    function processAttrs(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''
      let elementEventId: number | null = null

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sf)

          if (attrName.startsWith('on')) {
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              let handler = attr.initializer.expression.getText(sf)
              // Substitute prop references in handler
              handler = substituteProps(handler)
              if (elementEventId === null) {
                elementEventId = eventIdCounter++
                eventAttrs = ` data-index="\${__index}" data-event-id="${elementEventId}"`
              }
              events.push({ eventId: elementEventId, eventName, handler })
            }
          } else if (attr.initializer) {
            if (ts.isStringLiteral(attr.initializer)) {
              attrs += ` ${attrName}="${attr.initializer.text}"`
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const expr = attr.initializer.expression.getText(sf)
              const substituted = substituteProps(expr)
              const attrNameLower = attrName.toLowerCase()
              if (BOOLEAN_HTML_ATTRS.has(attrNameLower)) {
                // Boolean attrs should only be present when truthy
                attrs += `\${${substituted} ? ' ${attrName}' : ''}`
              } else {
                attrs += ` ${attrName}="\${${substituted}}"`
              }
            }
          }
        }
      })

      return { attrs, eventAttrs }
    }

    type ProcessOptions = {
      /**
       * Whether to inject data-key attribute on this element.
       *
       * Set to true only for the root element of an inlined component when the
       * parent component passes a `key` prop. This enables external libraries
       * (e.g., morphdom) to identify and reuse DOM elements during list updates.
       *
       * Defaults to false because child elements should not have data-key;
       * only the root element of each list item needs it for identification.
       */
      injectDataKey: boolean
    }

    function processJsxNode(node: ts.JsxElement | ts.JsxSelfClosingElement, options: ProcessOptions = { injectDataKey: false }): string {
      const dataKeyAttr = options.injectDataKey && keyAttr ? ` data-key="\${${keyAttr}}"` : ''

      if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.attributes)
        return `<${tagName}${dataKeyAttr}${eventAttrs}${attrs} />`
      }

      if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.openingElement.attributes)

        let children = ''
        for (const child of node.children) {
          if (ts.isJsxText(child)) {
            // Note: child.text preserves leading/trailing whitespace, unlike getText()
            const text = normalizeJsxText(child.text)
            if (text) {
              children += text
            }
          } else if (ts.isJsxExpression(child) && child.expression) {
            // Process conditional or regular expressions
            if (ts.isConditionalExpression(child.expression)) {
              const condition = substituteProps(child.expression.condition.getText(sf))
              const whenTrue = processJsxOrExpr(child.expression.whenTrue, sf)
              const whenFalse = processJsxOrExpr(child.expression.whenFalse, sf)
              children += `\${${condition} ? ${whenTrue} : ${whenFalse}}`
            } else {
              const expr = substituteProps(child.expression.getText(sf))
              children += `\${${expr}}`
            }
          } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            children += processJsxNode(child)
          }
        }

        return `<${tagName}${dataKeyAttr}${eventAttrs}${attrs}>${children}</${tagName}>`
      }

      return ''
    }

    function processJsxOrExpr(expr: ts.Expression, sf: ts.SourceFile): string {
      if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr)) {
        return `\`${processJsxNode(expr)}\``
      }
      if (ts.isParenthesizedExpression(expr)) {
        return processJsxOrExpr(expr.expression, sf)
      }
      return substituteProps(expr.getText(sf))
    }

    return processJsxNode(n, { injectDataKey: true })
  }

  function processNode(
    n: ts.JsxElement | ts.JsxSelfClosingElement
  ): string {
    function processAttributes(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''
      let elementEventId: number | null = null  // event-id for this element (shared by multiple events)

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sourceFile)

          // Convert key to data-key for list reconciliation
          if (attrName === 'key') {
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              attrs += ` data-key="\${${attr.initializer.expression.getText(sourceFile)}}"`
            }
            return
          }

          if (attrName.startsWith('on')) {
            // Detect event handler
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const handler = attr.initializer.expression.getText(sourceFile)
              // Assign event-id on first event, shared by all events on the same element
              if (elementEventId === null) {
                elementEventId = eventIdCounter++
                eventAttrs = ` data-index="\${__index}" data-event-id="${elementEventId}"`
              }
              events.push({ eventId: elementEventId, eventName, handler })
            }
          } else if (attr.initializer) {
            if (ts.isStringLiteral(attr.initializer)) {
              attrs += ` ${attrName}="${attr.initializer.text}"`
            } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const expr = attr.initializer.expression.getText(sourceFile)
              const attrNameLower = attrName.toLowerCase()
              if (BOOLEAN_HTML_ATTRS.has(attrNameLower)) {
                // Boolean attrs should only be present when truthy
                attrs += `\${${expr} ? ' ${attrName}' : ''}`
              } else {
                attrs += ` ${attrName}="\${${expr}}"`
              }
            }
          }
        }
      })

      return { attrs, eventAttrs }
    }

    if (ts.isJsxSelfClosingElement(n)) {
      const tagName = n.tagName.getText(sourceFile)

      // Detect component tag and inline expand
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const { props: propsMap, componentEvents } = extractComponentPropsAndEvents(n.attributes, sourceFile, componentResult.props)
        return inlineComponent(componentResult, propsMap, componentEvents)
      }

      const { attrs, eventAttrs } = processAttributes(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    if (ts.isJsxElement(n)) {
      const tagName = n.openingElement.tagName.getText(sourceFile)

      // Process children first (needed for both component inlining and regular elements)
      let childrenContent = ''
      for (const child of n.children) {
        if (ts.isJsxText(child)) {
          // Note: child.text preserves leading/trailing whitespace, unlike getText()
          const text = normalizeJsxText(child.text)
          if (text) {
            childrenContent += text
          }
        } else if (ts.isJsxExpression(child) && child.expression) {
          // Process JSX within ternary operators
          childrenContent += processExpression(child.expression)
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          // Process recursively
          childrenContent += processNode(child)
        }
      }

      // Detect component tag and inline expand
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const { props: propsMap, componentEvents } = extractComponentPropsAndEvents(n.openingElement.attributes, sourceFile, componentResult.props)
        // Pass children as a prop (quoted string for proper template interpolation)
        if (childrenContent) {
          propsMap.set('children', `"${childrenContent}"`)
        }
        return inlineComponent(componentResult, propsMap, componentEvents)
      }

      const { attrs, eventAttrs } = processAttributes(n.openingElement.attributes)

      return `<${tagName}${eventAttrs}${attrs}>${childrenContent}</${tagName}>`
    }

    return ''
  }

  const template = `\`${processNode(node)}\``
  return { template, events }
}
