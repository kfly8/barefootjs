# Error Codes Reference

BarefootJS compiler errors follow the format `BF` + 3-digit code. Errors include source location and actionable suggestions.

## Error Format

```
error[BF001]: 'use client' directive required for components with createSignal

  --> src/components/Counter.tsx:3:1
   |
 3 | import { createSignal } from '@barefootjs/dom'
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: Add 'use client' at the top of the file
```

---

## Directive Errors (BF001–BF003)

### BF001 — Missing `"use client"` Directive

**Trigger:** A component uses reactive APIs (`createSignal`, `createEffect`, event handlers) but the file doesn't start with `"use client"`.

```tsx
// ❌ BF001
import { createSignal } from '@barefootjs/dom'
export function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

**Fix:** Add the directive at the top of the file:

```tsx
// ✅ Fixed
"use client"
import { createSignal } from '@barefootjs/dom'
export function Counter() { ... }
```

### BF002 — Invalid Directive Position

**Trigger:** `"use client"` is not the first statement in the file.

```tsx
// ❌ BF002
import { createSignal } from '@barefootjs/dom'
"use client"
```

**Fix:** Move the directive to the very first line (before any imports).

### BF003 — Client Component Importing Server Component

**Trigger:** A `"use client"` component imports from a file that doesn't have `"use client"`.

**Fix:** Either add `"use client"` to the imported file, or restructure the import to only reference types/constants (which are safe to import).

---

## Signal Errors (BF010–BF012)

### BF010 — Unknown Signal Reference

**Trigger:** Code references a signal getter that wasn't declared in the component.

```tsx
"use client"
export function Counter() {
  return <span>{count()}</span>  // ❌ count not declared
}
```

**Fix:** Declare the signal:

```tsx
const [count, setCount] = createSignal(0)
```

### BF011 — Signal Used Outside Component

**Trigger:** `createSignal` is called at module level instead of inside a component function.

```tsx
// ❌ BF011 — module-level signal
const [count, setCount] = createSignal(0)

export function Counter() {
  return <span>{count()}</span>
}
```

**Fix:** Move the signal inside the component:

```tsx
export function Counter() {
  const [count, setCount] = createSignal(0)
  return <span>{count()}</span>
}
```

### BF012 — Invalid Signal Usage

**Trigger:** Signal API used in an unsupported pattern.

---

## JSX Errors (BF020–BF023)

### BF020 — Invalid JSX Expression

**Trigger:** An expression in JSX braces can't be compiled.

### BF021 — Unsupported JSX Pattern

**Trigger:** `.map()` の前にある配列メソッドチェーンがSSRテンプレートにコンパイルできない場合に発生します。サポート対象外のパターンはすべてクライアント側で評価されます。

#### SSR対応チェーン

以下のチェーンパターンのみ `.map()` の前処理としてSSRコンパイルされます:

- `.filter().map()`
- `.sort().map()` / `.toSorted().map()`
- `.filter().sort().map()`
- `.sort().filter().map()`

`.reduce()`, `.slice()`, `.flatMap()`, `.find()` など上記以外のメソッドチェーンは検出対象外で、クライアント側の評価にフォールバックします。

#### filter: サポートされるプレディケート

アロー関数の式本体で、以下の要素で構成されるもの:

- プロパティアクセス: `t.done`, `t.price`
- リテラル: `'active'`, `5`, `true`
- 比較: `===`, `!==`, `>`, `<`, `>=`, `<=`
- 算術: `+`, `-`, `*`, `/`, `%`
- 論理: `&&`, `||`, `!`
- 三項演算子: `cond ? a : b`

```tsx
// ✅ SSRコンパイル可能
{items().filter(t => !t.done).map(t => <li>{t.name}</li>)}
{items().filter(t => t.price > 100 && t.active).map(t => <li>{t.name}</li>)}

