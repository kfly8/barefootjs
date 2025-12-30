/**
 * E2E DOM Test Helpers
 *
 * Utilities for testing compiled JSX in a real DOM environment.
 * These tests verify that:
 * - Generated HTML renders correctly
 * - Generated clientJs executes and binds events
 * - Signal updates cause correct DOM changes
 */

import { compileJSX } from '../../src/jsx-compiler'
import { testHtmlAdapter } from '../../src/adapters/testing'

export type CompileResult = {
  html: string
  clientJs: string
  components: Array<{
    name: string
    html: string
    clientJs: string
    serverJsx: string
  }>
}

/**
 * Converts file-based output to component-like array for backward compatibility
 */
function toComponentsArray(result: { files: Array<{
  sourcePath: string
  serverJsx: string
  clientJs: string
  componentNames: string[]
}> }): CompileResult['components'] {
  const components: CompileResult['components'] = []
  for (const file of result.files) {
    for (const compName of file.componentNames) {
      components.push({
        name: compName,
        html: file.serverJsx,  // HTML is stored in serverJsx for HTML adapter
        clientJs: file.clientJs,
        serverJsx: file.serverJsx,
      })
    }
  }
  return components
}

/**
 * Compiles JSX source code and returns HTML + clientJs
 */
export async function compile(source: string): Promise<CompileResult> {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  const result = await compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testHtmlAdapter })

  // Convert file-based output to components array
  const components = toComponentsArray(result)
  const firstComponent = components[0]

  return {
    html: firstComponent?.serverJsx || '',  // htmlServerAdapter puts HTML in serverJsx field
    clientJs: firstComponent?.clientJs || '',
    components,
  }
}

/**
 * Compiles multiple files
 */
export async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
): Promise<CompileResult> {
  const result = await compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testHtmlAdapter })

  // Convert file-based output to components array
  const components = toComponentsArray(result)
  const firstComponent = components[0]

  return {
    html: firstComponent?.serverJsx || '',
    clientJs: firstComponent?.clientJs || '',
    components,
  }
}

/**
 * Sets up DOM with compiled HTML and executes clientJs
 *
 * @returns Object with container element and cleanup function
 *
 * @example
 * ```typescript
 * const { container, cleanup } = await setupDOM(result)
 * container.querySelector('button').click()
 * expect(container.querySelector('p').textContent).toBe('1')
 * cleanup()
 * ```
 */
export async function setupDOM(result: CompileResult): Promise<{
  container: HTMLElement
  cleanup: () => void
}> {
  // Create container and insert HTML
  const container = document.createElement('div')
  container.innerHTML = result.html
  document.body.appendChild(container)

  // Execute clientJs in the context with barefoot imports
  const { createSignal, createEffect, onCleanup, reconcileList } = await import('../../../dom/src/reactive')

  // Remove import statements from clientJs (they're not needed in test context)
  const cleanedClientJs = result.clientJs
    .replace(/^import\s+.*$/gm, '')  // Remove import lines
    .trim()

  // Create a function that has access to barefoot primitives
  const executeClientJs = new Function(
    'createSignal',
    'createEffect',
    'onCleanup',
    'reconcileList',
    'document',
    cleanedClientJs
  )

  executeClientJs(createSignal, createEffect, onCleanup, reconcileList, document)

  return {
    container,
    cleanup: () => {
      container.remove()
    },
  }
}

/**
 * Waits for DOM updates (microtask queue flush)
 */
export function waitForUpdate(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Simulates a click event
 */
export function click(element: Element): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

/**
 * Simulates an input event
 */
export function input(element: HTMLInputElement, value: string): void {
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Simulates a blur event
 */
export function blur(element: Element): void {
  element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
}

/**
 * Simulates a keydown event
 */
export function keydown(element: Element, key: string, options: { isComposing?: boolean } = {}): void {
  element.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    composed: true,
    ...options,
  }))
}
