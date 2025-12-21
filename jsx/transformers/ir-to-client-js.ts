/**
 * BarefootJS JSX Compiler - IR to Client JS Transformer
 *
 * 中間表現（IR）からクライアントJavaScriptを生成する。
 */

import type {
  IRNode,
  IRElement,
  SignalDeclaration,
  LocalFunction,
  InteractiveElement,
  DynamicElement,
  ListElement,
  DynamicAttribute,
} from '../types'

// TypeScript APIを使用したパーサーをインポート
import {
  extractArrowBody as parseArrowBody,
  extractArrowParams as parseArrowParams,
  parseConditionalHandler as parseConditional,
} from '../utils/expression-parser'

export type ClientJsContext = {
  signals: SignalDeclaration[]
  localFunctions: LocalFunction[]
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  listElements: ListElement[]
  dynamicAttributes: DynamicAttribute[]
}

/**
 * アロー関数からボディ部分を抽出
 * TypeScript APIを使用して正確にパースする
 */
export function extractArrowBody(handler: string): string {
  return parseArrowBody(handler)
}

/**
 * アロー関数からパラメータ部分を抽出
 * TypeScript APIを使用して正確にパースする
 */
export function extractArrowParams(handler: string): string {
  return parseArrowParams(handler)
}

/**
 * バブリングしないイベントかどうか判定
 */
export function needsCapturePhase(eventName: string): boolean {
  return ['blur', 'focus', 'focusin', 'focusout'].includes(eventName)
}

/**
 * 条件付きハンドラのパース
 * TypeScript APIを使用して正確にパースする
 */
export function parseConditionalHandler(body: string): { condition: string; action: string } | null {
  return parseConditional(body)
}

/**
 * boolean属性かどうか判定
 */
