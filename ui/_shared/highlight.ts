/**
 * Shiki Syntax Highlighting Utility
 *
 * Provides build-time syntax highlighting for code blocks.
 * Uses Shiki with dark/light theme support.
 */

import { createHighlighter, type BundledLanguage } from 'shiki'

// Singleton highlighter instance
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null

// Supported languages
type SupportedLang = 'tsx' | 'typescript' | 'javascript' | 'bash' | 'json' | 'css' | 'html'

// Language mapping for common aliases
const langMap: Record<string, BundledLanguage> = {
  tsx: 'tsx',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  json: 'json',
  css: 'css',
  html: 'html',
}

/**
 * Initialize the Shiki highlighter.
 * Call this once at application startup.
 */
export async function initHighlighter(): Promise<void> {
  if (highlighter) return

  highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['tsx', 'typescript', 'javascript', 'bash', 'json', 'css', 'html'],
  })
}

/**
 * Highlight code using Shiki.
 * Returns HTML string with syntax highlighting.
 *
 * @param code - The code to highlight
 * @param lang - Language for syntax highlighting (default: tsx)
 * @returns HTML string with highlighted code
 */
export async function highlightCode(code: string, lang: string = 'tsx'): Promise<string> {
  // Ensure highlighter is initialized
  if (!highlighter) {
    await initHighlighter()
  }

  const mappedLang = langMap[lang] || 'tsx'

  try {
    // Generate HTML with both themes for CSS-based theme switching
    const html = highlighter!.codeToHtml(code, {
      lang: mappedLang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false, // Use CSS variables for colors
    })

    return html
  } catch (error) {
    // Fallback to plain text if highlighting fails
    console.error('Shiki highlighting failed:', error)
    return `<pre><code>${escapeHtml(code)}</code></pre>`
  }
}

/**
 * Synchronous code escaping for fallback.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
