/**
 * JSX Compiler - Utility Functions
 *
 * Provides general utilities used in compilation processing.
 */

/**
 * Wraps callback props (onXxx) to add updateAll()
 *
 * @example
 * // Input
 * { onAdd: handleAdd }
 *
 * // Output (when hasUpdateAll = true)
 * { onAdd: (...args) => { handleAdd(...args); updateAll() } }
 */
export function wrapCallbackProps(propsExpr: string, hasUpdateAll: boolean): string {
  if (!hasUpdateAll) return propsExpr

  // Wrap props starting with on (onAdd, onToggle, etc.)
  return propsExpr.replace(
    /(on[A-Z]\w*):\s*([^,}]+)/g,
    (_, propName, value) => {
      const trimmedValue = value.trim()
      return `${propName}: (...args) => { ${trimmedValue}(...args); updateAll() }`
    }
  )
}

/**
 * Evaluates array expression.
 * Safe to use eval as this only runs at build time.
 */
export function evaluateArrayExpression(expr: string): unknown[] | null {
  try {
    const result = eval(expr)
    return Array.isArray(result) ? result : null
  } catch {
    return null
  }
}

/**
 * Evaluates template literal.
 * Safe to use Function constructor as this only runs at build time.
 */
export function evaluateTemplate(
  templateStr: string,
  paramName: string,
  item: unknown,
  __index: number
): string {
  try {
    const evalFn = new Function(paramName, '__index', `return ${templateStr}`)
    return evalFn(item, __index)
  } catch {
    return ''
  }
}

/**
 * Generates hash from content (8-character hexadecimal)
 *
 * @param content - Content to hash
 * @returns 8-character hash string
 */
export function generateContentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to 8-character hexadecimal (correctly handles negative values)
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Resolves path
 *
 * @param baseDir - Base directory
 * @param relativePath - Relative path (starts with ./ or ../)
 * @returns Resolved path
 */
export function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('./')) {
    return `${baseDir}/${relativePath.slice(2)}`
  }
  if (relativePath.startsWith('../')) {
    const parts = baseDir.split('/')
    parts.pop()
    return `${parts.join('/')}/${relativePath.slice(3)}`
  }
  return relativePath
}

/**
 * Checks if attribute is a dynamic attribute target.
 * e.g., class, style, disabled, value, etc.
 */
export function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
}