export function isBooleanAttribute(attrName: string): boolean {
  return ['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)
}

/**
 * 動的属性の更新コードを生成
 */
export function generateAttributeUpdate(da: DynamicAttribute): string {
  const { id, attrName, expression } = da

  if (attrName === 'class' || attrName === 'className') {
    return `${id}.className = ${expression}`
  }

  if (attrName === 'style') {
    return `Object.assign(${id}.style, ${expression})`
  }

  if (isBooleanAttribute(attrName)) {
    return `${id}.${attrName} = ${expression}`
  }

  if (attrName === 'value') {
    return `${id}.value = ${expression}`
  }

  return `${id}.setAttribute('${attrName}', ${expression})`
}

/**
 * コンテキストからクライアントJSを生成
 */
export function generateClientJs(ctx: ClientJsContext): string {
  const lines: string[] = []
  const hasDynamicContent = ctx.dynamicElements.length > 0 ||
                            ctx.listElements.length > 0 ||
                            ctx.dynamicAttributes.length > 0

  // 動的属性を持つ要素のIDを収集（重複を除去）
  const attrElementIds = [...new Set(ctx.dynamicAttributes.map(da => da.id))]

  // DOM要素の取得
  for (const el of ctx.dynamicElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  for (const el of ctx.listElements) {
    lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
  }

  for (const id of attrElementIds) {
    lines.push(`const ${id} = document.getElementById('${id}')`)
  }

  for (const el of ctx.interactiveElements) {
    if (!attrElementIds.includes(el.id)) {
      lines.push(`const ${el.id} = document.getElementById('${el.id}')`)
    }
  }

  if (hasDynamicContent || ctx.interactiveElements.length > 0) {
    lines.push('')
  }

  // ローカル関数を出力
  for (const fn of ctx.localFunctions) {
    lines.push(fn.code)
  }
  if (ctx.localFunctions.length > 0) {
    lines.push('')
  }

  // updateAll関数
  if (hasDynamicContent) {
    lines.push('function updateAll() {')
    for (const el of ctx.dynamicElements) {
      lines.push(`  ${el.id}.textContent = ${el.fullContent}`)
    }
    for (const el of ctx.listElements) {
      lines.push(`  ${el.id}.innerHTML = ${el.mapExpression}`)
    }
    for (const da of ctx.dynamicAttributes) {
      lines.push(`  ${generateAttributeUpdate(da)}`)
    }
    lines.push('}')
    lines.push('')
  }

  // リスト要素内のイベントデリゲーション
  for (const el of ctx.listElements) {
    if (el.itemEvents.length > 0) {
      for (const event of el.itemEvents) {
        const handlerBody = extractArrowBody(event.handler)
        const conditionalHandler = parseConditionalHandler(handlerBody)
        const useCapture = needsCapturePhase(event.eventName)
        const captureArg = useCapture ? ', true' : ''

        lines.push(`${el.id}.addEventListener('${event.eventName}', (e) => {`)
        lines.push(`  const target = e.target.closest('[data-event-id="${event.eventId}"]')`)
        lines.push(`  if (target && target.dataset.eventId === '${event.eventId}') {`)
        lines.push(`    const __index = parseInt(target.dataset.index, 10)`)
        lines.push(`    const ${event.paramName} = ${el.arrayExpression}[__index]`)

        if (conditionalHandler && hasDynamicContent) {
          lines.push(`    if (${conditionalHandler.condition}) {`)
          lines.push(`      ${conditionalHandler.action}`)
          lines.push(`      updateAll()`)
          lines.push(`    }`)
        } else {
          lines.push(`    ${handlerBody}`)
          if (hasDynamicContent) {
            lines.push(`    updateAll()`)
          }
        }

        lines.push(`  }`)
        lines.push(`}${captureArg})`)
      }
    }
  }

  // インタラクティブ要素のイベントハンドラ
  for (const el of ctx.interactiveElements) {
    for (const event of el.events) {
      const handlerBody = extractArrowBody(event.handler)
      const handlerParams = extractArrowParams(event.handler)
      if (hasDynamicContent) {
        lines.push(`${el.id}.on${event.eventName} = ${handlerParams} => {`)
        lines.push(`  ${handlerBody}`)
        lines.push(`  updateAll()`)
        lines.push(`}`)
      } else {
        lines.push(`${el.id}.on${event.eventName} = ${event.handler}`)
      }
    }
  }

  // 初期表示
  if (hasDynamicContent) {
    lines.push('')
    lines.push('// 初期表示')
    lines.push('updateAll()')
  }

  return lines.join('\n')
}

/**
 * IRからクライアントJS生成に必要な情報を収集
 */
export function collectClientJsInfo(
  node: IRNode,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[]
): void {
  switch (node.type) {
    case 'element':
      collectFromElement(node, interactiveElements, dynamicElements, listElements, dynamicAttributes)
      break
    case 'conditional':
      collectClientJsInfo(node.whenTrue, interactiveElements, dynamicElements, listElements, dynamicAttributes)
      collectClientJsInfo(node.whenFalse, interactiveElements, dynamicElements, listElements, dynamicAttributes)
      break
  }
}

function collectFromElement(
  el: IRElement,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[]
): void {
  // イベントがある場合
  if (el.events.length > 0 && el.id) {
    interactiveElements.push({
      id: el.id,
      tagName: el.tagName,
      events: el.events,
    })
  }

  // 動的属性がある場合
  if (el.dynamicAttrs.length > 0 && el.id) {
    for (const attr of el.dynamicAttrs) {
      dynamicAttributes.push({
        id: el.id,
        tagName: el.tagName,
        attrName: attr.name,
        expression: attr.expression,
      })
    }
  }

  // リスト情報がある場合
  if (el.listInfo && el.id) {
    listElements.push({
      id: el.id,
      tagName: el.tagName,
      mapExpression: `${el.listInfo.arrayExpression}.map((${el.listInfo.paramName}, __index) => ${el.listInfo.itemTemplate}).join('')`,
      itemEvents: el.listInfo.itemEvents,
      arrayExpression: el.listInfo.arrayExpression,
    })
  }

  // 子要素を再帰処理
  for (const child of el.children) {
    collectClientJsInfo(child, interactiveElements, dynamicElements, listElements, dynamicAttributes)
  }
}
