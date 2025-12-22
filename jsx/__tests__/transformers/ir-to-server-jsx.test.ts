/**
 * IR to Server JSX Transformer Tests
 */

import { describe, it, expect } from 'bun:test'
import { htmlToJsx, generateServerJsx } from '../../transformers/ir-to-server-jsx'
import type { ServerComponentAdapter } from '../../types'

describe('htmlToJsx', () => {
  it('converts class to className', () => {
    const html = '<div class="container"><span class="text">Hello</span></div>'
    const jsx = htmlToJsx(html)
    expect(jsx).toBe('<div className="container"><span className="text">Hello</span></div>')
  })

  it('does not convert class inside attribute values', () => {
    const html = '<div class="my-class" data-info="class-name">Text</div>'
    const jsx = htmlToJsx(html)
    expect(jsx).toBe('<div className="my-class" data-info="class-name">Text</div>')
  })

  it('handles multiple class attributes', () => {
    const html = '<div class="a"><p class="b"><span class="c">Nested</span></p></div>'
    const jsx = htmlToJsx(html)
    expect(jsx).toBe('<div className="a"><p className="b"><span className="c">Nested</span></p></div>')
  })

  it('returns unchanged html if no class attributes', () => {
    const html = '<div id="main"><span>No class here</span></div>'
    const jsx = htmlToJsx(html)
    expect(jsx).toBe(html)
  })

  it('handles empty string', () => {
    expect(htmlToJsx('')).toBe('')
  })
})

describe('generateServerJsx', () => {
  const mockAdapter: ServerComponentAdapter = {
    generateServerComponent: ({ name, props, jsx }) => {
      const propsParam = props.length > 0 ? `{ ${props.join(', ')} }` : ''
      return `function ${name}(${propsParam}) { return ${jsx} }`
    }
  }

  it('generates server component without props', () => {
    const result = generateServerJsx(
      '<div class="counter">0</div>',
      'Counter',
      [],
      mockAdapter
    )
    expect(result).toBe('function Counter() { return <div className="counter">0</div> }')
  })

  it('generates server component with props', () => {
    const result = generateServerJsx(
      '<div class="todo-item">Todo</div>',
      'TodoItem',
      ['todo', 'onToggle'],
      mockAdapter
    )
    expect(result).toBe('function TodoItem({ todo, onToggle }) { return <div className="todo-item">Todo</div> }')
  })

  it('converts class to className in generated jsx', () => {
    const result = generateServerJsx(
      '<div class="a"><span class="b">Text</span></div>',
      'MyComponent',
      [],
      mockAdapter
    )
    expect(result).toContain('className="a"')
    expect(result).toContain('className="b"')
    expect(result).not.toContain('class="')
  })
})

describe('generateServerJsx with honoServerAdapter', () => {
  // Import actual adapter for integration test
  it('generates Hono-compatible server component', async () => {
    const { honoServerAdapter } = await import('../../adapters/hono')

    const result = generateServerJsx(
      '<div class="counter"><span data-bf="d0">0</span></div>',
      'Counter',
      [],
      honoServerAdapter
    )

    expect(result).toContain('import { useRequestContext }')
    expect(result).toContain('function Counter()')
    expect(result).toContain("c.get('usedComponents')")
    expect(result).toContain('className="counter"')
  })

  it('generates Hono server component with props hydration', async () => {
    const { honoServerAdapter } = await import('../../adapters/hono')

    const result = generateServerJsx(
      '<ul class="todo-list"></ul>',
      'TodoApp',
      ['initialTodos'],
      honoServerAdapter
    )

    expect(result).toContain('export function TodoApp({ initialTodos }')
    expect(result).toContain('data-bf-props="TodoApp"')
    expect(result).toContain('__hydrateProps')
  })
})
