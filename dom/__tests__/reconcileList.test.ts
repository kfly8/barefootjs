/**
 * reconcileList Test
 *
 * Tests for efficient key-based list reconciliation.
 * These tests verify that:
 * - Existing DOM elements are reused when keys match
 * - New elements are created for new keys
 * - Elements are removed when keys are no longer present
 * - Elements are reordered correctly
 */

import { describe, test, expect, beforeAll } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { reconcileList } from '../reactive'

beforeAll(() => {
  GlobalRegistrator.register()
})

describe('reconcileList', () => {
  test('initial render creates all elements', () => {
    const container = document.createElement('ul')
    const items = [
      { id: 1, text: 'Apple' },
      { id: 2, text: 'Banana' },
      { id: 3, text: 'Cherry' },
    ]

    reconcileList(
      container,
      items,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(3)
    expect(container.children[0].textContent).toBe('Apple')
    expect(container.children[1].textContent).toBe('Banana')
    expect(container.children[2].textContent).toBe('Cherry')
  })

  test('reuses existing elements when content is unchanged', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [{ id: 1, text: 'Apple' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    const firstElement = container.children[0]
    // Add custom property to track element identity
    ;(firstElement as any).__testId = 'original'

    // Update with same key AND same content
    const items2 = [{ id: 1, text: 'Apple' }]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Same element should be reused when content is unchanged
    expect(container.children.length).toBe(1)
    expect((container.children[0] as any).__testId).toBe('original')
    expect(container.children[0].textContent).toBe('Apple')
  })

  test('replaces existing elements when content changes', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [{ id: 1, text: 'Apple' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    const firstElement = container.children[0]
    // Add custom property to track element identity
    ;(firstElement as any).__testId = 'original'

    // Update with same key but different content
    const items2 = [{ id: 1, text: 'Apple Updated' }]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Element should be replaced when content changes
    expect(container.children.length).toBe(1)
    expect((container.children[0] as any).__testId).toBeUndefined()
    expect(container.children[0].textContent).toBe('Apple Updated')
  })

  test('creates new elements for new keys', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [{ id: 1, text: 'Apple' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Add new item
    const items2 = [
      { id: 1, text: 'Apple' },
      { id: 2, text: 'Banana' },
    ]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(2)
    expect((container.children[1] as HTMLElement).dataset.key).toBe('2')
    expect(container.children[1].textContent).toBe('Banana')
  })

  test('removes elements when keys are no longer present', () => {
    const container = document.createElement('ul')

    // Initial render with 3 items
    const items1 = [
      { id: 1, text: 'Apple' },
      { id: 2, text: 'Banana' },
      { id: 3, text: 'Cherry' },
    ]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(3)

    // Remove middle item
    const items2 = [
      { id: 1, text: 'Apple' },
      { id: 3, text: 'Cherry' },
    ]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(2)
    expect((container.children[0] as HTMLElement).dataset.key).toBe('1')
    expect((container.children[1] as HTMLElement).dataset.key).toBe('3')
  })

  test('handles reordering correctly', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [
      { id: 1, text: 'Apple' },
      { id: 2, text: 'Banana' },
      { id: 3, text: 'Cherry' },
    ]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Add identity markers
    ;(container.children[0] as any).__testId = 'first'
    ;(container.children[1] as any).__testId = 'second'
    ;(container.children[2] as any).__testId = 'third'

    // Reverse order
    const items2 = [
      { id: 3, text: 'Cherry' },
      { id: 2, text: 'Banana' },
      { id: 1, text: 'Apple' },
    ]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(3)
    // Elements should be reused and reordered
    expect((container.children[0] as any).__testId).toBe('third')
    expect((container.children[1] as any).__testId).toBe('second')
    expect((container.children[2] as any).__testId).toBe('first')
  })

  test('handles empty list', () => {
    const container = document.createElement('ul')

    // Initial render with items
    const items1 = [{ id: 1, text: 'Apple' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(1)

    // Clear all items
    reconcileList(
      container,
      [],
      (item: { id: number; text: string }) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(0)
  })

  test('handles string keys', () => {
    const container = document.createElement('ul')
    const items = [
      { id: 'apple', text: 'Apple' },
      { id: 'banana', text: 'Banana' },
    ]

    reconcileList(
      container,
      items,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    expect(container.children.length).toBe(2)
    expect((container.children[0] as HTMLElement).dataset.key).toBe('apple')
    expect((container.children[1] as HTMLElement).dataset.key).toBe('banana')
  })

  test('preserves numeric key types and updates content', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [{ id: 123, text: 'Item 123' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    ;(container.children[0] as any).__testId = 'original'

    // Update with same numeric key but different content
    const items2 = [{ id: 123, text: 'Item 123 Updated' }]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Element should be replaced when content changes
    // (numeric key lookup still works - dataset stores as string but we convert back)
    expect(container.children.length).toBe(1)
    expect(container.children[0].textContent).toBe('Item 123 Updated')
  })

  test('preserves numeric key types and reuses unchanged elements', () => {
    const container = document.createElement('ul')

    // Initial render
    const items1 = [{ id: 123, text: 'Item 123' }]
    reconcileList(
      container,
      items1,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    ;(container.children[0] as any).__testId = 'original'

    // Update with same numeric key AND same content
    const items2 = [{ id: 123, text: 'Item 123' }]
    reconcileList(
      container,
      items2,
      (item) => `<li data-key="${item.id}">${item.text}</li>`,
      (item) => item.id
    )

    // Should reuse element when content is unchanged
    expect((container.children[0] as any).__testId).toBe('original')
  })

  test('event delegation works after element replacement', () => {
    const container = document.createElement('ul')
    const clickedItems: number[] = []

    // Set up event delegation on container (like BarefootJS does)
    container.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-event-id="0"]')
      if (target) {
        const index = parseInt((target as HTMLElement).dataset.index || '0', 10)
        clickedItems.push(index)
      }
    })

    // Initial render with event attributes
    const items1 = [
      { id: 1, text: 'Apple', done: false },
      { id: 2, text: 'Banana', done: false },
    ]
    reconcileList(
      container,
      items1,
      (item, index) => `<li data-key="${item.id}"><button data-index="${index}" data-event-id="0">${item.done ? 'Undo' : 'Done'}</button></li>`,
      (item) => item.id
    )

    // Click first button
    const button1 = container.querySelector('[data-event-id="0"]') as HTMLElement
    button1.click()
    expect(clickedItems).toEqual([0])

    // Update first item (content changes, element should be replaced)
    const items2 = [
      { id: 1, text: 'Apple', done: true },
      { id: 2, text: 'Banana', done: false },
    ]
    reconcileList(
      container,
      items2,
      (item, index) => `<li data-key="${item.id}"><button data-index="${index}" data-event-id="0">${item.done ? 'Undo' : 'Done'}</button></li>`,
      (item) => item.id
    )

    // Click replaced button - event delegation should still work
    const newButton1 = container.querySelector('[data-event-id="0"]') as HTMLElement
    newButton1.click()
    expect(clickedItems).toEqual([0, 0])

    // Click second button
    const button2 = container.querySelectorAll('[data-event-id="0"]')[1] as HTMLElement
    button2.click()
    expect(clickedItems).toEqual([0, 0, 1])
  })
})
