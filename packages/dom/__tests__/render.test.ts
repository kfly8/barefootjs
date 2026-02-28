import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { render } from '../src/render'
import { createComponent } from '../src/component'
import type { ComponentDef } from '../src/types'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('render', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('renders component into container', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const initialized: Element[] = []
    const def: ComponentDef = {
      init: (scope) => { initialized.push(scope) },
      template: (props) => `<div class="counter">${props.count ?? 0}</div>`
    }

    render(container, def, { count: 42 })

    expect(container.children.length).toBe(1)
    expect(container.firstElementChild?.textContent).toBe('42')
    expect(container.firstElementChild?.className).toBe('counter')
    expect(initialized.length).toBe(1)
  })

  test('clears existing content', () => {
    const container = document.createElement('div')
    container.innerHTML = '<p>old content</p>'
    document.body.appendChild(container)

    const def: ComponentDef = {
      init: () => {},
      template: () => `<div>new content</div>`
    }

    render(container, def)

    expect(container.children.length).toBe(1)
    expect(container.firstElementChild?.textContent).toBe('new content')
  })

  test('sets bf-s scope attribute', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const def: ComponentDef = {
      init: () => {},
      template: () => `<div>content</div>`
    }

    render(container, def)

    expect(container.firstElementChild?.hasAttribute('bf-s')).toBe(true)
  })

  test('throws without template', () => {
    const container = document.createElement('div')
    const def: ComponentDef = {
      init: () => {}
    }

    expect(() => render(container, def)).toThrow('template')
  })

  test('passes props to init', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const receivedProps: Record<string, unknown>[] = []
    const def: ComponentDef = {
      init: (_scope, props) => { receivedProps.push(props) },
      template: () => `<div>content</div>`
    }

    render(container, def, { foo: 'bar' })

    expect(receivedProps.length).toBe(1)
    expect(receivedProps[0]).toEqual({ foo: 'bar' })
  })
})

describe('createComponent with ComponentDef', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('creates element from ComponentDef', () => {
    const initialized: Element[] = []
    const def: ComponentDef = {
      init: (scope) => { initialized.push(scope) },
      template: (props) => `<li>${props.text}</li>`
    }

    const el = createComponent(def, { text: 'hello' })

    expect(el.tagName.toLowerCase()).toBe('li')
    expect(el.textContent).toBe('hello')
    expect(el.hasAttribute('bf-s')).toBe(true)
    expect(initialized.length).toBe(1)
  })

  test('sets data-key when provided', () => {
    const def: ComponentDef = {
      init: () => {},
      template: () => `<li>item</li>`
    }

    const el = createComponent(def, {}, 'key-1')

    expect(el.getAttribute('data-key')).toBe('key-1')
  })
})
