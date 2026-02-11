<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/logo/logo-for-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="images/logo/logo-for-light.svg">
    <img alt="BarefootJS" src="images/logo/logo-for-light.svg" width="400">
  </picture>
</p>

<p align="center">
  <strong>Reactive JSX for any backend</strong><br>
  Generates Marked Templates + Client JS from Signal-based JSX
</p>

---

## Quick Start

### STEP 1. Write Signal-based reactive JSX

```tsx
"use client"

import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)

  return (
    <>
      <p class="counter">{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
      <button onClick={() => setCount(n => n - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  )
}
```

### STEP 2. Compile to Marked Template + Client JS

```bash
npx barefootjs compile Counter.tsx
```

Output:
- `Counter.tsx` - Marked Template (server-side, with `bf` hydration markers)
- `Counter.client.js` - Client JS (minimal JS for reactivity)

### STEP 3. Render on server, hydrate on client

**Server (e.g., Hono):**
```tsx
import { Hono } from 'hono'
import { Counter } from './dist/Counter'

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html>
      <body>
        <Counter />
        <script type="module" src="/Counter.client.js" />
      </body>
    </html>
  )
})

export default app
```

**Client:**
The Client JS automatically finds elements with `bf` markers and hydrates them with reactivity.

---

## Features

- **Zero runtime overhead (SSR)** - Server renders pure templates, no JS framework needed
- **Fine-grained reactivity** - Signal-based updates, only re-render what changed
- **Type-safe** - Full TypeScript support with preserved type information
- **Backend agnostic** - Currently supports Hono/JSX, designed for Go, Python, etc.

---

## Documentation

- [barefootjs.dev](https://barefootjs.dev/) - Core documentation
- [ui.barefootjs.dev](https://ui.barefootjs.dev/) - UI components built with BarefootJS

---

## Acknowledgements

This project is inspired by and built with:

- [SolidJS](https://www.solidjs.com/) - Fine-grained reactivity model and Signal API design
- [shadcn/ui](https://ui.shadcn.com/) - UI component design system (docs/ui)
- [Hono](https://hono.dev/) - JSX runtime for server-side rendering

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
