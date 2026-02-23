// Generate CSS custom properties from TokenSet JSON.

import type { TokenSet, Token, ColorToken } from './schema'

/**
 * Merge multiple TokenSets. Later sets override earlier ones (by token name).
 */
export function mergeTokenSets(...sets: TokenSet[]): TokenSet {
  if (sets.length === 0) throw new Error('mergeTokenSets requires at least one TokenSet')
  if (sets.length === 1) return sets[0]

  const base = structuredClone(sets[0])

  for (let i = 1; i < sets.length; i++) {
    const ext = sets[i]
    mergeTokenArray(base.typography.fontFamily, ext.typography.fontFamily)
    mergeTokenArray(base.typography.letterSpacing, ext.typography.letterSpacing)
    mergeTokenArray(base.spacing, ext.spacing)
    mergeTokenArray(base.borderRadius, ext.borderRadius)
    mergeTokenArray(base.transitions.duration, ext.transitions.duration)
    mergeTokenArray(base.transitions.easing, ext.transitions.easing)
    mergeTokenArray(base.layout, ext.layout)
    mergeTokenArray(base.colors, ext.colors)
    mergeTokenArray(base.shadows, ext.shadows)
  }

  return base
}

function mergeTokenArray<T extends Token>(base: T[], ext: T[]): void {
  for (const token of ext) {
    const idx = base.findIndex(t => t.name === token.name)
    if (idx >= 0) {
      base[idx] = token
    } else {
      base.push(token)
    }
  }
}

/**
 * Generate CSS string from a TokenSet.
 * Produces :root { ... } and .dark { ... } blocks.
 */
export function generateCSS(tokenSet: TokenSet): string {
  const rootLines: string[] = []
  const darkLines: string[] = []

  // Helper to add a section with comment header
  function addSection(label: string, tokens: Token[]) {
    if (tokens.length === 0) return
    rootLines.push(`  /* ── ${label} ${'─'.repeat(Math.max(1, 50 - label.length))} */`)
    for (const t of tokens) {
      rootLines.push(`  --${t.name}: ${t.value};`)
    }
    rootLines.push('')
  }

  function addColorSection(tokens: ColorToken[]) {
    if (tokens.length === 0) return
    rootLines.push(`  /* ── Colors (OKLCH, neutral theme) ${'─'.repeat(15)} */`)
    for (const t of tokens) {
      rootLines.push(`  --${t.name}: ${t.value};`)
    }
    rootLines.push('')

    // Dark overrides
    const darkTokens = tokens.filter(t => t.dark)
    if (darkTokens.length > 0) {
      for (const t of darkTokens) {
        darkLines.push(`  --${t.name}: ${t.dark};`)
      }
    }
  }

  addSection('Typography', [
    ...tokenSet.typography.fontFamily,
    ...tokenSet.typography.letterSpacing,
  ])
  addSection('Spacing scale', tokenSet.spacing)
  addSection('Border radius', tokenSet.borderRadius)
  addSection('Transitions', [
    ...tokenSet.transitions.duration,
    ...tokenSet.transitions.easing,
  ])
  addSection('Layout', tokenSet.layout)
  addColorSection(tokenSet.colors)
  addSection('Shadows', tokenSet.shadows)

  const header = `/**
 * AUTO-GENERATED — Do not edit manually.
 * Generated from tokens.json by generate-css.ts.
 *
 * BarefootJS Design Tokens
 */`

  let css = `${header}\n\n:root {\n${rootLines.join('\n')}}\n`

  if (darkLines.length > 0) {
    css += `\n.dark {\n${darkLines.join('\n')}\n}\n`
  }

  return css
}
