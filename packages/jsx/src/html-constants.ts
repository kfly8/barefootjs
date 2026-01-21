/**
 * HTML boolean attributes that should be rendered without values.
 *
 * When true: render as attribute name only (e.g., `checked`)
 * When false/null/undefined: omit from output entirely
 */
export const BOOLEAN_ATTRS = new Set([
  'checked',
  'disabled',
  'readonly',
  'selected',
  'required',
  'hidden',
  'autofocus',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'open',
  'multiple',
  'novalidate',
])

/**
 * Check if an attribute name is a boolean attribute.
 */
export function isBooleanAttr(name: string): boolean {
  return BOOLEAN_ATTRS.has(name.toLowerCase())
}
