/**
 * Shiki syntax highlighter module
 *
 * Initializes Shiki with commonly used languages for documentation.
 * Must be initialized before use via initHighlighter().
 * Supports both light and dark themes via CSS variables.
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
import langBash from '@shikijs/langs/bash'
import langJson from '@shikijs/langs/json'
import langHtml from '@shikijs/langs/html'
import langCss from '@shikijs/langs/css'

let highlighter: HighlighterCore | null = null

// Themes for light and dark modes
const LIGHT_THEME = 'github-light'
const DARK_THEME = 'github-dark'

/**
 * Initialize the Shiki highlighter.
 * Must be called once at server startup.
 * Uses JavaScript RegExp engine for Cloudflare Workers compatibility (no WASM).
 */
export async function initHighlighter(): Promise<void> {
  if (highlighter) return

  highlighter = await createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [langTsx, langTypescript, langBash, langJson, langHtml, langCss],
    engine: createJavaScriptRegexEngine(),
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

  // Map common aliases to supported languages
  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'typescript', // Use TS highlighting for JS too
    jsx: 'tsx',
    sh: 'bash',
    shell: 'bash',
  }

  const resolvedLang = langMap[lang] || lang

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
