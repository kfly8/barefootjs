/**
 * Shiki syntax highlighter module
 *
 * Initializes Shiki with commonly used languages for documentation.
 * Uses fine-grained bundles and JavaScript RegExp engine for Cloudflare Workers compatibility.
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
import langHtml from '@shikijs/langs/html'
import langBash from '@shikijs/langs/bash'

let highlighter: HighlighterCore | null = null

const LIGHT_THEME = 'github-light'
const DARK_THEME = 'github-dark'

/**
 * Initialize the Shiki highlighter.
 * Must be called once at server startup.
 */
export async function initHighlighter(): Promise<void> {
  if (highlighter) return

  highlighter = await createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [langTsx, langTypescript, langJavascript, langHtml, langBash],
    engine: createJavaScriptRegexEngine(),
  })
}

/**
 * Highlight code with syntax highlighting.
 * Returns HTML string with highlighted code using CSS variables for theming.
 */
export function highlight(code: string, lang: string = 'tsx'): string {
  if (!highlighter) {
    return escapeHtml(code)
  }

  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    jsx: 'tsx',
    sh: 'bash',
    shell: 'bash',
  }

  const resolvedLang = langMap[lang] || lang

  try {
    const html = highlighter.codeToHtml(code, {
      lang: resolvedLang,
      themes: {
        light: LIGHT_THEME,
        dark: DARK_THEME,
      },
      defaultColor: false,
    })
    const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
    return match ? match[1] : escapeHtml(code)
  } catch {
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
