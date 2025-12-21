/**
 * BarefootJS JSX Compiler - Type Definitions
 */

export type InteractiveElement = {
  id: string
  tagName: string
  events: Array<{
    name: string      // onClick
    eventName: string // click
    handler: string   // () => setCount(n => n + 1)
  }>
}

export type DynamicElement = {
  id: string
  tagName: string
  expression: string    // count()
  fullContent: string   // "doubled: " + count() * 2 など
}

export type ListElement = {
  id: string
  tagName: string
  mapExpression: string  // items().map(item => '<li>' + item + '</li>').join('')
  itemEvents: Array<{
    eventId: number       // イベントを区別するID
    eventName: string     // click, change, keydown
    handler: string       // (item) => remove(item.id)
    paramName: string     // item
  }>
  arrayExpression: string // items() - 配列を取得するための式
}

export type DynamicAttribute = {
  id: string
  tagName: string
  attrName: string       // class, style, disabled, value など
  expression: string     // isActive() ? 'active' : ''
}

export type SignalDeclaration = {
  getter: string      // count, on
  setter: string      // setCount, setOn
  initialValue: string // 0, false
}

export type LocalFunction = {
  name: string        // handleToggle
  code: string        // const handleToggle = (id) => { ... }
}

export type ChildComponentInit = {
  name: string        // AddTodoForm
  propsExpr: string   // { onAdd: handleAdd }
}

export type CompileResult = {
  staticHtml: string
  clientJs: string
  serverJsx: string
  signals: SignalDeclaration[]
  localFunctions: LocalFunction[]  // コンポーネント内で定義された関数
  childInits: ChildComponentInit[] // 初期化が必要な子コンポーネント
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  listElements: ListElement[]
  dynamicAttributes: DynamicAttribute[]
  props: string[]  // コンポーネントが受け取るprops名
  source: string   // コンポーネントのソースコード（map内インライン展開用）
}

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
}

export type ComponentOutput = {
  name: string
  hash: string           // コンテンツハッシュ (例: 7dc6817c)
  filename: string       // ハッシュ付きファイル名 (例: AddTodoForm-7dc6817c.js)
  clientJs: string
  serverComponent: string
}

export type CompileJSXResult = {
  html: string
  components: ComponentOutput[]
}

export type ListExpressionInfo = {
  mapExpression: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

export type MapExpressionResult = {
  mapExpression: string
  initialHtml: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

export type TemplateStringResult = {
  template: string
  events: Array<{
    eventId: number
    eventName: string
    handler: string
  }>
}

/**
 * 中間表現（IR）型定義
 *
 * JSX ASTから変換され、各種出力（HTML, ClientJS, ServerJSX）の生成に使用される。
 */

export type IRNode =
  | IRElement
  | IRText
  | IRExpression
  | IRComponent
  | IRConditional

export type IRElement = {
  type: 'element'
  tagName: string
  id: string | null
  staticAttrs: Array<{ name: string; value: string }>
  dynamicAttrs: Array<{ name: string; expression: string }>
  events: Array<{ name: string; eventName: string; handler: string }>
  children: IRNode[]
  listInfo: IRListInfo | null
}

export type IRText = {
  type: 'text'
  content: string
}

export type IRExpression = {
  type: 'expression'
  expression: string
  isDynamic: boolean
}

export type IRComponent = {
  type: 'component'
  name: string
  props: Array<{ name: string; value: string; isDynamic: boolean }>
  staticHtml: string
  childInits: ChildComponentInit | null
}

export type IRConditional = {
  type: 'conditional'
  condition: string
  whenTrue: IRNode
  whenFalse: IRNode
}

export type IRListInfo = {
  arrayExpression: string
  paramName: string
  itemTemplate: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
}
