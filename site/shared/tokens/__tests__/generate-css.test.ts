import { describe, test, expect } from 'bun:test'
import { resolve, dirname } from 'node:path'
import { loadTokens, generateCSS, mergeTokenSets } from '../index'
import type { TokenSet, ColorToken } from '../schema'

const TOKENS_DIR = dirname(import.meta.dir)
const BASE_JSON = resolve(TOKENS_DIR, 'tokens.json')
const UI_JSON = resolve(dirname(dirname(TOKENS_DIR)), 'ui/tokens.json')

describe('generateCSS roundtrip', () => {
  test('all token names appear in generated CSS', async () => {
    const tokens = await loadTokens(BASE_JSON)
    const css = generateCSS(tokens)

    const allTokens = [
      ...tokens.typography.fontFamily,
      ...tokens.typography.letterSpacing,
      ...tokens.spacing,
      ...tokens.borderRadius,
      ...tokens.transitions.duration,
      ...tokens.transitions.easing,
      ...tokens.layout,
      ...tokens.colors,
      ...tokens.shadows,
    ]

    for (const t of allTokens) {
      expect(css).toContain(`--${t.name}:`)
    }
  })

  test('color dark values appear in .dark block', async () => {
    const tokens = await loadTokens(BASE_JSON)
    const css = generateCSS(tokens)

    // Split at .dark to isolate the dark block
    const darkBlockMatch = css.match(/\.dark\s*\{([^}]+)\}/)
    expect(darkBlockMatch).not.toBeNull()
    const darkBlock = darkBlockMatch![1]

    const darkColors = tokens.colors.filter((c: ColorToken) => c.dark)
    for (const c of darkColors) {
      expect(darkBlock).toContain(`--${c.name}: ${c.dark}`)
    }
  })

  test('CSS contains :root and .dark selectors', async () => {
    const tokens = await loadTokens(BASE_JSON)
    const css = generateCSS(tokens)

    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
  })

  test('CSS contains AUTO-GENERATED header', async () => {
    const tokens = await loadTokens(BASE_JSON)
    const css = generateCSS(tokens)

    expect(css).toContain('AUTO-GENERATED')
  })
})

describe('mergeTokenSets', () => {
  test('extension tokens are added to base', async () => {
    const base = await loadTokens(BASE_JSON)
    const ext = await loadTokens(UI_JSON)
    const merged = mergeTokenSets(base, ext)

    // Extension adds popover color
    expect(merged.colors.find(c => c.name === 'popover')).toBeTruthy()
    // Base colors still present
    expect(merged.colors.find(c => c.name === 'background')).toBeTruthy()
  })

  test('extension overrides base token with same name', () => {
    const base: TokenSet = {
      $schema: '', version: 1,
      typography: { fontFamily: [], letterSpacing: [] },
      spacing: [{ name: 'space-1', value: '4px' }],
      borderRadius: [], transitions: { duration: [], easing: [] },
      layout: [], colors: [], shadows: [],
    }
    const ext: TokenSet = {
      $schema: '', version: 1,
      typography: { fontFamily: [], letterSpacing: [] },
      spacing: [{ name: 'space-1', value: '8px' }],
      borderRadius: [], transitions: { duration: [], easing: [] },
      layout: [], colors: [], shadows: [],
    }

    const merged = mergeTokenSets(base, ext)
    expect(merged.spacing).toHaveLength(1)
    expect(merged.spacing[0].value).toBe('8px')
  })

  test('merged tokens produce valid CSS with all tokens', async () => {
    const base = await loadTokens(BASE_JSON)
    const ext = await loadTokens(UI_JSON)
    const merged = mergeTokenSets(base, ext)
    const css = generateCSS(merged)

    // Check extension-only tokens appear
    expect(css).toContain('--popover:')
    expect(css).toContain('--success:')
    expect(css).toContain('--duration-slow:')
    expect(css).toContain('--ease-default:')

    // Check base tokens still present
    expect(css).toContain('--font-sans:')
    expect(css).toContain('--background:')
  })
})
