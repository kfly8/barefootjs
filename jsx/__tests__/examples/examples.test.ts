/**
 * Examples ビルドテスト
 *
 * 各exampleが正しくビルドされることを確認する
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

  it('コンパイルに成功する', () => {
    expect(result.components.length).toBeGreaterThan(0)
  })

  it('Counter コンポーネントが生成される', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
  })

  it('createSignal と createEffect がインポートされる', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter?.clientJs).toContain("import { createSignal, createEffect } from './barefoot.js'")
  })

  it('createEffect でDOMが更新される', () => {
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter?.clientJs).toContain('createEffect(() => {')
    expect(counter?.clientJs).toContain('.textContent = count()')
  })

  it('イベントハンドラが設定される', () => {
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
    })
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

  it('TodoApp で createEffect が使用される', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp?.clientJs).toContain('createEffect(() => {')
  })

  it('AddTodoForm の initAddTodoForm が呼び出される', () => {
    const todoApp = result.components.find(c => c.name === 'TodoApp')
    expect(todoApp?.clientJs).toContain('initAddTodoForm({ onAdd: handleAdd })')
  })

  it('AddTodoForm で input イベントが設定される', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm?.clientJs).toContain('oninput = (e) => setNewText(e.target.value)')
  })

  it('AddTodoForm で keydown イベントが設定される', () => {
    const addTodoForm = result.components.find(c => c.name === 'AddTodoForm')
    expect(addTodoForm?.clientJs).toContain('onkeydown')
    expect(addTodoForm?.clientJs).toContain("e.key === 'Enter'")
  })
})

describe('examples/hono', () => {
  it('Counter コンポーネントがコンパイルされる', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono/Counter.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })

    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
    expect(counter?.clientJs).toContain('createSignal')
    expect(counter?.clientJs).toContain('createEffect')
  })

  it('Toggle コンポーネントがコンパイルされる', async () => {
    const entryPath = resolve(EXAMPLES_DIR, 'hono/Toggle.tsx')
    const result = await compileJSX(entryPath, async (path) => {
      return await Bun.file(path).text()
    })

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
    })
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
