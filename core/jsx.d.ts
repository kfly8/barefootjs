/**
 * BareJS JSX 型定義
 *
 * コンパイラへの入力として使用するJSXの型チェック用
 */

declare namespace JSX {
  type Element = any

  interface IntrinsicElements {
    div: any
    p: any
    h1: any
    h2: any
    h3: any
    span: any
    button: any
    input: any
    ul: any
    li: any
    a: any
    [elemName: string]: any
  }
}
