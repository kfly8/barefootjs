/**
 * HTML Helper Functions
 *
 * Provides utilities for handling HTML elements and attributes.
 */

/**
 * Set of self-closing (void) HTML elements
 * These elements cannot have children and should not have closing tags.
 */
const SELF_CLOSING_TAGS = new Set([
  'input',
  'br',
  'hr',
  'img',
  'meta',
  'link',
  'area',
  'base',
  'col',
  'embed',
  'source',
  'track',
  'wbr',
])

/**
 * Checks if an HTML tag is a self-closing (void) element
 */
export function isSelfClosingTag(tagName: string): boolean {
  return SELF_CLOSING_TAGS.has(tagName.toLowerCase())
}
