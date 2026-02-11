import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { findScope, find, $c, hydrate, bind, cond } from '../src/runtime'
import { createSignal } from '../src/reactive'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('findScope', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds scope by component name prefix', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_abc123">content</div>
    `
    const scope = findScope('Counter', 0, null)
    expect(scope).not.toBeNull()
    expect(scope?.getAttribute('data-bf-scope')).toBe('Counter_abc123')
    expect(scope?.hasAttribute('data-bf-init')).toBe(true)
  })

  test('returns parent if it is the scope element', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_abc123">content</div>
    `
    const parent = document.querySelector('[data-bf-scope]') as Element
    const scope = findScope('Counter', 0, parent)
    expect(scope).toBe(parent)
  })

  test('skips already initialized scopes', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_1" data-bf-init="true"></div>
      <div data-bf-scope="Counter_2"></div>
    `
    const scope = findScope('Counter', 0, null)
    expect(scope?.getAttribute('data-bf-scope')).toBe('Counter_2')
  })

  test('returns null if no matching scope found', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Other_1"></div>
    `
    const scope = findScope('Counter', 0, null)
    expect(scope).toBeNull()
  })

  test('finds scope at specific index', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_1"></div>
      <div data-bf-scope="Counter_2"></div>
      <div data-bf-scope="Counter_3"></div>
    `
    const scope = findScope('Counter', 1, null)
    expect(scope?.getAttribute('data-bf-scope')).toBe('Counter_2')
  })

  test('searches within parent element', () => {
    document.body.innerHTML = `
      <div id="parent">
        <div data-bf-scope="Counter_inside"></div>
      </div>
      <div data-bf-scope="Counter_outside"></div>
    `
    const parent = document.getElementById('parent')!
    const scope = findScope('Counter', 0, parent)
    expect(scope?.getAttribute('data-bf-scope')).toBe('Counter_inside')
  })
})

describe('find', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds element within scope', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_1">
        <button data-bf="btn1">Click</button>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope]')
    const btn = find(scope, '[data-bf="btn1"]')
    expect(btn).not.toBeNull()
    expect(btn?.textContent).toBe('Click')
  })

  test('returns scope if it matches selector', () => {
    document.body.innerHTML = `
      <button data-bf-scope="Button_1" data-bf="root">Click</button>
    `
    const scope = document.querySelector('[data-bf-scope]')
    const el = find(scope, '[data-bf="root"]')
    expect(el).toBe(scope)
  })

  test('excludes elements in nested scopes', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Parent_1">
        <div data-bf-scope="Child_1">
          <button data-bf="btn1">Nested</button>
        </div>
      </div>
    `
    const parentScope = document.querySelector('[data-bf-scope="Parent_1"]')
    const btn = find(parentScope, '[data-bf="btn1"]')
    expect(btn).toBeNull()
  })

  test('returns null for null scope', () => {
    const el = find(null, '[data-bf="btn1"]')
    expect(el).toBeNull()
  })

  test('returns null if element not found', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Counter_1"></div>
    `
    const scope = document.querySelector('[data-bf-scope]')
    const el = find(scope, '[data-bf="nonexistent"]')
    expect(el).toBeNull()
  })

  test('finds child scope element before matching scope itself', () => {
    // AccordionTrigger case: parent scope also matches the suffix selector,
    // but we want the child scope (ChevronDownIcon) returned first
    document.body.innerHTML = `
      <div data-bf-scope="AccordionTrigger_abc_s0">
        <span data-bf-scope="AccordionTrigger_abc_s0_s0">icon</span>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope="AccordionTrigger_abc_s0"]')
    const el = find(scope, '[data-bf-scope$="_s0"]')
    expect(el).not.toBeNull()
    expect(el?.textContent).toBe('icon')
  })

  test('returns scope itself when looking for scope selector and no child matches', () => {
    // ButtonDemo case: scope element IS the slot element (no children)
    document.body.innerHTML = `
      <button data-bf-scope="ButtonDemo_xyz_s1">click</button>
    `
    const scope = document.querySelector('[data-bf-scope]')
    const el = find(scope, '[data-bf-scope$="_s1"]')
    expect(el).toBe(scope)
  })

  test('prioritizes child scope over self-match for scope selectors', () => {
    // Both parent and child match the suffix selector, child should be returned
    document.body.innerHTML = `
      <div data-bf-scope="Parent_abc_s0">
        <div data-bf-scope="Parent_abc_s0_s0">child</div>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope="Parent_abc_s0"]')
    const el = find(scope, '[data-bf-scope$="_s0"]')
    expect(el?.textContent).toBe('child')
    expect(el).not.toBe(scope)
  })

  describe('with portals', () => {
    test('finds element in portal owned by scope', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Dialog_abc123">
          <button data-bf="trigger">Open</button>
        </div>
        <div data-bf-portal-owner="Dialog_abc123">
          <input data-bf="input" />
        </div>
      `
      const scope = document.querySelector('[data-bf-scope]')
      const input = find(scope, '[data-bf="input"]')
      expect(input).not.toBeNull()
      expect(input?.tagName.toLowerCase()).toBe('input')
    })

    test('prioritizes scope over portal for same selector', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Test_1">
          <span data-bf="item">Scope</span>
        </div>
        <div data-bf-portal-owner="Test_1">
          <span data-bf="item">Portal</span>
        </div>
      `
      const scope = document.querySelector('[data-bf-scope]')
      const item = find(scope, '[data-bf="item"]')
      expect(item?.textContent).toBe('Scope')
    })

    test('finds element in portal when not in scope', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Dialog_xyz">
          <button data-bf="trigger">Open</button>
        </div>
        <div data-bf-portal-owner="Dialog_xyz">
          <div class="content">
            <input data-bf="email" type="email" />
            <button data-bf="submit">Submit</button>
          </div>
        </div>
      `
      const scope = document.querySelector('[data-bf-scope]')
      const email = find(scope, '[data-bf="email"]')
      const submit = find(scope, '[data-bf="submit"]')
      expect(email).not.toBeNull()
      expect(submit).not.toBeNull()
      expect(email?.getAttribute('type')).toBe('email')
    })

    test('does not find element in portal owned by different scope', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Dialog_1">
          <button data-bf="trigger">Open</button>
        </div>
        <div data-bf-portal-owner="Dialog_2">
          <input data-bf="input" />
        </div>
      `
      const scope = document.querySelector('[data-bf-scope="Dialog_1"]')
      const input = find(scope, '[data-bf="input"]')
      expect(input).toBeNull()
    })

    test('finds multiple elements across multiple portals', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Dialog_multi">
          <button data-bf="trigger">Open</button>
        </div>
        <div data-bf-portal-owner="Dialog_multi">
          <div data-bf="overlay" class="overlay"></div>
        </div>
        <div data-bf-portal-owner="Dialog_multi">
          <div data-bf="content" class="content"></div>
        </div>
      `
      const scope = document.querySelector('[data-bf-scope]')
      const overlay = find(scope, '[data-bf="overlay"]')
      const content = find(scope, '[data-bf="content"]')
      expect(overlay).not.toBeNull()
      expect(content).not.toBeNull()
    })

    test('finds portal element itself when it matches selector', () => {
      document.body.innerHTML = `
        <div data-bf-scope="Dialog_self">
          <button data-bf="trigger">Open</button>
        </div>
        <div data-bf-portal-owner="Dialog_self" data-bf="portal-root"></div>
      `
      const scope = document.querySelector('[data-bf-scope]')
      const portalRoot = find(scope, '[data-bf="portal-root"]')
      expect(portalRoot).not.toBeNull()
      expect(portalRoot?.getAttribute('data-bf-portal-owner')).toBe('Dialog_self')
    })
  })
})

