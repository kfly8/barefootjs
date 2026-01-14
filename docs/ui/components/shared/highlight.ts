/**
 * Shiki Syntax Highlighting Utility
 *
 * Provides build-time syntax highlighting for code blocks.
 * Uses Shiki with dark/light theme support.
 *
 * Uses fine-grained bundles and JavaScript RegExp engine for Cloudflare Workers compatibility.
 * The JavaScript engine avoids WASM which has restrictions in Workers environments.
 */

import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

// Fine-grained theme imports
import githubLight from '@shikijs/themes/github-light'
import githubDark from '@shikijs/themes/github-dark'

// Fine-grained language imports
import langTsx from '@shikijs/langs/tsx'
import langTypescript from '@shikijs/langs/typescript'
import langJavascript from '@shikijs/langs/javascript'
import langBash from '@shikijs/langs/bash'
import langJson from '@shikijs/langs/json'
import langHtml from '@shikijs/langs/html'
import langCss from '@shikijs/langs/css'

// Singleton highlighter instance
let highlighter: HighlighterCore | null = null

// Language mapping for common aliases
const langMap: Record<string, string> = {
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
 * Uses JavaScript RegExp engine for Cloudflare Workers compatibility (no WASM).
 */
export async function initHighlighter(): Promise<void> {
  if (highlighter) return

  highlighter = await createHighlighterCore({
    themes: [githubDark, githubLight],
    langs: [langTsx, langTypescript, langJavascript, langBash, langJson, langCss, langHtml],
    engine: createJavaScriptRegexEngine(),
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
