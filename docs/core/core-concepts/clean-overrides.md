---
title: Clean Overrides
description: CSS Cascade Layers ensure user styles always beat component defaults
---

# Clean Overrides (CSS Layers)

BarefootJS uses CSS Cascade Layers to guarantee that user-supplied classes always override component base classes — without runtime JS, without merge functions, and without worrying about generation order.

## The Problem

When a component defines base classes and a user passes override classes, both have equal CSS specificity. The winner depends on which CSS rule appears later in the stylesheet — which in turn depends on the order the CSS toolchain happens to generate them.

```tsx
// Component defines base classes
<button className="bg-primary text-white">

// User wants to override the background
<Button className="bg-red-500">
```

If `bg-primary` is generated after `bg-red-500` in the CSS output, the user's override silently fails. This is fragile and order-dependent.

## The Solution

CSS Cascade Layers provide a spec-level mechanism for controlling style priority. Styles in a named `@layer` always lose to un-layered styles, regardless of specificity or source order.

BarefootJS puts component base classes into `@layer components`. User-supplied classes remain un-layered. The cascade guarantees the user wins:

```css
/* Layer ordering: lowest → highest priority */
@layer preflights, base, shortcuts, components, default;
```

Un-layered styles (user overrides) always beat any layer — this is defined by the CSS spec, not by any toolchain convention.

## How It Works

The compiler's `cssLayerPrefix` option prefixes component base classes at compile time.

### Source

```tsx
const baseClasses = 'inline-flex items-center bg-primary text-primary-foreground'

export function Button({ className = '', children }) {
  return (
    <button className={`${baseClasses} ${className}`}>
      {children}
    </button>
  )
}
```

### Compiled Output (with `cssLayerPrefix: 'components'`)

```tsx
const baseClasses = 'layer-components:inline-flex layer-components:items-center layer-components:bg-primary layer-components:text-primary-foreground'

export function Button({ className = '', children }) {
  return (
    <button className={`${baseClasses} ${className}`}>
      {children}
    </button>
  )
}
```

### Generated CSS

The CSS toolchain (e.g., UnoCSS) sees the `layer-components:` prefix and emits those classes inside `@layer components`:

```css
@layer components {
  .layer-components\:bg-primary { background-color: var(--primary); }
  .layer-components\:text-primary-foreground { color: var(--primary-foreground); }
  /* ... */
}

/* User classes — un-layered, always win */
.bg-red-500 { background-color: #ef4444; }
```

### Cascade Resolution

```
<Button className="bg-red-500">

Applied classes:
  layer-components:bg-primary     → @layer components  (lower priority)
  bg-red-500                      → un-layered          (higher priority)

Result: bg-red-500 wins. Always.
```

## Key Properties

- **Zero runtime cost** — Prefixing happens at compile time. No JS runs in the browser to merge classes.
- **Works with any CSS tool** — The `layer-components:` prefix convention is supported by UnoCSS. Any tool that supports CSS Cascade Layers can use this approach.
- **No merge function needed** — The CSS cascade handles class conflict resolution natively.
- **Language-independent** — The prefixing is applied to the IR, so Go, Rust, and Node adapters all benefit equally.
- **Preserves both classes** — Both classes remain in the DOM. DevTools shows exactly what was applied and what was overridden.

## Configuration

Enable CSS layer prefixing by setting `cssLayerPrefix` in the compiler options:

```typescript
compile(source, {
  cssLayerPrefix: 'components',
  // ...
})
```

For the CSS side, declare the layer order at the top of your global stylesheet:

```css
@layer preflights, base, shortcuts, components, default;
```

See the [UnoCSS integration guide](../adapters/hono-adapter.md) for a full setup example.
