import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { insert } from '../src/insert'
import { createSignal } from '../src/reactive'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('insert', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('does not modify DOM on first run when condition is true', () => {
    document.body.innerHTML = `
      <div bf-s="Test_1">
        <span bf-c="c1">Initial</span>
      </div>
    `
    const scope = document.querySelector('[bf-s]')!
    const [show] = createSignal(true)

    insert(
      scope,
      'c1',
      show,
      { template: () => '<span bf-c="c1">Visible</span>', bindEvents: () => {} },
      { template: () => '<span bf-c="c1">Hidden</span>', bindEvents: () => {} }
    )

    // First run should not change DOM (same tag match)
    expect(scope.querySelector('[bf-c]')?.textContent).toBe('Initial')
  })

  test('switches templates when condition changes', () => {
    document.body.innerHTML = `
      <div bf-s="Test_1">
        <span bf-c="c1">Initial</span>
      </div>
    `
    const scope = document.querySelector('[bf-s]')!
    const [show, setShow] = createSignal(true)

    insert(
      scope,
      'c1',
      show,
      { template: () => '<span bf-c="c1">Visible</span>', bindEvents: () => {} },
      { template: () => '<span bf-c="c1">Hidden</span>', bindEvents: () => {} }
    )

    // Toggle to false
    setShow(false)
    expect(scope.querySelector('[bf-c]')?.textContent).toBe('Hidden')

    // Toggle back to true
    setShow(true)
    expect(scope.querySelector('[bf-c]')?.textContent).toBe('Visible')
  })

  test('handles null scope gracefully', () => {
    const [show] = createSignal(true)
    // Should not throw
    insert(
      null,
      'c1',
      show,
      { template: () => '<span>True</span>', bindEvents: () => {} },
      { template: () => '<span>False</span>', bindEvents: () => {} }
    )
  })

  test('calls bindEvents on first run', () => {
    document.body.innerHTML = `
      <div bf-s="Test_1">
        <button bf-c="c1" bf="btn">Click me</button>
      </div>
    `
    const scope = document.querySelector('[bf-s]')!
    const [show] = createSignal(true)
    const boundScopes: Element[] = []

    insert(
      scope,
      'c1',
      show,
      { template: () => '<button bf-c="c1" bf="btn">Show</button>', bindEvents: (s) => boundScopes.push(s) },
      { template: () => '<button bf-c="c1" bf="btn">Hide</button>', bindEvents: () => {} }
    )

    expect(boundScopes.length).toBe(1)
    expect(boundScopes[0]).toBe(scope)
  })

  test('calls bindEvents on condition change', () => {
    document.body.innerHTML = `
      <div bf-s="Test_1">
        <button bf-c="c1">Click me</button>
      </div>
    `
    const scope = document.querySelector('[bf-s]')!
    const [show, setShow] = createSignal(true)
    const trueBound: Element[] = []
    const falseBound: Element[] = []

    insert(
      scope,
      'c1',
      show,
      { template: () => '<button bf-c="c1">Show</button>', bindEvents: (s) => trueBound.push(s) },
      { template: () => '<button bf-c="c1">Hide</button>', bindEvents: (s) => falseBound.push(s) }
    )

    expect(trueBound.length).toBe(1)
    expect(falseBound.length).toBe(0)

    setShow(false)
    expect(falseBound.length).toBe(1)

    setShow(true)
    expect(trueBound.length).toBe(2)
  })
})
