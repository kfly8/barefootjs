/**
 * BarefootJS JSX Compiler - IR to Server JSX Transformer
 *
 * Generates server-side JSX components from Intermediate Representation (IR).
 * Uses adapters for framework-specific output (e.g., Hono, React).
 */

import type { ServerComponentAdapter } from '../types'

/**
 * Converts HTML to JSX format
 *
 * Transforms HTML attributes to their JSX equivalents:
 * - class -> className
 */
export function htmlToJsx(html: string): string {
  return html.replace(/\bclass="/g, 'className="')
}

/**
 * Generates server-side JSX component code
 *
 * @param staticHtml - Static HTML generated from IR
 * @param name - Component name
 * @param props - Component props
 * @param adapter - Server component adapter for framework-specific output
 * @returns Server JSX component code
 */
export function generateServerJsx(
  staticHtml: string,
  name: string,
  props: string[],
  adapter: ServerComponentAdapter
): string {
  const jsx = htmlToJsx(staticHtml)
  return adapter.generateServerComponent({ name, props, jsx })
}
