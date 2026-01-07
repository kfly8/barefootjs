/**
 * Shiki syntax highlighter module
 *
 * Initializes Shiki with commonly used languages for documentation.
 * Must be initialized before use via initHighlighter().
 * Supports both light and dark themes via CSS variables.
 */

import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki'
import { componentTypes, getComponentTooltip } from './component-types'

let highlighter: Highlighter | null = null

// Languages needed for documentation
const LANGUAGES: BundledLanguage[] = ['tsx', 'typescript', 'bash', 'json', 'html', 'css']

// Themes for light and dark modes
const LIGHT_THEME = 'github-light'
const DARK_THEME = 'github-dark'

/**
 * Initialize the Shiki highlighter.
 * Must be called once at server startup.
 */
export async function initHighlighter(): Promise<void> {
  if (highlighter) return

  highlighter = await createHighlighter({
    themes: [LIGHT_THEME, DARK_THEME],
    langs: LANGUAGES,
  })
}

/**
 * Highlight code with syntax highlighting.
 * Returns HTML string with highlighted code using CSS variables for theming.
 * Falls back to plain text if highlighter not initialized.
 */
export function highlight(code: string, lang: string = 'tsx'): string {
  if (!highlighter) {
    // Fallback: escape HTML and return plain code
    return escapeHtml(code)
  }

  // Map common aliases
  const langMap: Record<string, BundledLanguage> = {
    ts: 'typescript',
    js: 'typescript', // Use TS highlighting for JS too
    jsx: 'tsx',
    sh: 'bash',
    shell: 'bash',
  }

  const resolvedLang = (langMap[lang] || lang) as BundledLanguage

  try {
    // Use dual themes with CSS variables for light/dark mode support
    const html = highlighter.codeToHtml(code, {
      lang: resolvedLang,
      themes: {
        light: LIGHT_THEME,
        dark: DARK_THEME,
      },
      defaultColor: false, // Use CSS variables instead of inline colors
    })
    // Extract just the code content from <pre><code>...</code></pre>
    // Shiki returns: <pre class="..." style="..."><code>...</code></pre>
    // We want just the inner code content to use our own styling
    const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
    return match ? match[1] : escapeHtml(code)
  } catch {
    // Language not supported, return escaped plain text
    return escapeHtml(code)
  }
}

/**
 * Highlight code with component type tooltips.
 * Wraps known component names (e.g., Button, Badge) with tooltip spans.
 * Only works for TSX/JSX code.
 */
export function highlightWithTooltips(code: string, lang: string = 'tsx'): string {
  const html = highlight(code, lang)

  // Only process TSX/JSX code
  if (lang !== 'tsx' && lang !== 'jsx') {
    return html
  }

  return addComponentTooltips(html)
}

/**
 * Add tooltip wrappers to component names in highlighted HTML.
 *
 * Shiki highlights JSX component names (PascalCase) with specific colors:
 * - Light: #005CC5
 * - Dark: #79B8FF
 *
 * We find these spans and wrap them with tooltip containers.
 */
function addComponentTooltips(html: string): string {
  // Pattern to match Shiki's JSX component spans
  // Format: <span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">ComponentName</span>
  const componentSpanPattern = /<span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">([A-Z][a-zA-Z0-9]*)<\/span>/g

  return html.replace(componentSpanPattern, (match, componentName) => {
    const tooltip = getComponentTooltip(componentName)
    if (!tooltip) {
      // Not a known component, return unchanged
      return match
    }

    // Escape tooltip for HTML attribute
    const escapedTooltip = escapeHtmlAttr(tooltip)

    // Wrap with tooltip container
    return `<span class="code-tooltip" data-tooltip="${escapedTooltip}"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF">${componentName}</span></span>`
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
}