// ❌ BF021 — typeof, 関数呼び出し, ネストした高階メソッドは対象外
{items().filter(t => typeof t === 'string').map(...)}
{items().filter(t => customFn(t)).map(...)}
{items().filter(t => t.tags.some(tag => tag.featured)).map(...)}
```

#### sort: サポートされるコンパレータ

`(a, b) => a.field - b.field` 形式の単純な減算パターンのみ:

```tsx
// ✅ SSRコンパイル可能
{items().sort((a, b) => a.price - b.price).map(...)}     // 昇順
{items().toSorted((a, b) => b.date - a.date).map(...)}   // 降順

// ❌ BF021 — ブロック本体, localeCompare, 三項演算子等は対象外
{items().sort((a, b) => { return a.price - b.price }).map(...)}
{items().sort((a, b) => a.name.localeCompare(b.name)).map(...)}
```

#### 対処法

`/* @client */` を付けてクライアント側で評価する:

```tsx
{/* @client */ todos().filter(t => t.items.some(i => i.done)).map(t => (
  <li>{t.name}</li>
))}
```

### BF022 — Invalid JSX Attribute

**Trigger:** An attribute value can't be compiled.

### BF023 — Missing Key in List

**Trigger:** A `.map()` loop doesn't provide a `key` prop for reconciliation.

```tsx
// ❌ BF023
{items().map(item => <li>{item.name}</li>)}
```

**Fix:**

```tsx
// ✅ Add key
{items().map(item => <li key={item.id}>{item.name}</li>)}
```

---

## Type Errors (BF030–BF031)

### BF030 — Type Inference Failed

**Trigger:** The compiler can't infer the type of a signal or expression for the target template language.

### BF031 — Props Type Mismatch

**Trigger:** A prop value doesn't match the declared type in the component's interface.

---

## Component Errors (BF040–BF043)

### BF040 — Component Not Found

**Trigger:** A referenced child component can't be resolved.

### BF041 — Circular Dependency

**Trigger:** Two components import each other.

### BF042 — Invalid Component Name

**Trigger:** Component name doesn't follow PascalCase convention.

### BF043 — Props Destructuring (Warning)

**Trigger:** Props are destructured in the function parameter, which captures values once and may lose reactivity.

```tsx
// ⚠️ BF043
function Child({ count }: Props) {
  return <span>{count}</span>  // count is captured once
}
```

```
warning[BF043]: Destructuring props in function parameters captures values once.
   = help: Use `props.count` for reactive access, or suppress with // @bf-ignore props-destructuring
```

**Fix options:**

1. Use direct props access:

```tsx
function Child(props: Props) {
  return <span>{props.count}</span>  // Reactive
}
```

2. Suppress if intentional (static initial value):

```tsx
// @bf-ignore props-destructuring
function Child({ initialCount }: Props) {
  const [count, setCount] = createSignal(initialCount)
  return <span>{count()}</span>
}
```

---

## Suppressing Warnings

Use `@bf-ignore` to suppress specific warnings:

```tsx
// @bf-ignore props-destructuring
function Component({ checked }: Props) {
  // Warning suppressed
}
```

**Available rules:**

| Rule ID | Error Code | Description |
|---------|------------|-------------|
| `props-destructuring` | BF043 | Props destructuring in function parameters |

---

## Error Code Quick Reference

| Code | Severity | Description |
|------|----------|-------------|
| BF001 | Error | Missing `"use client"` directive |
| BF002 | Error | Invalid directive position |
| BF003 | Error | Client component importing server component |
| BF010 | Error | Unknown signal reference |
| BF011 | Error | Signal used outside component |
| BF012 | Error | Invalid signal usage |
| BF020 | Error | Invalid JSX expression |
| BF021 | Error | Unsupported JSX pattern for SSR |
| BF022 | Error | Invalid JSX attribute |
| BF023 | Error | Missing key in list |
| BF030 | Error | Type inference failed |
| BF031 | Error | Props type mismatch |
| BF040 | Error | Component not found |
| BF041 | Error | Circular dependency |
| BF042 | Error | Invalid component name |
| BF043 | Warning | Props destructuring breaks reactivity |
