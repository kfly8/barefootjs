import { describe, test, expect } from 'bun:test'
import { extractUseClientDirective, validateDomImports, validateEventHandlers } from '../../src/extractors/directive'

describe('extractUseClientDirective', () => {
  test('detects "use client" directive with double quotes', () => {
    const source = `"use client"
import { createSignal } from '@barefootjs/dom'
function Counter() { return <div /> }`
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(true)
  })

  test('detects "use client" directive with single quotes', () => {
    const source = `'use client'
import { createSignal } from '@barefootjs/dom'
function Counter() { return <div /> }`
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(true)
  })

  test('returns false when no directive', () => {
    const source = `import { createSignal } from '@barefootjs/dom'
function Counter() { return <div /> }`
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(false)
  })

  test('returns false when directive is not at file start', () => {
    const source = `import { createSignal } from '@barefootjs/dom'
"use client"
function Counter() { return <div /> }`
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(false)
  })

  test('returns false for "use server" directive', () => {
    const source = `"use server"
function ServerAction() { return {} }`
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(false)
  })

  test('returns false for empty file', () => {
    const source = ''
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(false)
  })

  test('works with comment before directive (comments are preserved in AST)', () => {
    const source = `// This is a comment
"use client"
function Counter() { return <div /> }`
    // Note: The directive must be at the very start - comments are part of statements
    // In this case, "use client" is still the first ExpressionStatement
    expect(extractUseClientDirective(source, 'test.tsx')).toBe(true)
  })
})

describe('validateDomImports', () => {
  test('throws error when @barefootjs/dom is imported without directive', () => {
    const source = `import { createSignal } from '@barefootjs/dom'
function Counter() { return <div /> }`
    expect(() => validateDomImports(source, 'test.tsx', false)).toThrow()
  })

  test('includes imported names in error message', () => {
    const source = `import { createSignal, createMemo } from '@barefootjs/dom'
function Counter() { return <div /> }`
    try {
      validateDomImports(source, 'test.tsx', false)
      expect(true).toBe(false) // Should not reach here
    } catch (e: any) {
      expect(e.message).toContain('createSignal')
      expect(e.message).toContain('createMemo')
      expect(e.message).toContain('"use client"')
    }
  })

  test('does not throw when directive is present', () => {
    const source = `"use client"
import { createSignal } from '@barefootjs/dom'
function Counter() { return <div /> }`
    expect(() => validateDomImports(source, 'test.tsx', true)).not.toThrow()
  })

  test('does not throw for other imports without directive', () => {
    const source = `import React from 'react'
import { something } from './local'
function Counter() { return <div /> }`
    expect(() => validateDomImports(source, 'test.tsx', false)).not.toThrow()
  })

  test('does not throw for server-only components', () => {
    const source = `import { db } from './db'
async function ServerComponent() { return <div /> }`
    expect(() => validateDomImports(source, 'test.tsx', false)).not.toThrow()
  })
})

describe('validateEventHandlers', () => {
  test('throws error when onClick is used without directive', () => {
    const source = `function Button() {
  return <button onClick={() => console.log('clicked')}>Click</button>
}`
    expect(() => validateEventHandlers(source, 'test.tsx', false)).toThrow()
  })

  test('includes handler names in error message', () => {
    const source = `function Form() {
  return (
    <form>
      <input onChange={(e) => {}} onBlur={() => {}} />
      <button onClick={() => {}}>Submit</button>
    </form>
  )
}`
    try {
      validateEventHandlers(source, 'test.tsx', false)
      expect(true).toBe(false) // Should not reach here
    } catch (e: any) {
      expect(e.message).toContain('onClick')
      expect(e.message).toContain('onChange')
      expect(e.message).toContain('onBlur')
      expect(e.message).toContain('"use client"')
    }
  })

  test('does not throw when directive is present', () => {
    const source = `"use client"
function Button() {
  return <button onClick={() => console.log('clicked')}>Click</button>
}`
    expect(() => validateEventHandlers(source, 'test.tsx', true)).not.toThrow()
  })

  test('does not throw for components without event handlers', () => {
    const source = `function Header() {
  return <h1>Welcome</h1>
}`
    expect(() => validateEventHandlers(source, 'test.tsx', false)).not.toThrow()
  })

  test('does not throw for server components with only static content', () => {
    const source = `function Card({ title, description }) {
  return (
    <div class="card">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}`
    expect(() => validateEventHandlers(source, 'test.tsx', false)).not.toThrow()
  })

  test('detects onKeyDown and other keyboard events', () => {
    const source = `function Input() {
  return <input onKeyDown={(e) => e.key === 'Enter' && submit()} />
}`
    expect(() => validateEventHandlers(source, 'test.tsx', false)).toThrow()
  })

  test('detects onSubmit on forms', () => {
    const source = `function Form() {
  return <form onSubmit={(e) => e.preventDefault()}>Submit</form>
}`
    expect(() => validateEventHandlers(source, 'test.tsx', false)).toThrow()
  })
})
