# UI Components

BarefootJS UI is a collection of accessible, signal-based UI components designed for server-first rendering. Components are installed individually via the `barefoot` CLI and compiled through the same two-phase pipeline as your application code.

> **Component API Reference & Demos:** Individual component documentation (props, examples, interactive demos) lives at [ui.barefootjs.dev](https://ui.barefootjs.dev). This section covers architecture, installation, and customization.

## Overview

### What BarefootJS UI Provides

- **Signal-based interactivity** — Components use `createSignal` and `createEffect` for fine-grained reactivity
- **Server-rendered by default** — HTML is generated at build/request time; client JS handles only interactivity
- **Accessible** — ARIA attributes, keyboard navigation, and focus management built in
- **Composable** — `asChild` pattern and Context API for flexible composition
- **Unstyled core, styled defaults** — Utility classes (UnoCSS/Tailwind) for styling, easy to customize

### Available Components

| Category | Components |
|----------|-----------|
| Basic | Button, Badge, Card, Input, Label |
| Interactive | Accordion, Tabs, Switch, Checkbox, Select |
| Overlay | Dialog, Dropdown Menu, Tooltip, Toast |
| Utility | Portal, Slot (polymorphic rendering), Icon |

### Documentation Split

| Topic | Location |
|-------|----------|
| Component API, Props, Demos | [ui.barefootjs.dev](https://ui.barefootjs.dev) |
| Architecture & Design | This page |
| Installation & Setup | This page |
| Theming & Customization | This page |
| Component Patterns | [Component Authoring](./components/component-authoring.md) |

---

## Installation

### Prerequisites

BarefootJS UI components depend on the core packages:

<!-- tabs:pm -->
<!-- tab:npm -->
```bash
npm install @barefootjs/jsx @barefootjs/dom
```
<!-- tab:bun -->
```bash
bun add @barefootjs/jsx @barefootjs/dom
```
<!-- tab:pnpm -->
```bash
pnpm add @barefootjs/jsx @barefootjs/dom
```
<!-- tab:yarn -->
```bash
yarn add @barefootjs/jsx @barefootjs/dom
```
<!-- /tabs -->

### Adding Components

Use the `barefoot` CLI to add components to your project. Each component is installed individually — no monolithic bundle:

```bash
barefoot add button
barefoot add accordion
barefoot add dialog
```

This copies the component source into your project (typically `components/ui/`), so you own the code and can customize it freely.

### Adding Multiple Components

```bash
barefoot add button card input label
```

### Component Dependencies

Some components depend on others. The CLI resolves dependencies automatically:

| Component | Dependencies |
|-----------|-------------|
| Button | Slot |
| Accordion | — (uses Context API internally) |
| Dialog | Portal |
| Dropdown Menu | Portal |
| Toast | Portal |
| Tooltip | Portal |
| Select | — |

---

## Architecture

### How Components Work

BarefootJS UI components follow the same two-phase compilation model as all BarefootJS code:

```
Component Source (.tsx with "use client")
    ↓
[Phase 1] JSX → IR
    ↓
[Phase 2a] IR → Marked Template (server HTML with hydration markers)
[Phase 2b] IR → Client JS (signal setup, event binding)
    ↓
Server renders HTML → Client hydrates interactivity
```

A component like `Accordion` compiles to:

1. **Server template** — Renders full HTML with `data-bf-scope` and `data-bf` markers
2. **Client JS** — Creates signals for open/closed state, binds click/keyboard events, sets up ARIA attribute effects

### Server vs Client Boundary

Components use `"use client"` to mark interactive code:

```tsx
"use client"
import { createSignal, createEffect } from '@barefootjs/dom'

export function Switch(props: SwitchProps) {
  const [checked, setChecked] = createSignal(props.defaultChecked ?? false)

  return (
    <button
      role="switch"
      aria-checked={checked()}
      onClick={() => setChecked(v => !v)}
    >
      <span class={checked() ? 'translate-x-4' : 'translate-x-0'} />
    </button>
  )
}
```

The compiler splits this into:
- **Template**: Static HTML structure with hydration markers
- **Client JS**: `createSignal`, `createEffect` for `aria-checked`, event handler for `onClick`

### Context-Based State

Compound components (Accordion, Tabs, Select) use the Context API for parent-child communication:

```tsx
// Parent provides state
const AccordionItemContext = createContext<{
  open: () => boolean
  onOpenChange: () => void
}>()

// Child consumes state
function AccordionContent(props: Props) {
  const ctx = useContext(AccordionItemContext)
  // ctx.open() is reactive — content shows/hides automatically
}
```

See [Context API](./components/context-api.md) for details.

---

## Patterns

### The `asChild` Pattern

Many components support `asChild` to render as a different element while preserving behavior:

```tsx
// Renders as <button>
<Button>Click me</Button>

// Renders as <a> with Button's styles and behavior
<Button asChild>
  <a href="/page">Navigate</a>
</Button>
```

This is powered by the `Slot` component, which merges parent props onto the child element. See [Children & Slots](./components/children-slots.md) for details.

### Controlled vs Uncontrolled

Components support both patterns:

```tsx
// Uncontrolled — component manages its own state
<Switch defaultChecked={true} />

// Controlled — parent manages state via signals
const [checked, setChecked] = createSignal(false)
<Switch checked={checked()} onCheckedChange={setChecked} />
```

The compiler detects "controlled signals" — when a signal name matches a prop name — and generates sync effects automatically.

### Accessible by Default

All interactive components include:

- **ARIA attributes** — `aria-expanded`, `aria-checked`, `role`, etc.
- **Keyboard navigation** — Arrow keys, Home/End, Enter/Space
- **Focus management** — Focus trapping in dialogs, focus restoration on close
- **Screen reader support** — Semantic markup and live regions (Toast)

---

## Theming & Customization

### CSS Variables

Components use CSS custom properties for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --destructive: 0 84.2% 60.2%;
  --border: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  /* ... */
}
```

### Customizing Components

Since components are copied into your project, you can edit them directly:

```tsx
// components/ui/button.tsx — your copy, edit freely
const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  // Add your own variant:
  brand: 'bg-brand text-white hover:bg-brand/90',
}
```

### Using with UnoCSS / Tailwind

BarefootJS UI components use utility classes compatible with both UnoCSS and Tailwind CSS. Configure your CSS framework to scan component files:

```ts
// uno.config.ts
export default defineConfig({
  content: {
    filesystem: [
      'components/ui/**/*.tsx',
    ],
  },
})
```

---

## Next Steps

- Browse the [Component Catalog](https://ui.barefootjs.dev) for API docs and interactive demos
- Learn about [Component Authoring](./components/component-authoring.md) to build your own
- Understand the [Context API](./components/context-api.md) for compound components
- See [Children & Slots](./components/children-slots.md) for the `asChild` pattern
