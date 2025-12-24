/**
 * Fragment Support Test
 *
 * ## Overview
 * Tests for JSX Fragment (`<>...</>`) support.
 * Fragments allow returning multiple elements without a wrapper.
 *
 * ## Supported Patterns
 * - Basic fragment with multiple children
 * - Fragment with dynamic content
 * - Nested fragments
 * - Fragment as conditional result
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Fragment Support', () => {
  it('basic fragment with multiple children', async () => {
    const source = `
      function Component() {
        return (
          <>
            <h1>Title</h1>
            <p>Content</p>
          </>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Fragment outputs as-is, first element gets data-bf-scope
    expect(component.serverJsx).toContain('<>')
    expect(component.serverJsx).toContain('</>')
    expect(component.serverJsx).toContain('<h1 data-bf-scope="Component">Title</h1>')
    expect(component.serverJsx).toContain('<p>Content</p>')
  })

  it('fragment with dynamic content', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <>
            <p>{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+</button>
          </>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Dynamic content should be properly handled
    expect(component.clientJs).toContain('createSignal(0)')
    expect(component.clientJs).toContain('_0.textContent = String(count())')
    expect(component.clientJs).toContain('_1.onclick')
  })

  it('nested fragments', async () => {
    const source = `
      function Component() {
        return (
          <>
            <>
              <span>Nested</span>
            </>
            <div>Sibling</div>
          </>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Nested fragments should work
    expect(component.serverJsx).toContain('<span>Nested</span>')
    expect(component.serverJsx).toContain('<div>Sibling</div>')
  })

  it('fragment as conditional result', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? (
              <>
                <span>A</span>
                <span>B</span>
              </>
            ) : (
              <span>Hidden</span>
            )}
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Fragment in conditional should work
    expect(component.serverJsx).toContain('<span>A</span>')
    expect(component.serverJsx).toContain('<span>B</span>')
    expect(component.serverJsx).toContain('<span>Hidden</span>')
  })

  it('fragment with text and elements mixed', async () => {
    const source = `
      function Component() {
        return (
          <>
            Hello
            <span>World</span>
            !
          </>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.serverJsx).toContain('Hello')
    expect(component.serverJsx).toContain('<span>World</span>')
  })

  it('fragment with single child', async () => {
    const source = `
      function Component() {
        return (
          <>
            <div>Only child</div>
          </>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Fragment outputs as-is, first element gets data-bf-scope
    expect(component.serverJsx).toContain('<div data-bf-scope="Component">Only child</div>')
  })

  it('empty fragment', async () => {
    const source = `
      function Component() {
        return <></>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Empty fragment outputs as-is (no element to add data-bf-scope)
    expect(component.serverJsx).toContain('<></>')
  })
})
