---
title: AI-native Development
description: Testable IR, CLI discovery, and workflows designed for AI-assisted development
---

# AI-native Development

UI component testing is slow. Traditional approaches require a browser (Playwright, Cypress) or a DOM emulator (JSDOM, happy-dom). Even "fast" setups take seconds per test and break on environment quirks.

BarefootJS makes component tests as fast as unit tests. **The compiler produces a structured IR (JSON) that captures everything about a component — structure, signals, events, accessibility. You test the IR directly, no browser needed.** Tests run in milliseconds.

This same structured output makes BarefootJS uniquely suited for AI-assisted development. AI agents can discover components via CLI, generate code, and verify it with fast tests — all without browser automation or screenshot diffing.

## `renderToTest()`

`renderToTest()` compiles a JSX component and returns its IR for assertions:

```tsx
import { renderToTest } from '@barefootjs/test-utils'

test('Counter has a button with click handler', () => {
  const ir = renderToTest(<Counter />)

  expect(ir).toContainElement('button')
  expect(ir).toHaveEventHandler('click')
  expect(ir).toHaveSignal('count', { initialValue: 0 })
})
```

The IR captures structure, reactivity, events, accessibility, and styles — everything needed to verify behavior without rendering. See [IR Schema Reference](../advanced/ir-schema.md) for details.

## CLI for Component Discovery

The `barefoot` CLI gives both humans and AI agents structured access to component APIs:

```bash
barefoot search dialog       # Find components by name/category/tags
barefoot ui accordion        # Full reference: props, examples, a11y
barefoot core signals        # Core framework docs
```

Each command produces structured, parseable output. No screenshots, no browser automation, no flaky visual assertions.
