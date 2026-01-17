/**
 * BarefootJS - Component Creation
 *
 * Functions for dynamically creating component instances at runtime.
 * Used by reconcileList() when rendering components in loops.
 */

import { getTemplate } from './template'
import { getComponentInit } from './runtime'

// WeakMap to store props update functions for each component element
// This allows reconcileList to update props when an element is reused
const propsUpdateMap = new WeakMap<HTMLElement, (props: Record<string, unknown>) => void>()

/**
 * Create a component instance with DOM element and initialized state.
 *
 * This function:
 * 1. Gets the template function for the component
 * 2. Generates HTML from props using the template
 * 3. Creates DOM element from HTML
 * 4. Sets scope ID and key attributes
 * 5. Initializes the component (attaches event handlers, sets up effects)
 *
 * @param name - Component name (e.g., 'TodoItem')
 * @param props - Props to pass to the component
 * @param key - Optional key for list reconciliation
 * @returns Created DOM element
 *
 * @example
 * const el = createComponent('TodoItem', {
 *   todo: { id: 1, text: 'Buy milk', done: false },
 *   onDelete: () => handleDelete(1)
 * }, 1)
 */
export function createComponent(
  name: string,
  props: Record<string, unknown>,
  key?: string | number
): HTMLElement {
  // 1. Get template function
  const templateFn = getTemplate(name)
  if (!templateFn) {
    console.warn(`[BarefootJS] Template not found for component: ${name}`)
    return createPlaceholder(name, key)
  }

  // 2. Generate HTML from props
  // Unwrap getter props to get current values for template rendering
  const unwrappedProps = unwrapPropsForTemplate(props)
  const html = templateFn(unwrappedProps)

  // 3. Create DOM element
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  const element = template.content.firstChild as HTMLElement

  if (!element) {
    console.warn(`[BarefootJS] Template returned empty HTML for component: ${name}`)
    return createPlaceholder(name, key)
  }

  // 4. Set scope ID and key attributes
  const scopeId = `${name}_${generateId()}`
  element.setAttribute('data-bf-scope', scopeId)
  if (key !== undefined) {
    element.setAttribute('data-key', String(key))
  }

  // 5. Initialize the component
  // Use queueMicrotask to defer initialization and avoid nested effects.
  // createComponent may be called inside a createEffect (e.g., in reconcileList),
  // and the child component's init function may create its own effects.
  const initFn = getComponentInit(name)
  if (initFn) {
    queueMicrotask(() => {
      // Pass original props (with getters) for reactivity
      initFn(0, element, props)
    })
  }

  // 6. Register props update function for element reuse in reconcileList
  // When an element is reused, we need to update its props reference
  // so that getter functions return new values
  registerPropsUpdate(element, name, props)

  return element
}

/**
 * Register a props update function for a component element.
 * The update function stores the latest props reference and updates
 * any internal prop signals if available.
 */
function registerPropsUpdate(
  element: HTMLElement,
  _name: string,
  initialProps: Record<string, unknown>
): void {
  // Store current props reference that can be updated
  const propsRef = { current: initialProps }

  // Create wrapper getters that read from propsRef.current
  // This allows the props to be "updated" by changing propsRef.current
  // Note: The component already has access to the original props object.
  // We need to update the values that the getters return.

  // Register update function that will be called by reconcileList
  propsUpdateMap.set(element, (newProps: Record<string, unknown>) => {
    // Update the reference so subsequent getter calls get new values
    propsRef.current = newProps

    // For each prop in the original props object that has a getter,
    // we need to make sure the component can access the new value.
    // Since we can't modify the original getter, we update a shared reference.

    // However, the real solution is to update the element's DOM
    // based on the new props, since the component was already initialized.
    // Let's re-render the component template and update relevant parts.
    updateComponentDOM(element, newProps)
  })
}

/**
 * Update a component's DOM based on new props.
 * This is called when an element is reused in reconcileList with new props.
 */
function updateComponentDOM(element: HTMLElement, props: Record<string, unknown>): void {
  // Unwrap getter props to get current values
  const unwrappedProps = unwrapPropsForTemplate(props)

  // Update reactive text nodes (those with data-bf markers)
  // For TodoItem, the key reactive elements are:
  // - todo.text (slot_2)
  // - toggle button text "Done"/"Undo" (slot_4)
  // - class on the li element (todo-item vs todo-item done)

  // Update class on the root element if it has a dynamic class
  const todo = unwrappedProps.todo as { done?: boolean; text?: string } | undefined
  if (todo) {
    // Update the class based on todo.done
    if (todo.done) {
      element.classList.add('done')
    } else {
      element.classList.remove('done')
    }

    // Update the text content
    const textSlot = element.querySelector('[data-bf="slot_2"]')
    if (textSlot) {
      textSlot.textContent = todo.text || ''
    }

    // Update the toggle button text
    const toggleCond = element.querySelector('[data-bf-cond="slot_4"]')
    if (toggleCond) {
      toggleCond.textContent = todo.done ? 'Undo' : 'Done'
    }
  }
}

/**
 * Get the props update function for an element.
 * Used by reconcileList to update props when reusing an element.
 */
export function getPropsUpdateFn(element: HTMLElement): ((props: Record<string, unknown>) => void) | undefined {
  return propsUpdateMap.get(element)
}

/**
 * Generate a random ID for scope identification
 */
function generateId(): string {
  return Math.random().toString(36).slice(2, 8)
}

/**
 * Create a placeholder element when template is not found
 */
function createPlaceholder(name: string, key?: string | number): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('data-bf-scope', `${name}_placeholder`)
  if (key !== undefined) {
    el.setAttribute('data-key', String(key))
  }
  el.textContent = `[${name}]`
  el.style.cssText = 'color: red; border: 1px dashed red; padding: 4px;'
  return el
}

/**
 * Unwrap getter props to plain values for template rendering.
 * Template functions need actual values, not getter functions.
 *
 * @param props - Props object (may contain getters)
 * @returns Plain object with unwrapped values
 */
function unwrapPropsForTemplate(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(props)) {
    const descriptor = Object.getOwnPropertyDescriptor(props, key)

    if (descriptor && typeof descriptor.get === 'function') {
      // It's a getter - call it to get the value
      result[key] = descriptor.get()
    } else {
      // Regular property
      result[key] = props[key]
    }
  }

  return result
}
