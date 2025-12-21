# BarefootJS

JSXから静的HTML + クライアントJSを生成するコンパイラ。

## ARCHITECTURE

```
┌─────────────────┐
│  Counter.tsx    │  ← JSXコンポーネント
└────────┬────────┘
         │ compileJSX()
         ▼
┌─────────────────────────────────────┐
│         jsx/jsx-compiler.ts         │
│  - signal宣言の抽出                 │
│  - 動的コンテンツの検出 (__d0)      │
│  - イベントハンドラの検出 (__b0)    │
└────────┬───────────────────┬────────┘
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│ Counter.tsx     │  │ Counter.client  │
│ (静的HTML)      │  │ .js             │
│                 │  │                 │
│ - id属性付与    │  │ - signal初期化  │
│ - JS注入用の印  │  │ - updateAll()   │
│                 │  │ - onclick設定   │
└─────────────────┘  └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ dom/runtime.js  │
                     │ - signal実装    │
                     └─────────────────┘
```

## TODO

### signal

- [ ] 文字列のsignal `signal('hello')`
- [ ] 複数のsignal
- [ ] オブジェクトのsignal `signal({ name: '', age: 0 })`
- [ ] 配列のsignal `signal([])`

### 動的コンテンツ

- [ ] 初期値の正しい描画（現状: Toggle初期表示が"0"→"OFF"）
- [ ] 配列のmap `{items().map(item => <li>{item}</li>)}`
- [ ] 配列のfilter + map

### イベントハンドラ

- [ ] onChange
- [ ] onSubmit
- [ ] onKeyDown

### HTML属性

- [ ] 動的なclass属性 `class={isActive() ? 'active' : ''}`
- [ ] style属性
- [ ] 動的なstyle属性
- [ ] 動的なdisabled属性
- [ ] 動的なvalue属性

### コンポーネント

- [ ] propsなしのコンポーネント
- [ ] propsありのコンポーネント
- [ ] childrenを持つコンポーネント

### 型

- [ ] signalの型推論 `signal<number>(0)`
- [ ] コンポーネントpropsの型定義
- [ ] イベントハンドラの型 `(e: MouseEvent) => void`
- [ ] JSX要素の型チェック
