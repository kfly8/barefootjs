// Token schema types for BarefootJS design tokens.

export interface Token {
  /** CSS variable name without -- prefix, e.g. "font-sans" */
  name: string
  /** CSS value, e.g. "-apple-system, BlinkMacSystemFont, ..." */
  value: string
  /** Optional human-readable description */
  description?: string
}

export interface ColorToken extends Token {
  /** Value override for .dark theme (colors only) */
  dark?: string
}

export interface TokenSet {
  $schema: string
  version: 1
  typography: {
    fontFamily: Token[]
    letterSpacing: Token[]
  }
  spacing: Token[]
  borderRadius: Token[]
  transitions: {
    duration: Token[]
    easing: Token[]
  }
  layout: Token[]
  colors: ColorToken[]
  shadows: Token[]
}
