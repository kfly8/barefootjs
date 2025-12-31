/**
 * createPortal Test
 *
 * Tests for client-side portal utility.
 * These tests verify that:
 * - Elements are mounted to the specified container
 * - Elements are properly unmounted
 * - Re-mounting replaces previous elements
 * - Multiple independent portals work correctly
 */

import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { createPortal } from '../src/portal'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('createPortal', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  test('mounts HTML to custom container', () => {
    const portal = createPortal(container)

    const element = portal.mount('<div class="modal">Hello</div>')

    expect(container.children.length).toBe(1)
    expect(container.children[0]).toBe(element)
    expect(element.className).toBe('modal')
    expect(element.textContent).toBe('Hello')
  })

  test('mounts HTML to document.body by default', () => {
    const initialBodyChildren = document.body.children.length
    const portal = createPortal()

    portal.mount('<div class="modal">Default Body</div>')

    expect(document.body.children.length).toBe(initialBodyChildren + 1)
    const lastChild = document.body.lastElementChild as HTMLElement
    expect(lastChild.className).toBe('modal')
    expect(lastChild.textContent).toBe('Default Body')

    // Cleanup
    portal.unmount()
  })

  test('returns the mounted element', () => {
    const portal = createPortal(container)

    const element = portal.mount('<span id="test">Test</span>')

    expect(element.tagName.toLowerCase()).toBe('span')
    expect(element.id).toBe('test')
    expect(element.textContent).toBe('Test')
  })

  test('unmounts the element', () => {
    const portal = createPortal(container)

    portal.mount('<div class="modal">To be removed</div>')
    expect(container.children.length).toBe(1)

    portal.unmount()
    expect(container.children.length).toBe(0)
  })

  test('unmount is idempotent (safe to call multiple times)', () => {
    const portal = createPortal(container)

    portal.mount('<div>Content</div>')
    portal.unmount()
    portal.unmount()
    portal.unmount()

    expect(container.children.length).toBe(0)
  })

  test('re-mounting replaces previous element', () => {
    const portal = createPortal(container)

    portal.mount('<div class="first">First</div>')
    expect(container.children.length).toBe(1)
    expect((container.children[0] as HTMLElement).className).toBe('first')

    portal.mount('<div class="second">Second</div>')
    expect(container.children.length).toBe(1)
    expect((container.children[0] as HTMLElement).className).toBe('second')
  })

  test('throws error for empty HTML', () => {
    const portal = createPortal(container)

    expect(() => portal.mount('')).toThrow('createPortal: Invalid HTML provided')
  })

  test('throws error for whitespace-only HTML', () => {
    const portal = createPortal(container)

    expect(() => portal.mount('   \n\t  ')).toThrow('createPortal: Invalid HTML provided')
  })

  test('multiple independent portals work correctly', () => {
    const container1 = document.createElement('div')
    const container2 = document.createElement('div')

    const portal1 = createPortal(container1)
    const portal2 = createPortal(container2)

    portal1.mount('<div>Portal 1</div>')
    portal2.mount('<div>Portal 2</div>')

    expect(container1.children.length).toBe(1)
    expect(container2.children.length).toBe(1)
    expect(container1.children[0].textContent).toBe('Portal 1')
    expect(container2.children[0].textContent).toBe('Portal 2')

    portal1.unmount()

    expect(container1.children.length).toBe(0)
    expect(container2.children.length).toBe(1)
  })

  test('mounts complex nested HTML', () => {
    const portal = createPortal(container)

    const element = portal.mount(`
      <div class="modal-overlay">
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Title</h2>
          <p>Content</p>
          <button>Close</button>
        </div>
      </div>
    `)

    expect(element.className).toBe('modal-overlay')
    expect(element.querySelector('.modal')).not.toBeNull()
    expect(element.querySelector('h2')?.textContent).toBe('Title')
    expect(element.querySelector('p')?.textContent).toBe('Content')
    expect(element.querySelector('button')?.textContent).toBe('Close')
  })

  test('preserves element attributes', () => {
    const portal = createPortal(container)

    const element = portal.mount(
      '<div id="my-modal" class="modal active" data-testid="modal" aria-hidden="false"></div>'
    )

    expect(element.id).toBe('my-modal')
    expect(element.className).toBe('modal active')
    expect(element.dataset.testid).toBe('modal')
    expect(element.getAttribute('aria-hidden')).toBe('false')
  })
})
