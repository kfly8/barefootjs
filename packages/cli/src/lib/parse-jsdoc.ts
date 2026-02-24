// JSDoc extraction helpers for component metadata.
// These remain regex-based because the compiler's analyzeComponent() does not parse JSDoc comments.

import type { ExampleMeta, PropMeta } from './types'

/**
 * Extract the top-level JSDoc description before any import/function.
 * Returns only the description text, not @tag blocks.
 */
export function extractDescription(source: string): string {
  const match = source.match(/^(?:"use client"\n+)?\/\*\*\n([\s\S]*?)\*\//m)
  if (!match) return ''

  const block = match[1]
  const lines = block.split('\n')

  const descLines: string[] = []
  for (const line of lines) {
    const cleaned = line.replace(/^\s*\*\s?/, '').trim()
    if (cleaned.startsWith('@')) break
    descLines.push(cleaned)
  }

  return descLines.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Extract @example blocks from the top-level JSDoc.
 */
export function extractExamples(source: string): ExampleMeta[] {
  const match = source.match(/^(?:"use client"\n+)?\/\*\*\n([\s\S]*?)\*\//m)
  if (!match) return []

  const block = match[1]
  const examples: ExampleMeta[] = []
  const exampleRegex = /@example\s+(.*?)(?:\n\s*\*\s*```tsx?\n([\s\S]*?)```)/g

  let m: RegExpExecArray | null
  while ((m = exampleRegex.exec(block)) !== null) {
    const title = m[1].trim()
    const code = m[2]
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim()
    examples.push({ title, code })
  }

  return examples
}

/**
 * Extract per-prop JSDoc descriptions from the first Props interface.
 * Returns a map of prop name to { description, defaultValue }.
 */
export function extractPropDescriptions(source: string): Record<string, { description: string; defaultValue?: string }> {
  const result: Record<string, { description: string; defaultValue?: string }> = {}

  // Find the first Props interface body
  const match = source.match(/interface\s+\w+Props\s+(?:extends\s+[\w<>,\s]+\s+)?\{/)
  if (!match || match.index === undefined) return result

  const bodyStart = source.indexOf('{', match.index)
  if (bodyStart === -1) return result

  let depth = 0
  let bodyEnd = bodyStart
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) { bodyEnd = i; break }
    }
  }

  const body = source.slice(bodyStart + 1, bodyEnd)

  // Match JSDoc + prop definition patterns
  const propRegex = /(?:\/\*\*\s*([\s\S]*?)\s*\*\/\s*)?([\w]+)(\??):\s*([^\n]+)/g

  let m: RegExpExecArray | null
  while ((m = propRegex.exec(body)) !== null) {
    const jsdoc = m[1] || ''
    const name = m[2]
    if (name.startsWith('__')) continue

    const description = extractJsdocDescription(jsdoc)
    const defaultMatch = jsdoc.match(/@default\s+(.+?)(?:\s*$|\s*\*)/m)
    const defaultValue = defaultMatch ? defaultMatch[1].trim().replace(/^['"]|['"]$/g, '') : undefined

    result[name] = { description, defaultValue }
  }

  return result
}

/**
 * Parse props from a TypeScript interface definition string.
 * Handles JSDoc comments on individual props.
 */
export function parsePropsFromDefinition(definition: string): PropMeta[] {
  const props: PropMeta[] = []

  // Extract interface body (between first { and matching })
  const bodyStart = definition.indexOf('{')
  if (bodyStart === -1) return props

  let depth = 0
  let bodyEnd = bodyStart
  for (let i = bodyStart; i < definition.length; i++) {
    if (definition[i] === '{') depth++
    else if (definition[i] === '}') {
      depth--
      if (depth === 0) { bodyEnd = i; break }
    }
  }

  const body = definition.slice(bodyStart + 1, bodyEnd)
  const propRegex = /(?:\/\*\*\s*([\s\S]*?)\s*\*\/\s*)?([\w]+)(\??):\s*([^\n]+)/g

  let m: RegExpExecArray | null
  while ((m = propRegex.exec(body)) !== null) {
    const jsdoc = m[1] || ''
    const name = m[2]
    if (name.startsWith('__')) continue

    const type = m[4].trim().replace(/;?\s*$/, '').trim()
    const description = extractJsdocDescription(jsdoc)
    const defaultMatch = jsdoc.match(/@default\s+(.+?)(?:\s*$|\s*\*)/m)
    const defaultValue = defaultMatch ? defaultMatch[1].trim().replace(/^['"]|['"]$/g, '') : undefined

    props.push({
      name,
      type,
      required: m[3] !== '?' && defaultValue === undefined,
      default: defaultValue,
      description,
    })
  }

  return props
}

/**
 * Extract JSDoc description from a block preceding an interface or function.
 * Takes the full source and a position to search backward from.
 * Finds the last JSDoc block immediately before the position.
 */
export function extractJsdocBefore(source: string, position: number): string {
  const before = source.slice(Math.max(0, position - 500), position)
  // Find the last /** in the window
  const lastStart = before.lastIndexOf('/**')
  if (lastStart === -1) return ''

  const fromLastJsdoc = before.slice(lastStart)
  const endMatch = fromLastJsdoc.match(/\/\*\*\s*([\s\S]*?)\s*\*\//)
  if (!endMatch) return ''

  // Verify only whitespace between */ and the target position
  const afterEnd = fromLastJsdoc.slice(endMatch.index! + endMatch[0].length)
  if (afterEnd.trim() !== '') return ''

  return extractJsdocDescription(endMatch[1])
}

/**
 * Extract a clean description from a JSDoc block (strips @tags).
 */
function extractJsdocDescription(jsdoc: string): string {
  if (!jsdoc) return ''

  const lines = jsdoc.split('\n')
  const descLines: string[] = []

  for (const line of lines) {
    const cleaned = line.replace(/^\s*\*?\s*/, '').trim()
    if (cleaned.startsWith('@')) break
    if (cleaned) descLines.push(cleaned)
  }

  return descLines.join(' ').trim()
}
