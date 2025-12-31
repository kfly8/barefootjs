/**
 * Key Attribute Support Test
 *
 * ## Overview
 * Tests for JSX key attribute support in list rendering.
 * Key attribute enables efficient DOM reconciliation.
 *
 * ## Supported Patterns
 * - key with item id: key={item.id}
 * - key with index: key={index}
 * - key with computed expression: key={`${item.type}-${item.id}`}
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Key Attribute Support', () => {
  it('key with item id', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'a' },
          { id: 2, text: 'b' }
        ])
        return (
          <ul>
            {items().map(item => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain data-key attribute
    expect(file.markedJsx).toContain('data-key={item.id}')

    // Client JS should use reconcileList
    expect(file.clientJs).toContain('reconcileList')
  })

  it('key with index', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['a', 'b', 'c'])
        return (
          <ul>
            {items().map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // key with index should use __index
    expect(file.markedJsx).toContain('data-key={__index}')
  })

  it('key with computed expression', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, type: 'a' },
          { id: 2, type: 'b' }
        ])
        return (
          <ul>
            {items().map(item => (
              <li key={\`\${item.type}-\${item.id}\`}>{item.type}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Complex key expression should be preserved
    expect(file.markedJsx).toContain('data-key={`${item.type}-${item.id}`}')
  })

  it('list without key uses innerHTML', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['a', 'b', 'c'])
        return (
          <ul>
            {items().map(item => (
              <li>{item}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Without key, should use innerHTML (existing behavior)
    expect(file.clientJs).toContain('.innerHTML =')
    expect(file.clientJs).not.toContain('reconcileList')
  })

  it('key attribute is not output as regular attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'a' }])
        return (
          <ul>
            {items().map(item => (
              <li key={item.id} class="item">{item.text}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // key should be converted to data-key
    expect(file.markedJsx).toContain('data-key={item.id}')
    // Regular key attribute should not exist
    expect(file.markedJsx).not.toMatch(/\skey=/)
  })
})

describe('reconcileList Runtime', () => {
  it('generates correct reconcileList import', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'a' }])
        return (
          <ul>
            {items().map(item => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Should import reconcileList from barefoot
    expect(file.clientJs).toContain('reconcileList')
  })
})
