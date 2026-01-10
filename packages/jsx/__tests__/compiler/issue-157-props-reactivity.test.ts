/**
 * Issue #157: Props should not be forcibly made reactive
 *
 * This test verifies that:
 * 1. Props are accessed via __props.propName pattern (SolidJS style)
 * 2. Props alone don't trigger reactive wrapping (no createEffect just for prop access)
 * 3. map() with static data works correctly without JSX syntax errors
 *
 * Note: Static text content {prop} is SSR-only and doesn't generate Client JS.
 * Only dynamic attributes or expressions that need client updates generate Client JS.
 *
 * @see https://github.com/kfly8/barefootjs/issues/157
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from './test-helpers'

describe('Issue #157: Props are not forcibly made reactive', () => {
  it('props in dynamic attributes are accessed via __props.propName pattern', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function Component({ currentPath }: { currentPath: string }) {
          return <div class={currentPath}>{currentPath}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    // Should use __props.propName pattern for dynamic attributes
    expect(comp!.clientJs).toContain('__props.currentPath')
    // Should NOT use old getter pattern
    expect(comp!.clientJs).not.toContain('__raw_currentPath')
    expect(comp!.clientJs).not.toContain('currentPath()')
  })

  it('static prop in text content is SSR-only (no Client JS)', async () => {
    const files = {
      '/test/StaticText.tsx': `
        "use client"
        function StaticText({ message }: { message: string }) {
          return <div>{message}</div>
        }
        export default StaticText
      `,
    }
    const result = await compileWithFiles('/test/StaticText.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('StaticText'))

    // Static text content with props is SSR-only - no createEffect needed
    // The prop value is baked into the HTML at render time
    expect(comp!.clientJs).not.toContain('createEffect')
  })

  it('static prop reference in map callback does not create reactive wrapper', async () => {
    const files = {
      '/test/SidebarMenu.tsx': `
        "use client"
        const menuData = [
          { title: 'Home', items: [{ href: '/' }] },
          { title: 'About', items: [{ href: '/about' }] }
        ]

        function SidebarMenu({ currentPath }: { currentPath: string }) {
          return (
            <div class={currentPath}>
              {menuData.map(category => {
                const shouldOpen = category.items.some(item => item.href === currentPath)
                return <span key={category.title}>{shouldOpen ? 'open' : 'closed'}</span>
              })}
            </div>
          )
        }
        export default SidebarMenu
      `,
    }
    const result = await compileWithFiles('/test/SidebarMenu.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('SidebarMenu'))

    // The prop should be accessed via __props pattern
    expect(comp!.clientJs).toContain('__props.currentPath')

    // The map is over static data (menuData), not a signal
    // So it should NOT generate reconcileList
    expect(comp!.clientJs).not.toContain('reconcileList')
  })

  it('signal-based map still creates reactive wrapper', async () => {
    const files = {
      '/test/TodoList.tsx': `
        "use client"
        import { createSignal } from '@barefootjs/dom'

        function TodoList() {
          const [todos, setTodos] = createSignal([
            { id: 1, text: 'Task 1' },
            { id: 2, text: 'Task 2' }
          ])

          return (
            <ul>
              {todos().map(todo => <li key={todo.id}>{todo.text}</li>)}
            </ul>
          )
        }
        export default TodoList
      `,
    }
    const result = await compileWithFiles('/test/TodoList.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('TodoList'))

    // Signal-based map should have reconcileList for dynamic updates
    expect(comp!.clientJs).toContain('reconcileList')
  })

  it('prop used in ternary expression does not force reactivity', async () => {
    const files = {
      '/test/ConditionalDisplay.tsx': `
        "use client"
        function ConditionalDisplay({ isVisible }: { isVisible: boolean }) {
          return <div class={isVisible ? 'show' : 'hide'}>Content</div>
        }
        export default ConditionalDisplay
      `,
    }
    const result = await compileWithFiles('/test/ConditionalDisplay.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('ConditionalDisplay'))

    // Should access prop via __props pattern
    expect(comp!.clientJs).toContain('__props.isVisible')
  })

  it('callback props are destructured directly from __props', async () => {
    const files = {
      '/test/ButtonWithCallback.tsx': `
        "use client"
        function ButtonWithCallback({ onClick, label }: { onClick: () => void, label: string }) {
          return <button onClick={onClick} class={label}>Click</button>
        }
        export default ButtonWithCallback
      `,
    }
    const result = await compileWithFiles('/test/ButtonWithCallback.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('ButtonWithCallback'))

    // Callback props (onClick) should be destructured from __props
    expect(comp!.clientJs).toContain('const { onClick } = __props')
    // Value props (label) should use __props.propName pattern
    expect(comp!.clientJs).toContain('__props.label')
  })

  it('multiple props work correctly together', async () => {
    const files = {
      '/test/MultiPropComponent.tsx': `
        "use client"
        function MultiPropComponent({
          title,
          count,
          isActive,
          onToggle
        }: {
          title: string
          count: number
          isActive: boolean
          onToggle: () => void
        }) {
          return (
            <div class={isActive ? 'active' : 'inactive'} data-title={title} data-count={count}>
              <h1>{title}</h1>
              <span>{count}</span>
              <button onClick={onToggle}>Toggle</button>
            </div>
          )
        }
        export default MultiPropComponent
      `,
    }
    const result = await compileWithFiles('/test/MultiPropComponent.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('MultiPropComponent'))

    // Value props in attributes should use __props pattern
    expect(comp!.clientJs).toContain('__props.isActive')

    // Callback should be destructured
    expect(comp!.clientJs).toContain('const { onToggle } = __props')
  })
})
