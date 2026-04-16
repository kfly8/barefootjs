---
title: AI-native Development
description: Millisecond component tests via IR, CLI-driven component discovery
---

# AI-native Development

Component tests run in milliseconds — no browser, no JSDOM. The compiler outputs a structured IR (JSON) capturing structure, signals, events, and accessibility. Test it directly:

```tsx
import { renderToTest } from '@barefootjs/test-utils'

test('Counter has a button with click handler', () => {
  const ir = renderToTest(<Counter />)

  expect(ir).toContainElement('button')
  expect(ir).toHaveEventHandler('click')
  expect(ir).toHaveSignal('count', { initialValue: 0 })
})
```

See [IR Schema Reference](../advanced/ir-schema.md) for the full specification.

## Component Discovery via CLI

The `barefoot` CLI gives structured access to component APIs:

```bash
barefoot search dialog       # Find components by name/category/tags
barefoot ui accordion        # Props, examples, a11y
barefoot core signals        # Core framework docs
```

Both humans and AI agents use these commands to discover components and generate correct usage without reading source files.
