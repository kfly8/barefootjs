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

// WeakMap to store the current props for each component element
// Used to pass props to existing elements when they are reused
const propsMap = new WeakMap<HTMLElement, Record<string, unknown>>()


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

  // 5. Initialize the component synchronously
  // Event handlers need to be bound immediately so user interactions work right away.
  // Nested effects are now supported in createEffect, so we don't need queueMicrotask.
  const initFn = getComponentInit(name)
  if (initFn) {
    // Pass original props (with getters) for reactivity
    initFn(0, element, props)
  }

  // 6. Mark element as initialized
  element.setAttribute('data-bf-init', 'true')

  // 7. Store props and register update function for element reuse in reconcileList
  propsMap.set(element, props)
  registerPropsUpdate(element, name, props)

  return element
}

/**
 * Get the props stored for a component element.
 * Used by reconcileList to pass props to an existing element.
 */
export function getComponentProps(element: HTMLElement): Record<string, unknown> | undefined {
  return propsMap.get(element)
}

/**
 * Register a props update function for a component element.
 * When called, this function re-initializes the component with new props.
 */
function registerPropsUpdate(
  element: HTMLElement,
  name: string,
  _initialProps: Record<string, unknown>
): void {
  // Register update function that will be called by reconcileList
  propsUpdateMap.set(element, (newProps: Record<string, unknown>) => {
    // Re-initialize the component with new props
    // This allows the component to capture new values (e.g., todo with editing: true)
    // and set up new effects that reference the new values
    const init = getComponentInit(name)
    if (init) {
      init(0, element, newProps)
    }
  })
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
