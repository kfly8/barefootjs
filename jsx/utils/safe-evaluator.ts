/**
 * BarefootJS JSX Compiler - Safe Expression Evaluator
 *
 * evalを使用せずに、安全に式を評価する。
 * 対応する式のパターン:
 * - リテラル: 数値、文字列、真偽値
 * - 三項演算子: condition ? then : else
 * - 算術演算: +, -, *, /
 * - 文字列連結: "prefix" + value
 * - 配列リテラル: []
 */

import type { SignalDeclaration } from '../types'

/**
 * signal呼び出しを初期値で置き換える
 */
export function substituteSignals(expr: string, signals: SignalDeclaration[]): string {
  let replaced = expr
  for (const s of signals) {
    const regex = new RegExp(`\\b${s.getter}\\s*\\(\\s*\\)`, 'g')
    replaced = replaced.replace(regex, s.initialValue)
  }
  return replaced
}

/**
 * 式を安全に評価して文字列を返す
 * 評価できない場合は空文字を返す
 */
export function safeEvaluate(expr: string): string {
  const trimmed = expr.trim()

  // 空文字
  if (trimmed === '') return ''

  // 数値リテラル
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed
  }

  // 文字列リテラル（シングルクォート）
  if (/^'[^']*'$/.test(trimmed)) {
    return trimmed.slice(1, -1)
  }

  // 文字列リテラル（ダブルクォート）
  if (/^"[^"]*"$/.test(trimmed)) {
    return trimmed.slice(1, -1)
  }

  // 真偽値リテラル
  if (trimmed === 'true') return 'true'
  if (trimmed === 'false') return 'false'

  // null/undefined
  if (trimmed === 'null' || trimmed === 'undefined') return ''

  // 配列リテラル（空配列）
  if (trimmed === '[]') return ''

  // 三項演算子: condition ? then : else
  const ternaryResult = evaluateTernary(trimmed)
  if (ternaryResult !== null) return ternaryResult

  // 算術演算 / 文字列連結
  const binaryResult = evaluateBinaryExpression(trimmed)
  if (binaryResult !== null) return binaryResult

  // 評価できない場合は空文字
  return ''
}

/**
 * 三項演算子を評価
 * condition ? then : else
 */
function evaluateTernary(expr: string): string | null {
  // シンプルな三項演算子のパターン
  // ネストされたものは未対応
  const match = expr.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/)
  if (!match) return null

  const condition = match[1]!.trim()
  const thenPart = match[2]!.trim()
  const elsePart = match[3]!.trim()

  // 条件を評価
  const condValue = evaluateCondition(condition)
  if (condValue === null) return null

  // 結果を評価
  if (condValue) {
    return safeEvaluate(thenPart)
  } else {
    return safeEvaluate(elsePart)
  }
}

/**
 * 条件式を評価して真偽値を返す
 */
function evaluateCondition(expr: string): boolean | null {
  const trimmed = expr.trim()

  // 真偽値リテラル
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  // 数値（0以外はtrue）
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed) !== 0
  }

  // 空文字列はfalse
  if (trimmed === '""' || trimmed === "''") return false

  // 比較演算子
  const compResult = evaluateComparison(trimmed)
  if (compResult !== null) return compResult

  // 評価できない
  return null
}

/**
 * 比較式を評価
 */
function evaluateComparison(expr: string): boolean | null {
  // === 演算子
  const eqMatch = expr.match(/^(.+?)\s*===\s*(.+)$/)
  if (eqMatch) {
    const left = safeEvaluate(eqMatch[1]!.trim())
    const right = safeEvaluate(eqMatch[2]!.trim())
    return left === right
  }

  // !== 演算子
  const neqMatch = expr.match(/^(.+?)\s*!==\s*(.+)$/)
  if (neqMatch) {
    const left = safeEvaluate(neqMatch[1]!.trim())
    const right = safeEvaluate(neqMatch[2]!.trim())
    return left !== right
  }

  return null
}

/**
 * 二項演算式を評価（算術演算 / 文字列連結）
 */
function evaluateBinaryExpression(expr: string): string | null {
  // 加算 / 文字列連結（左から右へ）
  // "prefix" + value + "suffix" のようなケースに対応

  // まず + で分割を試みる（ただし文字列内の + は除く）
  const parts = splitByOperator(expr, '+')
  if (parts.length > 1) {
    const results = parts.map(p => safeEvaluate(p.trim()))
    // すべて評価できた場合
    if (results.every(r => r !== '')) {
      // 数値のみなら算術演算
      if (results.every(r => /^-?\d+(\.\d+)?$/.test(r))) {
        const sum = results.reduce((acc, r) => acc + parseFloat(r), 0)
        return String(sum)
      }
      // 文字列連結
      return results.join('')
    }
    // 一部評価できない場合でも、評価できた部分だけ返す
    return results.join('')
  }

  // 乗算
  const mulParts = splitByOperator(expr, '*')
  if (mulParts.length === 2) {
    const left = safeEvaluate(mulParts[0]!.trim())
    const right = safeEvaluate(mulParts[1]!.trim())
    if (/^-?\d+(\.\d+)?$/.test(left) && /^-?\d+(\.\d+)?$/.test(right)) {
      return String(parseFloat(left) * parseFloat(right))
    }
  }

  return null
}

/**
 * 文字列を演算子で分割（文字列リテラル内の演算子は除く）
 */
function splitByOperator(expr: string, op: string): string[] {
  const parts: string[] = []
  let current = ''
  let inString: string | null = null
  let depth = 0

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]!

    // 文字列の開始/終了
    if ((char === '"' || char === "'") && (i === 0 || expr[i - 1] !== '\\')) {
      if (inString === null) {
        inString = char
      } else if (inString === char) {
        inString = null
      }
    }

    // 括弧の深さ
    if (char === '(' || char === '[' || char === '{') depth++
    if (char === ')' || char === ']' || char === '}') depth--

    // 演算子をチェック
    if (inString === null && depth === 0 && char === op) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }

  parts.push(current)
  return parts
}

/**
 * 動的表現をsignalの初期値で評価して文字列を返す（安全版）
 */
export function safeEvaluateWithSignals(expr: string, signals: SignalDeclaration[]): string {
  const substituted = substituteSignals(expr, signals)
  return safeEvaluate(substituted)
}

/**
 * 配列式を安全に評価
 */
export function safeEvaluateArray(expr: string, signals: SignalDeclaration[]): unknown[] | null {
  const substituted = substituteSignals(expr, signals)
  const trimmed = substituted.trim()

  // 空配列
  if (trimmed === '[]') return []

  // 配列リテラル [1, 2, 3] or [{...}, {...}]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      // JSON.parseで安全にパース（オブジェクトリテラルの場合）
      return JSON.parse(trimmed)
    } catch {
      // パースできない場合はnull
      return null
    }
  }

  return null
}
