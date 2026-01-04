/**
 * Expressions Specification Tests
 *
 * Tests for EXPR-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate, input } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Expressions Specs', () => {
  // EXPR-011: const memo = createMemo(() => { return x }) - memo with block body
  describe('EXPR-011: createMemo with block body', () => {
    it('evaluates memo with block body containing simple return', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [count, setCount] = createSignal(5)
          const doubled = createMemo(() => {
            return count() * 2
          })
          return (
            <div>
              <p class="result">{doubled()}</p>
              <button onClick={() => setCount(count() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const p = container.querySelector('.result')!
      expect(p.textContent).toBe('10')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(p.textContent).toBe('12')

      cleanup()
    })

    it('evaluates memo with block body containing conditional logic', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [touched, setTouched] = createSignal(false)
          const [name, setName] = createSignal('')
          const error = createMemo(() => {
            if (!touched()) return ''
            return name().trim() === '' ? 'Name is required' : ''
          })
          return (
            <div>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              <p class="error">{error()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      const errorEl = container.querySelector('.error')!

      // Initially not touched, no error
      expect(errorEl.textContent).toBe('')

      // Blur without entering name - should show error
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()
      expect(errorEl.textContent).toBe('Name is required')

      // Enter name - error should clear
      input(inputEl, 'John')
      await waitForUpdate()
      expect(errorEl.textContent).toBe('')

      cleanup()
    })

    it('evaluates memo with block body containing multiple statements', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal([1, 2, 3, 4, 5])
          const stats = createMemo(() => {
            const arr = items()
            const sum = arr.reduce((a, b) => a + b, 0)
            const avg = sum / arr.length
            return \`Sum: \${sum}, Avg: \${avg}\`
          })
          return (
            <div>
              <p class="stats">{stats()}</p>
              <button onClick={() => setItems([...items(), 10])}>Add 10</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const statsEl = container.querySelector('.stats')!
      expect(statsEl.textContent).toBe('Sum: 15, Avg: 3')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(statsEl.textContent).toBe('Sum: 25, Avg: 4.166666666666667')

      cleanup()
    })
  })

  // EXPR-012: const a = createMemo(...); const b = createMemo(() => a()) - chained memos
  describe('EXPR-012: chained memos', () => {
    it('evaluates chained memos with dependencies', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [base, setBase] = createSignal(2)
          const doubled = createMemo(() => base() * 2)
          const quadrupled = createMemo(() => doubled() * 2)
          return (
            <div>
              <p class="base">Base: {base()}</p>
              <p class="doubled">Doubled: {doubled()}</p>
              <p class="quadrupled">Quadrupled: {quadrupled()}</p>
              <button onClick={() => setBase(base() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.base')!.textContent).toBe('Base: 2')
      expect(container.querySelector('.doubled')!.textContent).toBe('Doubled: 4')
      expect(container.querySelector('.quadrupled')!.textContent).toBe('Quadrupled: 8')

      click(container.querySelector('button')!)
      await waitForUpdate()

      expect(container.querySelector('.base')!.textContent).toBe('Base: 3')
      expect(container.querySelector('.doubled')!.textContent).toBe('Doubled: 6')
      expect(container.querySelector('.quadrupled')!.textContent).toBe('Quadrupled: 12')

      cleanup()
    })

    it('handles multiple signal sources in chained memos', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [a, setA] = createSignal(1)
          const [b, setB] = createSignal(10)
          const sumAB = createMemo(() => a() + b())
          const multiplied = createMemo(() => sumAB() * 2)
          return (
            <div>
              <p class="sum">Sum: {sumAB()}</p>
              <p class="multiplied">Multiplied: {multiplied()}</p>
              <button class="inc-a" onClick={() => setA(a() + 1)}>Inc A</button>
              <button class="inc-b" onClick={() => setB(b() + 10)}>Inc B</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 11')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 22')

      click(container.querySelector('.inc-a')!)
      await waitForUpdate()
      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 12')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 24')

      click(container.querySelector('.inc-b')!)
      await waitForUpdate()
      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 22')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 44')

      cleanup()
    })

    it('handles three-level memo chain', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [value, setValue] = createSignal(1)
          const level1 = createMemo(() => value() + 1)
          const level2 = createMemo(() => level1() * 2)
          const level3 = createMemo(() => level2() + 10)
          return (
            <div>
              <p class="result">{level3()}</p>
              <button onClick={() => setValue(value() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      // value=1, level1=2, level2=4, level3=14
      expect(container.querySelector('.result')!.textContent).toBe('14')

      click(container.querySelector('button')!)
      await waitForUpdate()
      // value=2, level1=3, level2=6, level3=16
      expect(container.querySelector('.result')!.textContent).toBe('16')

      cleanup()
    })
  })

  // EXPR-001: Number signal extracted
  it('EXPR-001: extracts number signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('1')

    cleanup()
  })

  // EXPR-002: Boolean signal
  it('EXPR-002: extracts boolean signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [on, setOn] = createSignal(false)
        return (
          <div>
            <p>{on() ? 'On' : 'Off'}</p>
            <button onClick={() => setOn(true)}>Turn On</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Off')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('On')

    cleanup()
  })

  // EXPR-003: String signal
  it('EXPR-003: extracts string signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hi')
        return (
          <div>
            <p>{text()}</p>
            <button onClick={() => setText('hello')}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('hi')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('hello')

    cleanup()
  })

  // EXPR-004: Multiple signals
  it('EXPR-004: extracts multiple signals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [a, setA] = createSignal(0)
        const [b, setB] = createSignal(1)
        return (
          <div>
            <p class="a">{a()}</p>
            <p class="b">{b()}</p>
            <button class="inc-a" onClick={() => setA(a() + 1)}>Inc A</button>
            <button class="inc-b" onClick={() => setB(b() + 1)}>Inc B</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.a')!.textContent).toBe('0')
    expect(container.querySelector('.b')!.textContent).toBe('1')

    click(container.querySelector('.inc-a')!)
    await waitForUpdate()
    expect(container.querySelector('.a')!.textContent).toBe('1')

    click(container.querySelector('.inc-b')!)
    await waitForUpdate()
    expect(container.querySelector('.b')!.textContent).toBe('2')

    cleanup()
  })

  // EXPR-005: Object signal
  it('EXPR-005: extracts object signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [user, setUser] = createSignal({ name: 'Alice' })
        return (
          <div>
            <p>{user().name}</p>
            <button onClick={() => setUser({ name: 'Bob' })}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Alice')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Bob')

    cleanup()
  })

  // EXPR-006: Array signal
  it('EXPR-006: extracts array signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([])
        return (
          <div>
            <p>{items().length}</p>
            <button onClick={() => setItems([...items(), 'x'])}>Add</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('1')

    cleanup()
  })

  // EXPR-010: Memo extracted
  it('EXPR-010: extracts memo', async () => {
    const source = `
      "use client"
      import { createSignal, createMemo } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(2)
        const doubled = createMemo(() => count() * 2)
        return (
          <div>
            <p>{doubled()}</p>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('4')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('6')

    cleanup()
  })

  // EXPR-020: Signal in text
  it('EXPR-020: handles signal in text content', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(1)}>Set</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('1')

    cleanup()
  })

  // EXPR-021: Multiple deps
  it('EXPR-021: handles multiple dependencies', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [a, setA] = createSignal(1)
        const [b, setB] = createSignal(2)
        return (
          <div>
            <p>{a() + b()}</p>
            <button onClick={() => setA(a() + 1)}>Inc A</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('3')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('4')

    cleanup()
  })

  // EXPR-022: Ternary in text
  it('EXPR-022: handles ternary in text', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            <p>{show() ? 'A' : 'B'}</p>
            <button onClick={() => setShow(true)}>Show A</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('B')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('A')

    cleanup()
  })

  // EXPR-023: Text + dynamic
  it('EXPR-023: handles text with dynamic content', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>Count: {count()}</p>
            <button onClick={() => setCount(5)}>Set 5</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Count: 0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Count: 5')

    cleanup()
  })

  // EXPR-024: Memo call
  it('EXPR-024: handles memo call in text', async () => {
    const source = `
      "use client"
      import { createSignal, createMemo } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(1)
        const doubled = createMemo(() => count() * 2)
        return (
          <div>
            <p>{doubled()}</p>
            <button onClick={() => setCount(2)}>Double</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('2')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('4')

    cleanup()
  })

  // EXPR-025: Prop becomes getter
  it('EXPR-025: prop becomes getter function', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [value, setValue] = createSignal(10)
        return (
          <div>
            <p>{value()}</p>
            <button onClick={() => setValue(20)}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('10')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('20')

    cleanup()
  })

  // EXPR-026: Children always dynamic
  it('EXPR-026: children are dynamic', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('Hello')
        return (
          <div>
            <div class="card">{text()}</div>
            <button onClick={() => setText('World')}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.card')!.textContent).toBe('Hello')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.card')!.textContent).toBe('World')

    cleanup()
  })

  // EXPR-030: Module const extracted
  it('EXPR-030: extracts module const', async () => {
    const source = `
      "use client"
      const X = 5
      function Component() {
        return <p>{X}</p>
      }
    `
    const result = await compile(source)
    // Module const is used in component
    expect(result.html).toBeTruthy()
  })

  // EXPR-031: Module fn extracted
  it('EXPR-031: extracts module function', async () => {
    const source = `
      "use client"
      function fmt(x) { return 'Value: ' + x }
      import { createSignal } from 'barefoot'
      function Component() {
        const [v, setV] = createSignal(10)
        return (
          <div>
            <p>{fmt(v())}</p>
            <button onClick={() => setV(20)}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Value: 10')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Value: 20')

    cleanup()
  })

  // EXPR-032: Local var included
  it('EXPR-032: includes local variable', async () => {
    const source = `
      "use client"
      function Component() {
        const x = 1
        return <p>{x}</p>
      }
    `
    const result = await compile(source)
    // Local variable is used in component
    expect(result.html).toBeTruthy()
  })

  // EXPR-033: Local fn included
  it('EXPR-033: includes local function', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const fn = (x) => x * 2
        const [val, setVal] = createSignal(3)
        return (
          <div>
            <p>{fn(val())}</p>
            <button onClick={() => setVal(5)}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('6')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('10')

    cleanup()
  })

  // EXPR-034: Const in child props
  it('EXPR-034: handles const in child props', async () => {
    const source = `
      "use client"
      const X = 5
      function Component() {
        return <div data-value={X}>{X}</div>
      }
    `
    const result = await compile(source)
    // Module const is used in component
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })
})
