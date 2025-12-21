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
