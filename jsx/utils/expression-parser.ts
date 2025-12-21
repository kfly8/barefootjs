/**
 * BarefootJS JSX Compiler - Expression Parser
 *
 * TypeScript API を使用して JavaScript 式を正確にパースする。
 * 正規表現ベースのパースを置き換え、エッジケースに対応。
 */

import ts from 'typescript'

/**
 * 式をパースしてTypeScript ASTを取得
 */
function parseExpression(code: string): ts.Expression | null {
  // 式を文として解釈できるようにラップ
  const wrapped = `(${code})`
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    wrapped,
    ts.ScriptTarget.Latest,
    true
  )

  if (sourceFile.statements.length === 0) return null

  const stmt = sourceFile.statements[0]
  if (!ts.isExpressionStatement(stmt)) return null

  // 括弧式の中身を取得
  const expr = stmt.expression
  if (ts.isParenthesizedExpression(expr)) {
    return expr.expression
  }
  return expr
}

/**
 * アロー関数のボディを抽出
 */
export function extractArrowBody(handler: string): string {
  const expr = parseExpression(handler)
  if (!expr || !ts.isArrowFunction(expr)) {
    return handler
  }

  const body = expr.body
  if (ts.isBlock(body)) {
    // { ... } ブロックの場合、中身を抽出
    const text = body.getText().trim()
    return text.slice(1, -1).trim() // { と } を除去
  }

  // 式の場合はそのまま返す
  return body.getText()
}

/**
 * アロー関数のパラメータ部分を抽出
 */
export function extractArrowParams(handler: string): string {
  const expr = parseExpression(handler)
  if (!expr || !ts.isArrowFunction(expr)) {
    return '()'
  }

  const params = expr.parameters
  if (params.length === 0) {
    return '()'
  }

  // パラメータを文字列として再構築
  const paramTexts = params.map(p => p.getText())
  return `(${paramTexts.join(', ')})`
}

/**
 * 条件付きハンドラ (condition && action) をパース
 *
 * 以下のパターンに対応:
 * - `e.key === 'Enter' && doSomething()` → { condition: "e.key === 'Enter'", action: "doSomething()" }
 * - `e.key === 'Enter' && !e.isComposing && doSomething()` → { condition: "e.key === 'Enter' && !e.isComposing", action: "doSomething()" }
 *
 * 右端の式が関数呼び出しの場合、それをアクションとして扱い、
 * それ以外の部分を条件として扱う。
 */
export function parseConditionalHandler(body: string): { condition: string; action: string } | null {
  const expr = parseExpression(body)
  if (!expr) return null

  // condition && action の形式をチェック
  if (!ts.isBinaryExpression(expr)) return null
  if (expr.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return null

  const condition = expr.left.getText().trim()
  const action = expr.right.getText().trim()

  // 右側（action）が関数呼び出しかどうかをチェック
  // 例: doSomething(), handleFinish(id, text) など
  if (ts.isCallExpression(expr.right)) {
    // 左側（condition）が有効な条件式かチェック
    if (isValidCondition(expr.left)) {
      return { condition, action }
    }
  }

  return null
}

/**
 * 式が有効な条件式かどうかを判定
 *
 * 有効な条件:
 * - 比較演算子: `a === b`, `x !== y`, `n > 0` など
 * - 否定演算子: `!e.isComposing`
 * - 論理AND演算子でつながった条件: `a === b && !c`
 * - 識別子やプロパティアクセス: `item.done`, `isValid`
 */
function isValidCondition(expr: ts.Expression): boolean {
  // 括弧で囲まれた式
  if (ts.isParenthesizedExpression(expr)) {
    return isValidCondition(expr.expression)
  }

  // 比較演算子
  if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind

    // 比較演算子
    const isComparison =
      op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      op === ts.SyntaxKind.EqualsEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsToken ||
      op === ts.SyntaxKind.GreaterThanToken ||
      op === ts.SyntaxKind.LessThanToken ||
      op === ts.SyntaxKind.GreaterThanEqualsToken ||
      op === ts.SyntaxKind.LessThanEqualsToken

    if (isComparison) {
      return true
    }

    // 論理AND演算子でつながった条件 (a && b)
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
      return isValidCondition(expr.left) && isValidCondition(expr.right)
    }

    // 論理OR演算子 (a || b)
    if (op === ts.SyntaxKind.BarBarToken) {
      return isValidCondition(expr.left) && isValidCondition(expr.right)
    }
  }

  // 否定演算子 (!x)
  if (ts.isPrefixUnaryExpression(expr) && expr.operator === ts.SyntaxKind.ExclamationToken) {
    return true
  }

  // 識別子やプロパティアクセス (item.done, isValid)
  if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
    return true
  }

  // 関数呼び出し (isValid() のような条件関数)
  if (ts.isCallExpression(expr)) {
    return true
  }

  return false
}

/**
 * シグナル呼び出しを初期値で置換（AST を使用）
 *
 * 文字列リテラル内のシグナル名は置換しない。
 */
export function replaceSignalCalls(
  expr: string,
  signals: Array<{ getter: string; initialValue: string }>
): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    expr,
    ts.ScriptTarget.Latest,
    true
  )

  // 置換位置を記録（後ろから置換するため逆順でソート）
  const replacements: Array<{ start: number; end: number; value: string }> = []

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isIdentifier(callee) && node.arguments.length === 0) {
        const name = callee.text
        const signal = signals.find(s => s.getter === name)
        if (signal) {
          replacements.push({
            start: node.getStart(),
            end: node.getEnd(),
            value: signal.initialValue,
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // 後ろから置換
  replacements.sort((a, b) => b.start - a.start)
  let result = expr
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}
