/**
 * Spread Attributes Support Test
 *
 * ## Overview
 * Tests for JSX spread attribute support ({...props}).
 * Spread attributes allow passing multiple props to an element at once.
 *
 * ## Supported Patterns
 * - Basic spread: {...props}
 * - Spread with additional attributes: {...props} class="extra"
 * - Multiple spreads: {...baseProps} {...overrideProps}
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Spread Attributes Support', () => {
  it('basic spread attributes', async () => {
    const source = `
      function Component() {
        const buttonProps = { type: 'submit', disabled: true }
        return (
          <button {...buttonProps}>Submit</button>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain spread
    expect(file.markedJsx).toContain('{...buttonProps}')
  })

  it('spread with additional attributes', async () => {
    const source = `
      function Component() {
        const inputProps = { type: 'text', placeholder: 'Enter name' }
        return (
          <input {...inputProps} className="form-input" />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain both spread and additional attributes
    expect(file.markedJsx).toContain('{...inputProps}')
    expect(file.markedJsx).toContain('className="form-input"')
  })

  it('spread attributes override order', async () => {
    const source = `
      function Component() {
        const baseProps = { type: 'text' }
        const overrideProps = { type: 'password' }
        return (
          <input {...baseProps} {...overrideProps} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain both spreads in order
    expect(file.markedJsx).toContain('{...baseProps}')
    expect(file.markedJsx).toContain('{...overrideProps}')
  })

  it('spread with dynamic expression', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [props, setProps] = createSignal({ class: 'active' })
        return (
          <div {...props()}>Content</div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain spread with signal call replaced
    expect(file.markedJsx).toContain('{...{ class: \'active\' }}')
  })

  it('spread on self-closing element', async () => {
    const source = `
      function Component() {
        const imgProps = { src: '/image.png', alt: 'Image' }
        return (
          <img {...imgProps} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Server JSX should contain spread on self-closing element
    expect(file.markedJsx).toContain('{...imgProps}')
    expect(file.markedJsx).toMatch(/<img[^>]*\/>/)
  })
})
