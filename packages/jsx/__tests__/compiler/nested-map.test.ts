/**
 * Nested Map Support Test
 *
 * ## Overview
 * Tests for nested .map() expressions in JSX list rendering.
 *
 * ## Supported Patterns
 * - Two levels of nesting
 * - Three levels of nesting
 * - Nested map with events
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Nested Map Support', () => {
  it('two levels of nesting', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [groups, setGroups] = createSignal([
          { name: 'Group A', items: ['a1', 'a2'] },
          { name: 'Group B', items: ['b1', 'b2'] }
        ])
        return (
          <div>
            {groups().map(group => (
              <div>
                <h2>{group.name}</h2>
                <ul>
                  {group.items.map(item => (
                    <li>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should have nested maps (signal call replaced with initial value)
    expect(file.serverJsx).toContain('.map((group')
    expect(file.serverJsx).toContain('group.items?.map((item')
    // Should have two levels of nesting
    expect(file.serverJsx).toContain('<li>{item}</li>')
  })

  it('nested map with keys', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [categories, setCategories] = createSignal([
          { id: 1, name: 'Category 1', products: [{ id: 1, name: 'P1' }] },
          { id: 2, name: 'Category 2', products: [{ id: 2, name: 'P2' }] }
        ])
        return (
          <div>
            {categories().map(category => (
              <section key={category.id}>
                <h2>{category.name}</h2>
                <ul>
                  {category.products.map(product => (
                    <li key={product.id}>{product.name}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Both outer and inner elements should have data-key
    expect(file.serverJsx).toContain('data-key={category.id}')
    expect(file.serverJsx).toContain('data-key={product.id}')
  })

  it('matrix rendering (grid of items)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [matrix, setMatrix] = createSignal([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ])
        return (
          <table>
            <tbody>
              {matrix().map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Should handle matrix rendering (signal call replaced with initial value)
    expect(file.serverJsx).toContain('.map((row')
    expect(file.serverJsx).toContain('row?.map((cell')
    expect(file.serverJsx).toContain('<tr')
    expect(file.serverJsx).toContain('<td')
  })
})
