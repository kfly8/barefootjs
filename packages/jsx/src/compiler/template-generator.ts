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
import { isArrowFunction, extractArrowParams, extractArrowBody } from '../utils/expression-parser'

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
   */
  function irToHtmlTemplate(
    ir: IRNode,
    propsMap: Map<string, string>,
    keyAttr?: string,
    isRoot: boolean = true
  ): string {
    /**
     * Substitutes prop references in expression
     */
    function substituteProps(expr: string): string {
      let result = expr
      for (const [propName, propValue] of propsMap) {
        // Replace prop() calls
        const callRegex = new RegExp(`\\b${propName}\\s*\\(([^)]*)\\)`, 'g')
        result = result.replace(callRegex, (match, args) => {
          if (isArrowFunction(propValue)) {
            const arrowParamsWithParen = extractArrowParams(propValue)
            const arrowParams = arrowParamsWithParen.slice(1, -1)
            let body = extractArrowBody(propValue)
            if (args && arrowParams) {
              const paramNames = arrowParams.split(',').map(p => p.trim())
              const argValues = args.split(',').map((a: string) => a.trim())
              for (let i = 0; i < paramNames.length && i < argValues.length; i++) {
                if (paramNames[i]) {
                  body = body.replace(new RegExp(`\\b${paramNames[i]}\\b`, 'g'), argValues[i])
                }
              }
            }
            return body
          }
          return `(${propValue})(${args})`
        })
        // Replace simple references
        const refRegex = new RegExp(`\\b${propName}\\b(?!\\s*\\()`, 'g')
        result = result.replace(refRegex, propValue)
      }
      return result
    }

    function processIRNode(node: IRNode, injectDataKey: boolean = false): string {
      switch (node.type) {
        case 'element': {
          const el = node as IRElement
          const dataKeyAttr = injectDataKey && keyAttr ? ` data-key="\${${keyAttr}}"` : ''

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
            attrs += ` ${attr.name}="\${${expr}}"`
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
            return `<${el.tagName}${dataKeyAttr}${eventAttrs}${attrs} />`
          }
          return `<${el.tagName}${dataKeyAttr}${eventAttrs}${attrs}>${children}</${el.tagName}>`
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
          return `\${${condition} ? \`${whenTrue}\` : \`${whenFalse}\`}`
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
   * Extracts props from component's JSX attributes.
   * Handles both regular props and spread attributes.
   * For spread attributes, generates mappings like `name` → `spreadExpr.name`
   * based on the component's expected props.
   */
  function extractComponentProps(
    attributes: ts.JsxAttributes,
    sf: ts.SourceFile,
    componentExpectedProps?: Array<{ name: string }>
  ): Map<string, string> {
    const props = new Map<string, string>()

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

    // Then process regular attributes (which override spread values)
    attributes.properties.forEach((attr) => {
      if (ts.isJsxAttribute(attr) && attr.name) {
        const propName = attr.name.getText(sf)
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            props.set(propName, `"${attr.initializer.text}"`)
          } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            props.set(propName, attr.initializer.expression.getText(sf))
          }
        }
      }
    })
    return props
  }

  /**
   * Inlines a component.
   * Uses IR to generate template when available (more reliable for same-file components).
   * Falls back to source parsing if IR is not available.
   */
  function inlineComponent(
    componentResult: CompileResult,
    propsMap: Map<string, string>
  ): string {
    // Extract key prop for data-key attribute on root element
    const keyAttr = propsMap.get('key')
    if (keyAttr) {
      propsMap.delete('key')  // Don't substitute 'key' as a regular prop
    }

    // Prefer IR when available - it's component-specific and more reliable
    // This is especially important for same-file components where source
    // contains multiple components and parsing would find the wrong one
    if (componentResult.ir) {
      return irToHtmlTemplate(componentResult.ir, propsMap, keyAttr, true)
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
     * Substitutes prop references in expression
     */
    function substituteProps(expr: string): string {
      let result = expr
      for (const [propName, propValue] of propsMap) {
        // Replace prop() calls (event handler calls)
        // e.g., onToggle() → (() => handleToggle(todo.id))()
        // However, for () => onToggle() pattern, replace onToggle with propValue
        const callRegex = new RegExp(`\\b${propName}\\s*\\(([^)]*)\\)`, 'g')
        result = result.replace(callRegex, (match, args) => {
          // If propValue is an arrow function, call it
          // Convert (args) => body to body(args)
          if (isArrowFunction(propValue)) {
            // extractArrowParams returns "(param1, param2)", remove parentheses
            const arrowParamsWithParen = extractArrowParams(propValue)
            const arrowParams = arrowParamsWithParen.slice(1, -1)
            let body = extractArrowBody(propValue)
            // If argument substitution is needed
            if (args && arrowParams) {
              // Simple argument substitution
              const paramNames = arrowParams.split(',').map(p => p.trim())
              const argValues = args.split(',').map((a: string) => a.trim())
              for (let i = 0; i < paramNames.length && i < argValues.length; i++) {
                if (paramNames[i]) {
                  body = body.replace(new RegExp(`\\b${paramNames[i]}\\b`, 'g'), argValues[i])
                }
              }
            }
            return body
          }
          return `(${propValue})(${args})`
        })
        // Replace simple references (e.g., todo.done → todo.done)
        // Only prop name (not function calls)
        const refRegex = new RegExp(`\\b${propName}\\b(?!\\s*\\()`, 'g')
        result = result.replace(refRegex, propValue)
      }
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
              attrs += ` ${attrName}="\${${substituted}}"`
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
              attrs += ` ${attrName}="\${${attr.initializer.expression.getText(sourceFile)}}"`
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
        const propsMap = extractComponentProps(n.attributes, sourceFile, componentResult.props)
        return inlineComponent(componentResult, propsMap)
      }

      const { attrs, eventAttrs } = processAttributes(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    if (ts.isJsxElement(n)) {
      const tagName = n.openingElement.tagName.getText(sourceFile)

      // Detect component tag and inline expand
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const propsMap = extractComponentProps(n.openingElement.attributes, sourceFile, componentResult.props)
        return inlineComponent(componentResult, propsMap)
      }

      const { attrs, eventAttrs } = processAttributes(n.openingElement.attributes)

      // Process children
      let children = ''
      for (const child of n.children) {
        if (ts.isJsxText(child)) {
          // Note: child.text preserves leading/trailing whitespace, unlike getText()
          const text = normalizeJsxText(child.text)
          if (text) {
            children += text
          }
        } else if (ts.isJsxExpression(child) && child.expression) {
          // Process JSX within ternary operators
          children += processExpression(child.expression)
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          // Process recursively
          children += processNode(child)
        }
      }

      return `<${tagName}${eventAttrs}${attrs}>${children}</${tagName}>`
    }

    return ''
  }

  const template = `\`${processNode(node)}\``
  return { template, events }
}
