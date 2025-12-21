/**
 * JSXコンパイラ - テンプレート文字列生成
 *
 * map式内のJSX要素をテンプレートリテラル文字列に変換する。
 * イベントハンドラはdata-index属性とdata-event-id属性に置き換え、
 * コンポーネントタグはインライン展開する。
 */

import ts from 'typescript'
import type { CompileResult, TemplateStringResult } from '../types'
import { isPascalCase } from '../utils/helpers'

/**
 * JSX要素をテンプレートリテラル文字列に変換
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
   * 式を処理（三項演算子内のJSXを検出して変換）
   */
  function processExpression(expr: ts.Expression): string {
    // 三項演算子の場合
    if (ts.isConditionalExpression(expr)) {
      const condition = expr.condition.getText(sourceFile)
      const whenTrue = processExpressionOrJsx(expr.whenTrue)
      const whenFalse = processExpressionOrJsx(expr.whenFalse)
      return `\${${condition} ? ${whenTrue} : ${whenFalse}}`
    }

    // ParenthesizedExpressionの場合（括弧で囲まれた式）
    if (ts.isParenthesizedExpression(expr)) {
      return processExpression(expr.expression)
    }

    // その他の式はそのまま出力
    return `\${${expr.getText(sourceFile)}}`
  }

  /**
   * 式またはJSXを処理
   */
  function processExpressionOrJsx(node: ts.Expression): string {
    // JSX要素の場合はテンプレート文字列に変換
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      return `\`${processNode(node)}\``
    }

    // 括弧で囲まれた式の場合
    if (ts.isParenthesizedExpression(node)) {
      return processExpressionOrJsx(node.expression)
    }

    // その他の式はそのまま
    return node.getText(sourceFile)
  }

  /**
   * コンポーネントのJSX属性からpropsを抽出
   */
  function extractComponentProps(
    attributes: ts.JsxAttributes,
    sf: ts.SourceFile
  ): Map<string, string> {
    const props = new Map<string, string>()
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
   * コンポーネントをインライン展開する
   * コンポーネントのソースを解析し、propsを置換したテンプレートを生成
   */
  function inlineComponent(
    componentResult: CompileResult,
    propsMap: Map<string, string>
  ): string {
    // コンポーネントのソースをパース
    const componentSource = componentResult.source
    const componentSf = ts.createSourceFile(
      'component.tsx',
      componentSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )

    // コンポーネントのJSXを探す
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
      return ''
    }

    // コンポーネントのJSXをテンプレートに変換（propsを置換）
    return processComponentJsx(componentJsx, componentSf, propsMap)
  }

  /**
   * コンポーネントのJSXを処理してテンプレートに変換（props置換付き）
   */
  function processComponentJsx(
    n: ts.JsxElement | ts.JsxSelfClosingElement,
    sf: ts.SourceFile,
    propsMap: Map<string, string>
  ): string {
    /**
     * 式内のprop参照を置換
     */
    function substituteProps(expr: string): string {
      let result = expr
      for (const [propName, propValue] of propsMap) {
        // prop() の呼び出しを置換（イベントハンドラの呼び出し）
        // 例: onToggle() → (() => handleToggle(todo.id))()
        // しかし () => onToggle() パターンの場合は onToggle を propValue に置換
        const callRegex = new RegExp(`\\b${propName}\\s*\\(([^)]*)\\)`, 'g')
        result = result.replace(callRegex, (match, args) => {
          // propValue が arrow function の場合、それを呼び出し
          // (args) => body を body(args) に変換
          const arrowMatch = propValue.match(/^\s*\(([^)]*)\)\s*=>\s*(.+)$/)
          if (arrowMatch) {
            const arrowParams = arrowMatch[1] || ''
            let body = arrowMatch[2]!.trim()
            // 引数の置換が必要な場合
            if (args && arrowParams) {
              // 簡易的な引数の置換
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
        // 単純な参照を置換（例: todo.done → todo.done）
        // prop名だけの場合（関数呼び出しでない）
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
              // ハンドラ内のprop参照を置換
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

    function processJsxNode(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
      if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.attributes)
        return `<${tagName}${eventAttrs}${attrs} />`
      }

      if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sf)
        const { attrs, eventAttrs } = processAttrs(node.openingElement.attributes)

        let children = ''
        for (const child of node.children) {
          if (ts.isJsxText(child)) {
            const text = child.getText(sf).trim()
            if (text) {
              children += text
            }
          } else if (ts.isJsxExpression(child) && child.expression) {
            // 条件式や通常の式を処理
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

        return `<${tagName}${eventAttrs}${attrs}>${children}</${tagName}>`
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

    return processJsxNode(n)
  }

  function processNode(
    n: ts.JsxElement | ts.JsxSelfClosingElement
  ): string {
    function processAttributes(
      attributes: ts.JsxAttributes
    ): { attrs: string; eventAttrs: string } {
      let attrs = ''
      let eventAttrs = ''
      let elementEventId: number | null = null  // この要素のevent-id（複数イベントで共有）

      attributes.properties.forEach((attr) => {
        if (ts.isJsxAttribute(attr) && attr.name) {
          const attrName = attr.name.getText(sourceFile)

          if (attrName.startsWith('on')) {
            // イベントハンドラを検出
            const eventName = attrName.slice(2).toLowerCase()
            if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
              const handler = attr.initializer.expression.getText(sourceFile)
              // 最初のイベントでevent-idを割り当て、同じ要素の全イベントで共有
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

      // コンポーネントタグの検出とインライン展開
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const propsMap = extractComponentProps(n.attributes, sourceFile)
        return inlineComponent(componentResult, propsMap)
      }

      const { attrs, eventAttrs } = processAttributes(n.attributes)
      return `<${tagName}${eventAttrs}${attrs} />`
    }

    if (ts.isJsxElement(n)) {
      const tagName = n.openingElement.tagName.getText(sourceFile)

      // コンポーネントタグの検出とインライン展開
      if (isPascalCase(tagName) && components.has(tagName)) {
        const componentResult = components.get(tagName)!
        const propsMap = extractComponentProps(n.openingElement.attributes, sourceFile)
        return inlineComponent(componentResult, propsMap)
      }

      const { attrs, eventAttrs } = processAttributes(n.openingElement.attributes)

      // 子要素を処理
      let children = ''
      for (const child of n.children) {
        if (ts.isJsxText(child)) {
          const text = child.getText(sourceFile).trim()
          if (text) {
            children += text
          }
        } else if (ts.isJsxExpression(child) && child.expression) {
          // 三項演算子内のJSXを処理
          children += processExpression(child.expression)
        } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
          // 再帰的に処理
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
