/**
 * Examples build test
 *
 * Verify that each example builds correctly
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { compileJSX } from '../../index'
import { resolve } from 'node:path'

const EXAMPLES_DIR = resolve(import.meta.dir, '../../../examples')

describe('examples/counter', () => {
  let result: Awaited<ReturnType<typeof compileJSX>>

  beforeAll(async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'counter/index.tsx')
    result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })
  })

  it('compiles successfully', () => {
    expect(result.components.length).toBeGreaterThan(0)
  })

  it('Counter component is generated', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
  })

  it('createSignal and createEffect are imported', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter?.clientJs).toContain("import { createSignal, createEffect } from './barefoot.js'")
  })

  it('DOM is updated with createEffect', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter?.clientJs).toContain('createEffect(() => {')
    expect(counter?.clientJs).toContain('.textContent = count()')
  })

  it('event handlers are set', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter?.clientJs).toContain('onclick = () => setCount(n => n + 1)')
    expect(counter?.clientJs).toContain('onclick = () => setCount(n => n - 1)')
    expect(counter?.clientJs).toContain('onclick = () => setCount(0)')
  })
})

describe('examples/hono-static-html', () => {
  it('Counter component is compiled', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono-static-html/pages/components/Counter.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })

    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
    expect(counter?.clientJs).toContain('createSignal')
    expect(counter?.clientJs).toContain('createEffect')
  })

  it('Toggle component is compiled', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono-static-html/pages/components/Toggle.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })

    const toggle = result.components.find(c => c.name === 'Toggle')
    expect(toggle).toBeDefined()
    expect(toggle?.clientJs).toContain('createSignal')
    expect(toggle?.clientJs).toContain('createEffect')
  })
})

