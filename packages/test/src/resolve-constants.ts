/**
 * Constant resolution for test IR.
 *
 * Resolves string-valued constants (string literals, template literals,
 * array.join() patterns) into their actual string values. This enables
 * className assertions on resolved CSS class names instead of variable names.
 */

/**
 * Build a map of constant name → resolved string value.
 * Only resolves string literals, template literals, and array.join() patterns.
 * Record lookups, function expressions, and other complex values are skipped.
 */
export function resolveConstants(constants: Array<{ name: string; value: string }>): Map<string, string> {
  const resolved = new Map<string, string>()

  for (const c of constants) {
    const value = tryResolve(c.value, resolved)
    if (value !== null) {
      resolved.set(c.name, value)
    }
  }

  return resolved
}

function tryResolve(raw: string, resolved: Map<string, string>): string | null {
  const value = raw.trim()

  // Single-quoted string literal: 'content'
  if (value.startsWith("'") && value.endsWith("'") && !value.slice(1, -1).includes("'")) {
    return value.slice(1, -1)
  }

  // Double-quoted string literal: "content"
  if (value.startsWith('"') && value.endsWith('"') && !value.slice(1, -1).includes('"')) {
    return value.slice(1, -1)
  }

  // Template literal: `...${var}...`
  if (value.startsWith('`') && value.endsWith('`')) {
    const inner = value.slice(1, -1)
    return inner.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      const trimmed = expr.trim()
      return resolved.get(trimmed) ?? ''
    })
  }

  // Array.join() pattern: [...].join(' ')
  const joinMatch = value.match(/^\[([\s\S]*)\]\.join\(\s*(['"])([^'"]*)\2\s*\)$/)
  if (joinMatch) {
    const arrayContent = joinMatch[1]
    const separator = joinMatch[3]
    const strings: string[] = []
    const stringPattern = /(?:'([^']*)'|"([^"]*)")/g
    let m: RegExpExecArray | null
    while ((m = stringPattern.exec(arrayContent)) !== null) {
      strings.push(m[1] ?? m[2])
    }
    return strings.join(separator)
  }

  return null
}
