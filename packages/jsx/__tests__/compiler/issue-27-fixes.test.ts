/**
 * Issue #27 Fixes Tests
 *
 * ## Overview
 * Tests for compiler bugs fixed in Issue #27:
 * 1. JSX boolean shorthand (`<Checkbox checked />`) was dropping the prop
 * 2. HTML attributes with JSX expressions were rendered as literal strings
 * 3. Child component props were not reactive
 *
 * @see https://github.com/kfly8/barefootjs/issues/27
 */

import { describe, it, expect } from 'bun:test'
import { compile, compileWithFiles } from './test-helpers'

describe('Issue #27 Fix 1: JSX Boolean Shorthand', () => {
  it('boolean shorthand prop is passed as true', async () => {
    const files = {
      '/test/App.tsx': `
        import Checkbox from './Checkbox'
        function App() {
          return <Checkbox checked />
        }
      `,
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return <button aria-checked={checked} disabled={disabled}>Check</button>
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Boolean shorthand should be passed as true
    expect(app!.clientJs).toContain('checked: true')
  })

  it('multiple boolean shorthand props work together', async () => {
    const files = {
      '/test/App.tsx': `
        import Checkbox from './Checkbox'
        function App() {
          return <Checkbox checked disabled />
        }
      `,
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return <button aria-checked={checked} disabled={disabled}>Check</button>
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Both boolean shorthands should be passed as true
    expect(app!.clientJs).toContain('checked: true')
    expect(app!.clientJs).toContain('disabled: true')
  })

  it('boolean shorthand works with other props', async () => {
    const files = {
      '/test/App.tsx': `
        import Input from './Input'
        function App() {
          return <Input disabled placeholder="Enter text" />
        }
      `,
      '/test/Input.tsx': `
        function Input({ disabled, placeholder }) {
          return <input disabled={disabled} placeholder={placeholder} />
        }
        export default Input
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Boolean shorthand and string prop should both be passed
    expect(app!.clientJs).toContain('disabled: true')
    expect(app!.clientJs).toContain('placeholder: "Enter text"')
  })
})

describe('Issue #27 Fix 2: HTML Attribute JSX Expressions', () => {
  it('variable in type attribute is dynamic, not literal string', async () => {
    const source = `
      function Component() {
        const inputType = 'password'
        return <input type={inputType} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // type={inputType} should be dynamic, not literal "inputType"
    expect(file.clientJs).toContain('inputType')
    expect(file.clientJs).not.toContain('type="inputType"')
  })

  it('expression in placeholder attribute is dynamic', async () => {
    const source = `
      function Component() {
        const placeholder = 'Enter your name'
        return <input placeholder={placeholder} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // placeholder={placeholder} should reference the variable
    expect(file.clientJs).toContain('placeholder')
  })

  it('all JSX expression attributes are treated as dynamic', async () => {
    const source = `
      function Component() {
        const name = 'username'
        const id = 'user-input'
        const title = 'Enter username'
        return <input name={name} id={id} title={title} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // All should be dynamic, not literal strings
    expect(file.clientJs).toContain('createEffect')
  })
})

describe('Issue #27 Fix 3: Child Component Reactive Props', () => {
  it('dynamic props are wrapped in getter functions', async () => {
    const files = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Checkbox from './Checkbox'
        function App() {
          const [checked, setChecked] = createSignal(false)
          return <Checkbox checked={checked()} onCheckedChange={setChecked} />
        }
      `,
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, onCheckedChange }) {
          return <button aria-checked={checked} onClick={() => onCheckedChange(!checked)}>Check</button>
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Dynamic prop should be wrapped in getter function
    expect(app!.clientJs).toContain('checked: () => checked()')
  })

  it('callback props (on*) are not wrapped in getters', async () => {
    const files = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Checkbox from './Checkbox'
        function App() {
          const [checked, setChecked] = createSignal(false)
          return <Checkbox checked={checked()} onCheckedChange={setChecked} />
        }
      `,
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, onCheckedChange }) {
          return <button aria-checked={checked} onClick={() => onCheckedChange(!checked)}>Check</button>
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Callback prop should not be wrapped
    expect(app!.clientJs).toContain('onCheckedChange: setChecked')
    expect(app!.clientJs).not.toContain('onCheckedChange: () =>')
  })

  it('child component unwraps getter props', async () => {
    const files = {
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return (
            <button
              aria-checked={checked}
              disabled={disabled}
              class={checked ? 'checked' : 'unchecked'}
            >
              Check
            </button>
          )
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/Checkbox.tsx', files)
    const checkbox = result.files.find(f => f.componentNames.includes('Checkbox'))

    // Props should be unwrapped to getters
    expect(checkbox!.clientJs).toContain('checked: __raw_checked')
    expect(checkbox!.clientJs).toContain('disabled: __raw_disabled')
    expect(checkbox!.clientJs).toContain("typeof __raw_checked === 'function' ? __raw_checked : () => __raw_checked")
    expect(checkbox!.clientJs).toContain("typeof __raw_disabled === 'function' ? __raw_disabled : () => __raw_disabled")
  })

  it('prop usages are replaced with getter calls', async () => {
    const files = {
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return (
            <button
              aria-checked={checked}
              disabled={disabled}
              class={checked ? 'checked' : 'unchecked'}
            >
              Check
            </button>
          )
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/Checkbox.tsx', files)
    const checkbox = result.files.find(f => f.componentNames.includes('Checkbox'))

    // Prop usages should be replaced with getter calls
    expect(checkbox!.clientJs).toContain('checked()')
    expect(checkbox!.clientJs).toContain('disabled()')
  })

  it('CSS pseudo-classes are not affected by prop replacement', async () => {
    const files = {
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return (
            <button
              aria-checked={checked}
              disabled={disabled}
              class={\`peer disabled:cursor-not-allowed disabled:opacity-50 \${checked ? 'bg-black' : 'bg-white'}\`}
            >
              Check
            </button>
          )
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/Checkbox.tsx', files)
    const checkbox = result.files.find(f => f.componentNames.includes('Checkbox'))

    // CSS pseudo-class "disabled:" should not be replaced with "disabled():"
    expect(checkbox!.clientJs).toContain('disabled:cursor-not-allowed')
    expect(checkbox!.clientJs).toContain('disabled:opacity-50')
    expect(checkbox!.clientJs).not.toContain('disabled():cursor-not-allowed')
  })

  it('HTML attribute names are not affected by prop replacement', async () => {
    const files = {
      '/test/Checkbox.tsx': `
        function Checkbox({ checked }) {
          return (
            <button aria-checked={checked}>
              Check
            </button>
          )
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/Checkbox.tsx', files)
    const checkbox = result.files.find(f => f.componentNames.includes('Checkbox'))

    // "aria-checked" should remain as is (hyphenated attribute name)
    expect(checkbox!.clientJs).toContain('aria-checked')
    expect(checkbox!.clientJs).not.toContain('aria-checked()')
  })

  it('static props are not wrapped in getters', async () => {
    const files = {
      '/test/App.tsx': `
        import Checkbox from './Checkbox'
        function App() {
          return <Checkbox checked={true} disabled={false} />
        }
      `,
      '/test/Checkbox.tsx': `
        function Checkbox({ checked, disabled }) {
          return <button aria-checked={checked} disabled={disabled}>Check</button>
        }
        export default Checkbox
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Static props should not be wrapped in getters
    expect(app!.clientJs).toContain('checked: true')
    expect(app!.clientJs).toContain('disabled: false')
    expect(app!.clientJs).not.toContain('checked: () => true')
    expect(app!.clientJs).not.toContain('disabled: () => false')
  })
})
