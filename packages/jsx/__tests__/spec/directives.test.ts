/**
 * Directives Specification Tests
 *
 * Tests for DIR-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * Primary tests are in:
 * - extractors/directive.test.ts
 */

import { describe, it, expect } from 'bun:test'
import { compileJSX } from '../../src/jsx-compiler'

describe('Directives Specs', () => {
  // DIR-001: Directive required for createSignal import
  // Reference: directive.test.ts:54
  it('DIR-001: requires "use client" directive for createSignal', async () => {
    const source = `
      import { createSignal } from '@barefootjs/dom'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `

    await expect(
      compileJSX('/test/Component.tsx', async () => source, {})
    ).rejects.toThrow()
  })

  // DIR-002: Directive required for events
  // Reference: directive.test.ts:95
  it('DIR-002: requires "use client" directive for events', async () => {
    const source = `
      function Component() {
        return <button onClick={() => console.log('clicked')}>Click</button>
      }
    `

    await expect(
      compileJSX('/test/Component.tsx', async () => source, {})
    ).rejects.toThrow()
  })

  // DIR-003: Directive must be first statement
  // Reference: directive.test.ts:25
  // Note: Directive position validation is tested in extractors/directive.test.ts
  it('DIR-003: documents that directive should be first statement', () => {
    // The compiler validates that 'use client' or 'use client' appears
    // before other statements (except comments) when the directive is required.
    // This is a documentation test - see directive.test.ts:25 for the full test.
    expect(true).toBe(true)
  })

  // DIR-004: Both quote styles accepted
  // Reference: directive.test.ts:5
  it('DIR-004: accepts double quotes for directive', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `

    // Should not throw
    const result = await compileJSX('/test/Component.tsx', async () => source, {})
    expect(result.files.length).toBeGreaterThan(0)
  })

  it('DIR-004: accepts single quotes for directive', async () => {
    const source = `
      'use client'
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `

    // Should not throw
    const result = await compileJSX('/test/Component.tsx', async () => source, {})
    expect(result.files.length).toBeGreaterThan(0)
  })

  // DIR-005: Comments before directive allowed
  // Reference: directive.test.ts:43
  it('DIR-005: allows comments before directive', async () => {
    const source = `
      // This is a component
      /* Multi-line
         comment */
      'use client'
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `

    // Should not throw
    const result = await compileJSX('/test/Component.tsx', async () => source, {})
    expect(result.files.length).toBeGreaterThan(0)
  })
})
