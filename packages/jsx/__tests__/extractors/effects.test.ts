/**
 * Tests for effects extractor
 */

import { describe, it, expect } from 'bun:test'
import { extractEffects } from '../../src/extractors/effects'

describe('extractEffects', () => {
  it('extracts simple createEffect', () => {
    const source = `
      function Component() {
        createEffect(() => {
          console.log('effect ran')
        })
        return <div>Hello</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain('createEffect')
    expect(effects[0].code).toContain("console.log('effect ran')")
  })

  it('extracts effect with signal dependency', () => {
    const source = `
      function Component() {
        const [count, setCount] = createSignal(0)
        createEffect(() => {
          localStorage.setItem('count', String(count()))
        })
        return <div>{count()}</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain('localStorage.setItem')
  })

  it('extracts effects inside nested functions (event handlers)', () => {
    const source = `
      function Component() {
        const handleClick = () => {
          createEffect(() => {
            console.log('nested effect')
          })
        }
        return <button onClick={handleClick}>Click</button>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    // User requested that nested effects should also be extracted
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain("console.log('nested effect')")
  })

  it('extracts multiple effects', () => {
    const source = `
      function Component() {
        createEffect(() => console.log('a'))
        createEffect(() => console.log('b'))
        return <div>Hello</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(2)
    expect(effects[0].code).toContain("'a'")
    expect(effects[1].code).toContain("'b'")
  })

  it('targets specific component', () => {
    const source = `
      function ComponentA() {
        createEffect(() => console.log('A'))
        return <div>A</div>
      }
      function ComponentB() {
        createEffect(() => console.log('B'))
        return <div>B</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx', 'ComponentB')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain("'B'")
  })

  it('extracts effect with onCleanup', () => {
    const source = `
      function Component() {
        createEffect(() => {
          const interval = setInterval(() => {}, 1000)
          onCleanup(() => clearInterval(interval))
        })
        return <div>Timer</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain('onCleanup')
    expect(effects[0].code).toContain('clearInterval')
  })

  it('returns empty array for component without effects', () => {
    const source = `
      function Component() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(0)
  })

  it('does not extract createEffect from non-PascalCase functions', () => {
    const source = `
      function helper() {
        createEffect(() => console.log('helper'))
      }
      function Component() {
        return <div>Hello</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(0)
  })

  it('extracts effect that reads from localStorage', () => {
    const source = `
      function ThemeSwitcher() {
        const [theme, setTheme] = createSignal('light')
        createEffect(() => {
          const stored = localStorage.getItem('theme')
          if (stored) {
            setTheme(stored)
          }
        })
        return <button>Toggle</button>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain("localStorage.getItem('theme')")
    expect(effects[0].code).toContain('setTheme(stored)')
  })

  it('strips TypeScript type assertions', () => {
    const source = `
      function ThemeSwitcher() {
        const [theme, setTheme] = createSignal('system')
        createEffect(() => {
          const stored = localStorage.getItem('theme') as string | null
          if (stored) {
            setTheme(stored)
          }
        })
        return <button>{theme()}</button>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain('localStorage.getItem')
    expect(effects[0].code).not.toContain('as string')  // TypeScript stripped
    expect(effects[0].code).not.toContain('as string | null')
  })

  it('strips generic type parameters from createEffect', () => {
    const source = `
      function Component() {
        createEffect(() => {
          const data = JSON.parse('{}') as { name: string }
          console.log(data.name)
        })
        return <div>Hello</div>
      }
    `
    const effects = extractEffects(source, '/test.tsx')
    expect(effects).toHaveLength(1)
    expect(effects[0].code).toContain('JSON.parse')
    expect(effects[0].code).not.toContain('as {')
    expect(effects[0].code).not.toContain(': string')
  })
})
