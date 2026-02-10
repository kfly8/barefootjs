# IR Schema Reference

The Intermediate Representation (IR) is a pure JSON tree structure that sits between JSX parsing and template/client-JS generation. It is **JSX-independent** — adapters consume IR without any knowledge of the original JSX syntax.

## Pipeline Position

```
JSX Source → [Phase 1: analyzer + jsx-to-ir] → IR → [Phase 2a: adapter] → Template
                                                   → [Phase 2b: ir-to-client-js] → Client JS
```

## Source

IR の型定義は [`packages/jsx/src/types.ts`](../../../packages/jsx/src/types.ts) にあります。ノード型、属性、メタデータすべてがこのファイルに定義されています。

主なノード型:

| Type | 概要 |
|------|------|
| `IRElement` | HTML/SVG 要素 |
| `IRText` | 静的テキスト |
| `IRExpression` | 動的式 (`{braces}`) |
| `IRConditional` | 三項演算子・論理式による分岐 |
| `IRLoop` | `.map()` によるリスト（filter/sort 含む） |
| `IRComponent` | 子コンポーネント参照 |
| `IRFragment` | JSX フラグメント (`<>...</>`) |
| `IRIfStatement` | コンポーネント本体内の早期 return |
| `IRProvider` | Context Provider |

---

## Hydration Markers

IR の `slotId` と `needsScope` フィールドは、レンダリングされたテンプレートの HTML 属性にマッピングされます:

| IR Field | HTML Output | Purpose |
|----------|------------|---------|
| `needsScope: true` | `data-bf-scope="ComponentName"` | コンポーネントのルート境界 |
| `slotId: "0"` | `data-bf="0"` | インタラクティブ要素の参照 |
| Conditional `slotId` | `data-bf-cond="1"` | 条件分岐のアンカー |

クライアントランタイムはこれらのマーカーを使って、フル DOM 走査なしにハイドレーション対象の要素を特定します。

---

## Debugging

`outputIR: true` を渡すと IR を JSON として出力できます:

```typescript
import { compileJSXSync } from '@barefootjs/jsx'

const result = compileJSXSync(source, 'Counter.tsx', {
  adapter: new HonoAdapter(),
  outputIR: true,
})

// result.ir contains the full ComponentIR
console.log(JSON.stringify(result.ir, null, 2))

// result.additionalFiles includes the *.ir.json file
// e.g., { path: 'Counter.ir.json', content: '...' }
```
