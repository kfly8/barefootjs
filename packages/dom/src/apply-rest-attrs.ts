/**
 * BarefootJS - Apply Rest Attributes Helper
 *
 * Applies spread attributes to HTML elements at hydration time.
 * Used when spread props cannot be statically expanded (open types).
 */

import { createEffect } from './reactive'

/** Map of JSX prop names to HTML attribute names */
function toAttrName(key: string): string {
  if (key === 'className') return 'class'
  if (key === 'htmlFor') return 'for'
  // Convert camelCase to kebab-case for data-* and aria-* style attributes
  return key.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * Reactively apply rest attributes from a props source onto an HTML element.
 * Runs inside a createEffect so attribute values update when props change.
 *
 * @param el - The target DOM element
 * @param source - The props/rest object to read attributes from
 * @param excludeKeys - Keys already handled statically (don't apply twice)
 */
export function applyRestAttrs(
  el: Element,
  source: Record<string, unknown>,
  excludeKeys: string[]
): void {
  const exclude = new Set(excludeKeys)

  createEffect(() => {
    for (const key of Object.keys(source)) {
      if (exclude.has(key)) continue

      // Skip event handlers — they are handled separately
      if (key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase()) continue

      const value = source[key]
      const attr = toAttrName(key)

      if (value != null && value !== false) {
        el.setAttribute(attr, String(value))
      } else {
        el.removeAttribute(attr)
      }
    }
  })
}