describe('$c', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('returns direct child scope only, not nested grandchild with same suffix', () => {
    // Regression: suffix match [data-bf-scope$="_s3"] was matching grandchild
    // Demo_abc_s4_s3 in addition to the intended Demo_abc_s3
    document.body.innerHTML = `
      <div data-bf-scope="Demo_abc">
        <div data-bf-scope="Demo_abc_s3">direct child</div>
        <div data-bf-scope="Demo_abc_s4">
          <div data-bf-scope="Demo_abc_s4_s3">nested grandchild</div>
        </div>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope="Demo_abc"]')!
    const result = $c(scope, 's3')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('data-bf-scope')).toBe('Demo_abc_s3')
  })

  test('finds child scope by slot ID', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Parent_xyz">
        <div data-bf-scope="Parent_xyz_s1">slot content</div>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope="Parent_xyz"]')!
    const result = $c(scope, 's1')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('data-bf-scope')).toBe('Parent_xyz_s1')
  })

  test('finds child scope by component name prefix', () => {
    document.body.innerHTML = `
      <div data-bf-scope="App_root">
        <div data-bf-scope="Counter_abc123">counter</div>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope="App_root"]')!
    const result = $c(scope, 'Counter')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('data-bf-scope')).toBe('Counter_abc123')
  })

  test('returns null for null scope', () => {
    const result = $c(null, 's0')
    expect(result).toBeNull()
  })
})

