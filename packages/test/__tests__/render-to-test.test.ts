import { describe, test, expect } from 'bun:test'
import { renderToTest } from '../src/index'

// ---------------------------------------------------------------------------
// renderToTest API behavior (not component-specific)
// ---------------------------------------------------------------------------

describe('Error detection', () => {
  test('missing "use client" reports BF001', () => {
    const source = `
import { createSignal } from '@barefootjs/dom'

function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}

export { Counter }
`
    const result = renderToTest(source, 'counter.tsx')
    const errorCodes = result.errors.map(e => e.code)
    expect(errorCodes).toContain('BF001')
  })
})
