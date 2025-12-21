/**
 * JSXコンパイラ - map式処理
 *
 * items().map(item => <li>{item}</li>) のようなmap式を検出し、
 * テンプレートリテラルに変換する。
 */

import ts from 'typescript'
import type {
  CompileResult,
  SignalDeclaration,
  MapExpressionResult,
} from '../types'
import { replaceSignalCalls } from '../utils/expression-parser'
import { evaluateArrayExpression, evaluateTemplate } from './utils'
import { jsxToTemplateString } from './template-generator'

/**
 * map式を抽出
 * items().map(item => <li>{item}</li>) のパターンを検出
 */
export function extractMapExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[],
  components: Map<string, CompileResult> = new Map()
): MapExpressionResult | null {
  // CallExpression で .map() を検出
  if (!ts.isCallExpression(expr)) return null

  const callExpr = expr
  if (!ts.isPropertyAccessExpression(callExpr.expression)) return null

  const propAccess = callExpr.expression
  if (propAccess.name.text !== 'map') return null

  // mapのコールバックを取得
  const callback = callExpr.arguments[0]
  if (!callback) return null

  // コールバックがアロー関数の場合
  if (ts.isArrowFunction(callback)) {
    const param = callback.parameters[0]
    if (!param) return null
    const paramName = param.name.getText(sourceFile)

    // コールバックのボディがJSX要素の場合
    const body = callback.body
    let jsxBody: ts.JsxElement | ts.JsxSelfClosingElement | null = null

    if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body)) {
      jsxBody = body
    } else if (ts.isParenthesizedExpression(body)) {
      const inner = body.expression
      if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
        jsxBody = inner
      }
    }

    if (jsxBody) {
      // JSXをテンプレートリテラル形式に変換
      const templateResult = jsxToTemplateString(jsxBody, sourceFile, paramName, components)
      const arrayExpr = propAccess.expression.getText(sourceFile)

      // イベントがある場合は__indexを使用
      const hasEvents = templateResult.events.length > 0
      const mapParams = hasEvents ? `(${paramName}, __index)` : paramName
      const mapExpression = `${arrayExpr}.map(${mapParams} => ${templateResult.template}).join('')`

      // 初期値を使ってHTMLを生成
      const initialHtml = evaluateMapWithInitialValues(arrayExpr, paramName, templateResult.template, signals)

      // イベント情報を収集
      const itemEvents = templateResult.events.map(e => ({
        eventId: e.eventId,
        eventName: e.eventName,
        handler: e.handler,
        paramName,
      }))

      return { mapExpression, initialHtml, itemEvents, arrayExpression: arrayExpr }
    }
  }

  return null
}

/**
 * map式を初期値で評価してHTMLを生成
 * TypeScript APIを使用してシグナル呼び出しを正確に置換する
 */
export function evaluateMapWithInitialValues(
  arrayExpr: string,
  paramName: string,
  templateStr: string,
  signals: SignalDeclaration[]
): string {
  // 配列式からsignal呼び出しを見つけて初期値を取得
  // items() または items().filter(...) のパターンに対応

  // signal呼び出しを初期値で置き換えた式を作成（ASTベース）
  const replaced = replaceSignalCalls(arrayExpr, signals)

  // 配列を安全に評価
  const arrayValue = evaluateArrayExpression(replaced)
  if (arrayValue === null) {
    return ''
  }

  // 各要素に対してテンプレートを適用（eval不使用）
  try {
    const results = arrayValue.map((item, __index) => {
      // テンプレートリテラルを安全に評価
      // templateStr は `<li>${item}</li>` のような形式
      return evaluateTemplate(templateStr, paramName, item, __index)
    })
    return results.join('')
  } catch {
    return ''
  }
}
