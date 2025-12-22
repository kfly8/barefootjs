/**
 * List Rendering Tests
 *
 * ## Overview
 * Verifies list rendering using `.map()` on arrays and
 * processing of dynamic elements within lists (events, conditionals, attributes).
 *
 * ## Supported Patterns
 * - Basic map: `items().map(item => <li>{item}</li>)`
 * - filter + map: `items().filter(x => x.done).map(...)`
 * - Events in map: `onClick={() => remove(item.id)}`
 * - Conditionals in map: `{item.editing ? <input /> : <span />}`
 * - Dynamic attributes in map: `class={item.done ? 'done' : ''}`
 *
 * ## Generated Code
 * ```typescript
 * // Input
 * <ul>{items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)}</ul>
 *
 * // Output (HTML)
 * <ul data-bf="l0">
 *   <li data-index="0" data-event-id="0">...</li>
 *   ...
 * </ul>
 *
 * // Output (clientJs)
 * l0.innerHTML = items().map((item, __index) => `<li data-index="${__index}" data-event-id="0">${item.text}</li>`).join('')
 * l0.addEventListener('click', (e) => {
 *   const target = e.target.closest('[data-event-id="0"]')
 *   if (target && target.dataset.eventId === '0') {
 *     const __index = parseInt(target.dataset.index, 10)
 *     const item = items()[__index]
 *     remove(item.id)
 *     updateAll()
 *   }
 * })
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('List Rendering - Basic', () => {
  it('array map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['a', 'b', 'c'])
        return <ul>{items().map(item => <li>{item}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // List element gets an ID
    expect(component.serverComponent).toContain('data-bf="l0"')

    // Updated with innerHTML in client JS (with __index for event delegation support)
    expect(component.clientJs).toContain('l0.innerHTML = items().map((item, __index) => `<li>${item}</li>`).join(\'\')')

    // Initial values are rendered
    expect(component.serverComponent).toContain('<li>a</li><li>b</li><li>c</li>')
  })

  it('array filter + map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { text: 'a', done: true },
          { text: 'b', done: false },
          { text: 'c', done: true }
        ])
        return <ul>{items().filter(x => x.done).map(item => <li>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // List element gets an ID
    expect(component.serverComponent).toContain('data-bf="l0"')

    // filter + map is used in client JS (with __index for event delegation support)
    expect(component.clientJs).toContain('items().filter(x => x.done).map((item, __index) =>')

    // Filtered elements are rendered with initial values (only done: true)
    expect(component.serverComponent).toContain('<li>a</li>')
    expect(component.serverComponent).toContain('<li>c</li>')
    expect(component.serverComponent).not.toContain('<li>b</li>')
  })
})

describe('List Rendering - Events', () => {
  it('onClick in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'a' },
          { id: 2, text: 'b' }
        ])
        const remove = (id) => setItems(items => items.filter(x => x.id !== id))
        return <ul>{items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // List element gets an ID
    expect(component.serverComponent).toContain('data-bf="l0"')

    // data-index attribute is included in template
    expect(component.clientJs).toContain('data-index="${__index}"')

    // Event delegation is set up
    expect(component.clientJs).toContain("l0.addEventListener('click'")
    expect(component.clientJs).toContain('const item = items()[__index]')
    expect(component.clientJs).toContain('remove(item.id)')
  })

  it('multiple onClick in map (different elements)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'a', done: false },
          { id: 2, text: 'b', done: true }
        ])
        const toggle = (id) => setItems(items => items.map(x => x.id === id ? { ...x, done: !x.done } : x))
        const remove = (id) => setItems(items => items.filter(x => x.id !== id))
        return (
          <ul>{items().map(todo => (
            <li>
              <span>{todo.text}</span>
              <button onClick={() => toggle(todo.id)}>Toggle</button>
              <button onClick={() => remove(todo.id)}>Delete</button>
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Each button gets a different data-event-id
    expect(component.clientJs).toContain('data-event-id="0"')
    expect(component.clientJs).toContain('data-event-id="1"')

    // Each event handler is set up individually
    expect(component.clientJs).toContain('toggle(todo.id)')
    expect(component.clientJs).toContain('remove(todo.id)')

    // Event delegation checks event-id
    expect(component.clientJs).toContain("dataset.eventId === '0'")
    expect(component.clientJs).toContain("dataset.eventId === '1'")
  })

  it('onChange in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, checked: false },
          { id: 2, checked: true }
        ])
        const toggle = (id) => setItems(items => items.map(x => x.id === id ? { ...x, checked: !x.checked } : x))
        return <div>{items().map(item => <input type="checkbox" onChange={() => toggle(item.id)} />)}</div>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // onchange event delegation is set up
    expect(component.clientJs).toContain("addEventListener('change'")
    expect(component.clientJs).toContain('toggle(item.id)')
  })

  it('multiple events on same element in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'a' }])
        return (
          <ul>{items().map(item => (
            <li>
              <input
                onInput={(e) => console.log('input')}
                onBlur={() => console.log('blur')}
                onKeyDown={(e) => console.log('keydown')}
              />
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // All events on same element share the same event-id
    expect(component.clientJs).toContain('data-event-id="0"')
    // All event listeners check the same event-id
    expect(component.clientJs).toMatch(/addEventListener\('input'[\s\S]*?data-event-id="0"/)
    expect(component.clientJs).toMatch(/addEventListener\('blur'[\s\S]*?data-event-id="0"/)
    expect(component.clientJs).toMatch(/addEventListener\('keydown'[\s\S]*?data-event-id="0"/)
  })

  it('blur event in map (capture phase)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1 }])
        return (
          <ul>{items().map(item => (
            <li><input onBlur={() => console.log('blur')} /></li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Blur event uses capture phase
    expect(component.clientJs).toContain("addEventListener('blur'")
    expect(component.clientJs).toContain('}, true)')
  })

  it('keydown event in map (conditional execution)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1 }])
        return (
          <ul>{items().map(item => (
            <li><input onKeyDown={(e) => e.key === 'Enter' && console.log('enter')} /></li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Conditional execution: if (condition) { action }
    expect(component.clientJs).toContain("if (e.key === 'Enter')")
    expect(component.clientJs).toContain("console.log('enter')")
  })

  it('keydown event in map (multiple conditions && execution)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
        const handleFinish = (id, text) => console.log(id, text)
        return (
          <ul>{items().map(item => (
            <li>
              <input onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && handleFinish(item.id, e.target.value)} />
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Multiple conditions are also wrapped in if statement
    // Expected: if (e.key === 'Enter' && !e.isComposing) { handleFinish(...) }
    expect(component.clientJs).toContain("if (e.key === 'Enter' && !e.isComposing)")
    expect(component.clientJs).toContain("handleFinish(item.id, e.target.value)")

    // Action should be inside the if statement
    const clientJs = component.clientJs
    const ifMatch = clientJs.match(/if \(e\.key === 'Enter' && !e\.isComposing\) \{[\s\S]*?handleFinish\(item\.id, e\.target\.value\)[\s\S]*?\}/)
    expect(ifMatch).not.toBeNull()
  })
})

describe('List Rendering - Dynamic Attributes', () => {
  it('dynamic class attribute in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { text: 'a', done: true },
          { text: 'b', done: false }
        ])
        return <ul>{items().map(item => <li class={item.done ? 'done' : ''}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Template contains dynamic class attribute
    expect(component.clientJs).toContain("class=\"${item.done ? 'done' : ''}\"")
  })

  it('dynamic style attribute in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { text: 'a', color: 'red' },
          { text: 'b', color: 'blue' }
        ])
        return <ul>{items().map(item => <li style={item.color}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Template contains dynamic style attribute
    expect(component.clientJs).toContain('style="${item.color}"')
  })

  it('dynamic checked attribute in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, checked: true },
          { id: 2, checked: false }
        ])
        return <div>{items().map(item => <input type="checkbox" checked={item.checked} />)}</div>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Template contains dynamic checked attribute
    expect(component.clientJs).toContain('checked="${item.checked}"')
  })
})

describe('List Rendering - Conditionals', () => {
  it('conditional rendering in map (ternary operator)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'a', editing: false },
          { id: 2, text: 'b', editing: true }
        ])
        return (
          <ul>{items().map(item => (
            <li>
              {item.editing ? <input value={item.text} /> : <span>{item.text}</span>}
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Template contains ternary operator
    expect(component.clientJs).toContain('${item.editing ?')
    // Input element is included
    expect(component.clientJs).toContain('<input')
    // Span element is included
    expect(component.clientJs).toContain('<span>')
  })

  it('ternary operator is evaluated in initial HTML', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'hello', editing: false },
          { id: 2, text: 'world', editing: true }
        ])
        return (
          <ul>
            {items().map(item => (
              <li>
                {item.editing ? (
                  <input value={item.text} />
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)

    // Initial HTML should not contain the ternary operator as-is
    expect(result.html).not.toContain('item.editing ?')
    // Correctly evaluated based on initial values
    // id:1 has editing:false, so <span>
    expect(result.html).toContain('<span>hello</span>')
    // id:2 has editing:true, so <input>
    expect(result.html).toContain('<input')
    expect(result.html).toContain('value="world"')
  })
})
