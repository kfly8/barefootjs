/**
 * BarefootJS JSX Compiler - IR to HTML Transformer
 *
 * 中間表現（IR）から静的HTMLを生成する。
 */

import type { IRNode, IRElement, SignalDeclaration } from '../types'

/**
 * 動的表現をsignalの初期値で評価して文字列を返す
 */
export function evaluateWithInitialValues(expr: string, signals: SignalDeclaration[]): string {
  let replaced = expr
  for (const s of signals) {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(\\s*\\)`, 'g')
    replaced = replaced.replace(regex, s.initialValue)
  }

  try {
    const result = eval(replaced)
    return String(result)
  } catch {
    return ''
  }
}

/**
 * IRノードからHTMLを生成
 */
export function irToHtml(node: IRNode, signals: SignalDeclaration[]): string {
  switch (node.type) {
    case 'text':
      return node.content

    case 'expression':
      if (node.isDynamic) {
        return evaluateWithInitialValues(node.expression, signals)
      }
      return node.expression

    case 'component':
      return node.staticHtml

    case 'conditional': {
      const condResult = evaluateWithInitialValues(node.condition, signals)
      if (condResult === 'true') {
        return irToHtml(node.whenTrue, signals)
      }
      return irToHtml(node.whenFalse, signals)
    }

    case 'element':
      return elementToHtml(node, signals)
  }
}

/**
 * IR要素からHTMLを生成
 */
function elementToHtml(el: IRElement, signals: SignalDeclaration[]): string {
  const { tagName, id, staticAttrs, dynamicAttrs, children } = el

  // 属性を構築
  const attrParts: string[] = []

  // IDがあれば追加
  if (id) {
    attrParts.push(`id="${id}"`)
  }

  // 静的属性
  for (const attr of staticAttrs) {
    if (attr.value) {
      attrParts.push(`${attr.name}="${attr.value}"`)
    } else {
      attrParts.push(attr.name)
    }
  }

  // 動的属性（初期値で評価）
  for (const attr of dynamicAttrs) {
    const value = evaluateWithInitialValues(attr.expression, signals)
    if (value) {
      attrParts.push(`${attr.name}="${value}"`)
    }
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  // 子要素を処理
  const childrenHtml = children.map(child => irToHtml(child, signals)).join('')

  // 自己閉じタグ
  if (children.length === 0 && isSelfClosingTag(tagName)) {
    return `<${tagName}${attrsStr} />`
  }

  return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
}

/**
 * 自己閉じタグかどうか判定
 */
function isSelfClosingTag(tagName: string): boolean {
  return ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())
}