describe('hydrate', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('initializes root components with props', () => {
    const initialized: Array<{ props: Record<string, unknown>; scope: Element }> = []

    document.body.innerHTML = `
      <div data-bf-scope="Counter_abc" data-bf-props='{"count": 5}'>content</div>
    `

    hydrate('Counter', (props, idx, scope) => {
      initialized.push({ props, scope })
    })

    expect(initialized.length).toBe(1)
    expect(initialized[0].props).toEqual({ count: 5 })
    expect(initialized[0].scope.getAttribute('data-bf-scope')).toBe('Counter_abc')
  })

  test('skips nested component scopes with same component type', () => {
    const initialized: Element[] = []

    // Counter nested inside another Counter should be skipped
    // (parent component is responsible for initializing its children)
    document.body.innerHTML = `
      <div data-bf-scope="Counter_1">
        <div data-bf-scope="Counter_nested">nested</div>
      </div>
    `

    hydrate('Counter', (_, __, scope) => initialized.push(scope))

    // Only the outer Counter_1 should be initialized, not the nested one
    expect(initialized.length).toBe(1)
    expect(initialized[0].getAttribute('data-bf-scope')).toBe('Counter_1')
  })

  test('initializes nested component with different parent type', () => {
    const initialized: Element[] = []

    // Counter nested inside Parent (different type) should NOT be skipped
    // This allows e.g. ToggleItem to hydrate inside Toggle
    document.body.innerHTML = `
      <div data-bf-scope="Parent_1">
        <div data-bf-scope="Counter_nested">nested</div>
      </div>
    `

    hydrate('Counter', (_, __, scope) => initialized.push(scope))

    expect(initialized.length).toBe(1)
    expect(initialized[0].getAttribute('data-bf-scope')).toBe('Counter_nested')
  })

  test('initializes multiple instances', () => {
    const initialized: Element[] = []

    document.body.innerHTML = `
      <div data-bf-scope="Counter_1">first</div>
      <div data-bf-scope="Counter_2">second</div>
    `

    hydrate('Counter', (_, __, scope) => initialized.push(scope))

    expect(initialized.length).toBe(2)
  })

  test('handles missing props script', () => {
    const initialized: Array<{ props: Record<string, unknown> }> = []

    document.body.innerHTML = `
      <div data-bf-scope="Counter_abc">content</div>
    `

    hydrate('Counter', (props) => {
      initialized.push({ props })
    })

    expect(initialized.length).toBe(1)
    expect(initialized[0].props).toEqual({})
  })
})

