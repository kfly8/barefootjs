/**
 * Examples build test
 *
 * Verify that each example builds correctly
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { compileJSX, honoServerAdapter } from '../../index'
import { resolve } from 'node:path'

const EXAMPLES_DIR = resolve(import.meta.dir, '../../../examples')

describe('examples/counter', () => {
  let result: Awaited<ReturnType<typeof compileJSX>>

  beforeAll(async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'counter/index.tsx')
    result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { serverAdapter: honoServerAdapter })
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

describe('examples/todo', () => {
  let result: Awaited<ReturnType<typeof compileJSX>>

  beforeAll(async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'todo/index.tsx')
    result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { serverAdapter: honoServerAdapter })
  })

  it('compiles successfully', () => {
    expect(result.components.length).toBeGreaterThan(0)
  })

  it('TodoApp component is generated', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp).toBeDefined()
  })

  it('AddTodoForm component is generated', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm).toBeDefined()
  })

  it('createEffect is used in TodoApp', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp?.clientJs).toContain('createEffect(() => {')
  })

  it('initAddTodoForm of AddTodoForm is called', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp?.clientJs).toContain('initAddTodoForm({ onAdd: handleAdd })')
  })

  it('input event is set in AddTodoForm', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm?.clientJs).toContain('oninput = (e) => setNewText(e.target.value)')
  })

  it('keydown event is set in AddTodoForm', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm?.clientJs).toContain('onkeydown')
    expect(addTodoForm?.clientJs).toContain("e.key === 'Enter'")
  })
})

describe('examples/hono', () => {
  it('Counter component is compiled', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono/Counter.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { serverAdapter: honoServerAdapter })

    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
    expect(counter?.clientJs).toContain('createSignal')
    expect(counter?.clientJs).toContain('createEffect')
  })

  it('Toggle component is compiled', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono/Toggle.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { serverAdapter: honoServerAdapter })

    const toggle = result.components.find(c => c.name === 'Toggle')
    expect(toggle).toBeDefined()
    expect(toggle?.clientJs).toContain('createSignal')
    expect(toggle?.clientJs).toContain('createEffect')
  })
})

describe('examples/todo-spa', () => {
  let result: Awaited<ReturnType<typeof compileJSX>>

  beforeAll(async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'todo-spa/TodoApp.tsx')
    result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    }, { serverAdapter: honoServerAdapter })
  })

  it('コンパイルに成功する', () => {
    expect(result.components.length).toBeGreaterThan(0)
  })

  it('TodoApp コンポーネントが生成される', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp).toBeDefined()
  })

  it('AddTodoForm コンポーネントが生成される', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm).toBeDefined()
  })

  it('TodoItem コンポーネントが生成される', () => {
    const todoItem = result.components.find(c => c.name === 'TodoItem')
    expect(todoItem).toBeDefined()
  })

  it('TodoApp で fetch が使用される (API呼び出し)', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    // fetch calls in the client-side code (for CRUD operations)
    expect(todoApp?.clientJs).toContain("fetch('/api/todos'")
    expect(todoApp?.clientJs).toContain("fetch(`/api/todos/${id}`")
  })

  it('AddTodoForm の initAddTodoForm が呼び出される', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp?.clientJs).toContain('initAddTodoForm({ onAdd: handleAdd })')
  })
})
