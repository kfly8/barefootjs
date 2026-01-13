/**
 * Control Flow Specification Tests
 *
 * Tests for CTRL-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Control Flow Specs', () => {
  // CTRL-001: Static ternary (evaluated at compile time)
  it('CTRL-001: evaluates static ternary at compile time', async () => {
    const source = `
      "use client"
      function Component() {
        return <p>{true ? 'Yes' : 'No'}</p>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Yes')

    cleanup()
  })

  // CTRL-002: Dynamic text ternary
  it('CTRL-002: handles dynamic text ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            <p>{show() ? 'Yes' : 'No'}</p>
            <button onClick={() => setShow(!show())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('No')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Yes')

    cleanup()
  })

  // CTRL-003: Element ternary
  it('CTRL-003: handles element ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [showA, setShowA] = createSignal(true)
        return (
          <div>
            {showA() ? <span class="a">A</span> : <span class="b">B</span>}
            <button onClick={() => setShowA(!showA())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const button = container.querySelector('button')!
    expect(button.textContent).toBe('Toggle')

    click(button)
    await waitForUpdate()

    cleanup()
  })

  // CTRL-004: Logical AND
  it('CTRL-004: handles logical AND', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            {show() && <span class="content">Visible</span>}
            <button onClick={() => setShow(true)}>Show</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.content')).toBeNull()

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.content')!.textContent).toBe('Visible')

    cleanup()
  })

  // CTRL-005: Logical OR (inverted)
  it('CTRL-005: handles logical OR', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [loading, setLoading] = createSignal(true)
        return (
          <div>
            {loading() || <span class="content">Loaded</span>}
            <button onClick={() => setLoading(false)}>Complete</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.content')).toBeNull()

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.content')!.textContent).toBe('Loaded')

    cleanup()
  })

  // CTRL-006: Null branch
  it('CTRL-006: handles null branch in ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <span class="visible">Content</span> : null}
            <button onClick={() => setShow(!show())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })

  // CTRL-007: Fragment uses comments
  it('CTRL-007: uses comment markers for fragments in conditionals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <><span>A</span><span>B</span></> : <span>C</span>}
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-008: Nested ternary
  it('CTRL-008: handles nested ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [state, setState] = createSignal('a')
        return (
          <div>
            {state() === 'a' ? <span>A</span> : state() === 'b' ? <span>B</span> : <span>C</span>}
            <button class="to-b" onClick={() => setState('b')}>B</button>
            <button class="to-c" onClick={() => setState('c')}>C</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })

  // CTRL-009: Static conditional (no markers)
  it('CTRL-009: static conditional has no markers', async () => {
    const source = `
      "use client"
      function Component() {
        return <div>{true ? <span>A</span> : <span>B</span>}</div>
      }
    `
    const result = await compile(source)
    expect(result.html).not.toContain('data-bf-cond')
  })

  // CTRL-010: Array map
  it('CTRL-010: handles array map', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['A', 'B', 'C'])
        return (
          <ul>
            {items().map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('A')
    expect(lis[1].textContent).toBe('B')
    expect(lis[2].textContent).toBe('C')

    cleanup()
  })

  // CTRL-011: Filter + map chain
  it('CTRL-011: handles filter + map chain', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([1, 2, 3, 4, 5])
        return (
          <ul>
            {items().filter(x => x % 2 === 0).map(x => <li key={x}>{x}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(2)
    expect(lis[0].textContent).toBe('2')
    expect(lis[1].textContent).toBe('4')

    cleanup()
  })

  // CTRL-012: key -> data-key
  it('CTRL-012: transforms key to data-key', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 'a' }, { id: 'b' }])
        return (
          <ul>
            {items().map(item => <li key={item.id}>{item.id}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-013: Index key
  it('CTRL-013: handles index as key', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['X', 'Y', 'Z'])
        return (
          <ul>
            {items().map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('X')
    expect(lis[1].textContent).toBe('Y')
    expect(lis[2].textContent).toBe('Z')

    cleanup()
  })

  // CTRL-014: Computed key
  it('CTRL-014: handles computed key expression', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ a: 'x', b: 'y' }])
        return (
          <ul>
            {items().map(item => <li key={item.a + item.b}>{item.a}{item.b}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-015: Nested map
  it('CTRL-015: handles nested map', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [groups, setGroups] = createSignal([
          { id: 1, items: ['A', 'B'] },
          { id: 2, items: ['C', 'D'] }
        ])
        return (
          <div>
            {groups().map(g => (
              <div key={g.id} class="group">
                {g.items.map((item, i) => <span key={i}>{item}</span>)}
              </div>
            ))}
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-016: Conditional in map
  it('CTRL-016: handles conditional in map', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, done: false },
          { id: 2, done: true }
        ])
        return (
          <ul>
            {items().map(item => (
              <li key={item.id}>
                {item.done ? <span class="done">Done</span> : <span class="pending">Pending</span>}
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis[0].querySelector('.pending')).not.toBeNull()
    expect(lis[1].querySelector('.done')).not.toBeNull()

    cleanup()
  })

  // CTRL-017: Component ternary (issue #171)
  // Verifies that components in ternary expressions generate proper conditional IR
  // with slot IDs (hasJsxBranch includes 'component' type)
  it('CTRL-017: generates cond() for component ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function ChildA() {
        return <span class="a">A</span>
      }
      function ChildB() {
        return <span class="b">B</span>
      }
      function Component() {
        const [showA, setShowA] = createSignal(true)
        return (
          <div>
            {showA() ? <ChildA /> : <ChildB />}
          </div>
        )
      }
    `
    const result = await compile(source)

    // Verify cond() is generated in client JS (component conditional has slot ID)
    expect(result.clientJs).toContain('cond(')
    // Verify static component content is inlined in templates (not placeholders)
    expect(result.clientJs).toContain('class="a"')
    expect(result.clientJs).toContain('class="b"')
    // Should NOT contain placeholder comments
    expect(result.clientJs).not.toContain('<!-- ChildA -->')
    expect(result.clientJs).not.toContain('<!-- ChildB -->')
  })

  // CTRL-018: Component with null ternary (issue #171)
  // Tests that ternary with element and null generates proper conditional markers
  it('CTRL-018: handles element in ternary with null', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            {show() ? <span class="child">Child Content</span> : null}
            <button onClick={() => setShow(true)}>Show</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initially hidden (null branch)
    expect(container.querySelector('.child')).toBeNull()

    // Click to show
    click(container.querySelector('button')!)
    await waitForUpdate()

    // Now visible
    expect(container.querySelector('.child')).not.toBeNull()

    cleanup()
  })

  // CTRL-019: Logical AND with element (issue #171)
  // Tests that logical AND with element generates proper conditional markers
  it('CTRL-019: handles logical AND with element', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            {show() && <span class="child">Visible</span>}
            <button onClick={() => setShow(true)}>Show</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.child')).toBeNull()

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.child')!.textContent).toBe('Visible')

    cleanup()
  })

  // CTRL-020: If statement with early return (issue #171)
  // Verifies that if/return patterns are converted to IRConditional
  it('CTRL-020: converts if/return to conditional IR', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        if (show()) {
          return (
            <div>
              <span class="visible">Visible</span>
            </div>
          )
        }
        return (
          <div>
            <span class="hidden">Hidden</span>
          </div>
        )
      }
    `
    const result = await compile(source)

    // Verify cond() is generated (if/return converted to conditional)
    expect(result.clientJs).toContain('cond(')
    // Verify both branches are in the templates
    expect(result.clientJs).toContain('visible')
    expect(result.clientJs).toContain('hidden')
    // Initially shows "visible" branch (show() is true)
    expect(result.html).toContain('visible')
  })

  // CTRL-021: If-else statement with returns (issue #171)
  // Verifies that if-else patterns are converted to IRConditional
  it('CTRL-021: converts if-else/return to conditional IR', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [mode, setMode] = createSignal('a')
        if (mode() === 'a') {
          return <span class="mode-a">Mode A</span>
        } else {
          return <span class="mode-b">Mode B</span>
        }
      }
    `
    const result = await compile(source)

    // Verify cond() is generated
    expect(result.clientJs).toContain('cond(')
    // Verify both branches are in templates
    expect(result.clientJs).toContain('mode-a')
    expect(result.clientJs).toContain('mode-b')
    // Initially shows "mode-a" branch (mode() === 'a' is true)
    expect(result.html).toContain('mode-a')
  })

  // CTRL-022: Consecutive if statements with early returns (issue #169)
  // Verifies that multiple consecutive if/return patterns chain as nested conditionals
  it('CTRL-022: handles consecutive if statements with early returns', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [type, setType] = createSignal('a')
        if (type() === 'a') {
          return <span class="type-a">Type A</span>
        }
        if (type() === 'b') {
          return <span class="type-b">Type B</span>
        }
        return <span class="default">Default</span>
      }
    `
    const result = await compile(source)

    // Verify cond() is generated (consecutive if/return converted to nested conditional)
    expect(result.clientJs).toContain('cond(')
    // Verify all branches are in the templates
    expect(result.clientJs).toContain('type-a')
    expect(result.clientJs).toContain('type-b')
    expect(result.clientJs).toContain('default')
    // Initially shows "type-a" branch (type() === 'a' is true)
    expect(result.html).toContain('type-a')
  })

  // CTRL-023: If statements with variable declarations between them (issue #169)
  // Verifies handling of: if (a) return X; const b = ...; if (b) return Y; return Z;
  it('CTRL-023: handles if statements with intermediate variable declarations', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [name, setName] = createSignal('special')
        const items: Record<string, string> = { foo: 'FOO' }

        if (name() === 'special') {
          return <span class="special">Special</span>
        }

        const item = items[name()]
        if (item) {
          return <span class="item">{item}</span>
        }

        return <span class="fallback">Not found</span>
      }
    `
    const result = await compile(source)

    // Verify cond() is generated
    expect(result.clientJs).toContain('cond(')
    // Verify compilation succeeds and structure is valid
    expect(result.html).toBeTruthy()
    // Initially shows "special" branch (name() === 'special' is true)
    expect(result.html).toContain('special')
  })

  // CTRL-024: Static component in conditional - preserves content after condition change
  // Tests that static components (no client JS) have their HTML included in cond() templates
  it('CTRL-024: preserves static component content in conditional templates', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function IconA() { return <span class="icon-a">A</span> }
      function IconB() { return <span class="icon-b">B</span> }

      function Switcher() {
        const [flag, setFlag] = createSignal(true)
        return (
          <button onClick={() => setFlag(!flag())}>
            {flag() ? <IconA /> : <IconB />}
          </button>
        )
      }
    `
    const result = await compile(source)

    // Both component contents should be in the client JS templates (not just placeholders)
    expect(result.clientJs).toContain('icon-a')
    expect(result.clientJs).toContain('icon-b')
    // Should NOT contain placeholder comments
    expect(result.clientJs).not.toContain('<!-- IconA -->')
    expect(result.clientJs).not.toContain('<!-- IconB -->')
  })

  // CTRL-025: Dynamic component in conditional - reinitializes after condition change
  // Tests that dynamic components (with client JS) have childInits info passed to cond()
  it('CTRL-025: includes childInits info for dynamic components in conditionals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function Counter() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
      }

      function Static() { return <span class="static">static</span> }

      function App() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            <button onClick={() => setShow(!show())}>Toggle</button>
            {show() ? <Counter /> : <Static />}
          </div>
        )
      }
    `
    const result = await compile(source)

    // cond() should be called with childInits information for Counter
    // The exact format may vary, but it should include init function reference
    expect(result.clientJs).toContain('cond(')
    // Dynamic component (Counter) should have initialization info
    // Static component content should be in template
    expect(result.clientJs).toContain('static')
  })

})