describe('bind', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('attaches event listeners', () => {
    const clicks: Event[] = []
    const el = document.createElement('button')

    bind(el, {
      onClick: (e: Event) => clicks.push(e)
    })

    el.click()
    expect(clicks.length).toBe(1)
  })

  test('attaches multiple event listeners', () => {
    const events: string[] = []
    const el = document.createElement('input')

    bind(el, {
      onFocus: () => events.push('focus'),
      onBlur: () => events.push('blur')
    })

    el.dispatchEvent(new Event('focus'))
    el.dispatchEvent(new Event('blur'))
    expect(events).toEqual(['focus', 'blur'])
  })

  test('creates effects for reactive boolean props', () => {
    const el = document.createElement('input') as HTMLInputElement
    const [disabled, setDisabled] = createSignal(false)

    bind(el, {
      disabled: disabled
    })

    expect(el.disabled).toBe(false)
    setDisabled(true)
    expect(el.disabled).toBe(true)
  })

  test('creates effects for reactive attribute props', () => {
    const el = document.createElement('div')
    const [title, setTitle] = createSignal('initial')

    bind(el, {
      title: title
    })

    expect(el.getAttribute('title')).toBe('initial')
    setTitle('updated')
    expect(el.getAttribute('title')).toBe('updated')
  })

  test('removes attribute when value is null', () => {
    const el = document.createElement('div')
    const [title, setTitle] = createSignal<string | null>('initial')

    bind(el, {
      title: title
    })

    expect(el.getAttribute('title')).toBe('initial')
    setTitle(null)
    expect(el.hasAttribute('title')).toBe(false)
  })

  test('handles null element gracefully', () => {
    // Should not throw
    bind(null, { onClick: () => {} })
  })

  test('handles null props gracefully', () => {
    const el = document.createElement('button')
    // Should not throw
    bind(el, null as unknown as Record<string, unknown>)
  })
})

describe('cond', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('does not modify DOM on first run when condition is true', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Test_1">
        <span data-bf-cond="c1">Initial</span>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope]')!
    const [show] = createSignal(true)

    cond(
      scope,
      'c1',
      show,
      [() => '<span data-bf-cond="c1">Visible</span>', () => '<span data-bf-cond="c1">Hidden</span>']
    )

    // First run should not change DOM
    expect(scope.querySelector('[data-bf-cond]')?.textContent).toBe('Initial')
  })

  test('switches templates when condition changes', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Test_1">
        <span data-bf-cond="c1">Initial</span>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope]')!
    const [show, setShow] = createSignal(true)

    cond(
      scope,
      'c1',
      show,
      [() => '<span data-bf-cond="c1">Visible</span>', () => '<span data-bf-cond="c1">Hidden</span>']
    )

    // Toggle to false
    setShow(false)
    expect(scope.querySelector('[data-bf-cond]')?.textContent).toBe('Hidden')

    // Toggle back to true
    setShow(true)
    expect(scope.querySelector('[data-bf-cond]')?.textContent).toBe('Visible')
  })

  test('handles null scope gracefully', () => {
    const [show] = createSignal(true)
    // Should not throw
    cond(null, 'c1', show, [() => '<span>True</span>', () => '<span>False</span>'])
  })

  test('evaluates template functions on each condition change', () => {
    document.body.innerHTML = `
      <div data-bf-scope="Test_1">
        <span data-bf-cond="c1">0</span>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope]')!
    const [show, setShow] = createSignal(true)
    const [count, setCount] = createSignal(0)

    cond(
      scope,
      'c1',
      show,
      [() => `<span data-bf-cond="c1">Count: ${count()}</span>`, () => '<span data-bf-cond="c1">Hidden</span>']
    )

    // Increment count
    setCount(5)

    // Toggle to false and back - should show updated count
    setShow(false)
    setShow(true)
    expect(scope.querySelector('[data-bf-cond]')?.textContent).toBe('Count: 5')
  })

  test('re-attaches event handlers after DOM update', () => {
    const clicks: string[] = []
    document.body.innerHTML = `
      <div data-bf-scope="Test_1">
        <button data-bf-cond="c1" data-bf="btn">Click me</button>
      </div>
    `
    const scope = document.querySelector('[data-bf-scope]')!
    const [show, setShow] = createSignal(true)

    cond(
      scope,
      'c1',
      show,
      [() => '<button data-bf-cond="c1" data-bf="btn">Show</button>', () => '<button data-bf-cond="c1" data-bf="btn">Hide</button>'],
      [{ selector: '[data-bf="btn"]', event: 'click', handler: () => clicks.push('clicked') }]
    )

    // First run attaches handlers
    const btn1 = scope.querySelector('[data-bf="btn"]') as HTMLElement
    btn1.click()
    expect(clicks).toEqual(['clicked'])

    // Toggle condition
    setShow(false)
    const btn2 = scope.querySelector('[data-bf="btn"]') as HTMLElement
    btn2.click()
    expect(clicks).toEqual(['clicked', 'clicked'])
  })
})
