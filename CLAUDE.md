# BarefootJS

最小限のランタイムで、AIが最適化されたコードを生成するためのフレームワーク。

## コンセプト

- **ランタイムほぼゼロ**: `signal` のみの最小API
- **effectなし**: リアクティブな自動更新は使わず、操作関数が直接DOMを更新
- **AIがコード生成**: 人間はやりたいことを伝え、AIが最適化済みコードを生成
- **人間が読める**: 冗長でも意図が明確なコード。局所的に読めて修正可能
- **JSXコンパイラ**: 宣言的なJSXを命令的なDOM操作コードに変換

## 最小API

### signal

リアクティブな値を作成する（React風API）。

```typescript
import { signal } from 'barefoot'

const [count, setCount] = signal(0)

count()              // 値を取得: 0
setCount(5)          // 値を直接設定
setCount(n => n + 1) // 関数で更新
```

## JSXコンパイル

JSXで宣言的に書いて、コンパイラが命令的なDOM操作コードに変換する。

```tsx
// Counter.tsx（入力）
function Counter() {
  const [count, setCount] = signal(0)
  return (
    <div>
      <p class="counter">{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
```

```
↓ コンパイル
```

```html
<!-- 静的HTML -->
<div>
  <p id="__d0" class="counter">0</p>
  <button id="__b0">+1</button>
</div>
```

```js
// クライアントJS
const __d0 = document.getElementById('__d0')
const __b0 = document.getElementById('__b0')

function updateAll() {
  __d0.textContent = count()
}

__b0.onclick = () => {
  setCount(n => n + 1)
  updateAll()
}

updateAll()
```

## 開発コマンド

```bash
# テスト実行
bun test

# カウンター例のビルド
cd examples/counter
bun run build

# カウンター例の実行
cd examples/counter
bun run serve
```

## ディレクトリ構成

```
barefoot/
├── CLAUDE.md              # この設計指針
├── package.json
├── core/
│   ├── index.ts           # エクスポート
│   ├── signal.ts          # signal実装（TypeScript）
│   ├── runtime.js         # ブラウザ用ランタイム
│   └── __tests__/
│       └── signal.test.ts
├── jsx/
│   └── compiler/
│       └── jsx-compiler.ts # JSXコンパイラ
└── examples/
    ├── counter/            # 静的ビルド例
    │   ├── index.tsx
    │   ├── Counter.tsx
    │   ├── template.html
    │   └── build.ts
    └── hono-counter/       # Hono SSR例
        ├── server.ts       # Honoサーバー
        ├── index.tsx
        └── Counter.tsx
```
