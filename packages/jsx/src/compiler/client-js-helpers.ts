/**
 * Client JS generation helpers
 *
 * Provides utility functions for generating client-side JavaScript code.
 */

/**
 * Component data with hasClientJs flag
 */
interface ComponentDataWithClientJs {
  name: string
  hasClientJs: boolean
}

/**
 * Filter child component names that have client JS
 *
 * @param childNames - Array of child component names to filter
 * @param componentData - Array of component data with hasClientJs flag
 * @param excludeNames - Optional array of names to exclude (e.g., same-file components)
 * @returns Array of child names that have client JS
 */
export function filterChildrenWithClientJs(
  childNames: string[],
  componentData: ComponentDataWithClientJs[],
  excludeNames?: string[]
): string[] {
  return childNames.filter(childName => {
    // Skip if child is in the exclude list
    if (excludeNames?.includes(childName)) return false
    const childData = componentData.find(d => d.name === childName)
    if (!childData) return false
    return childData.hasClientJs
  })
}

/**
 * Concatenate declaration strings (constants, signals, memos)
 * Filters out empty/falsy strings and joins with newlines
 *
 * @param declarations - Array of declaration strings
 * @returns Concatenated declarations string
 */
export function joinDeclarations(...declarations: (string | undefined | null | false)[]): string {
  return declarations.filter(Boolean).join('\n')
}
