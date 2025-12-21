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

### map内の動的要素

- [ ] map内のonClick `items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)`
- [ ] map内のonChange, onKeyDown等
- [ ] map内の動的class属性 `items().map(item => <li class={item.done ? 'done' : ''}>{item.text}</li>)`
- [ ] map内の動的style属性
- [ ] map内の動的disabled/checked属性

### 型

- [ ] signalの型推論 `signal<number>(0)`
- [ ] コンポーネントpropsの型定義
- [ ] イベントハンドラの型 `(e: MouseEvent) => void`
- [ ] JSX要素の型チェック
