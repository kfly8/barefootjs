/**
 * BarefootJS Renderer for Hono/JSX
 *
 * Uses hono/jsx-renderer with streaming support.
 * BfScripts component renders collected script tags at body end.
 */

import { jsxRenderer } from 'hono/jsx-renderer'
import { BfScripts } from '../../packages/hono/src/scripts'
import { BfDevReload } from '../../packages/hono/src/dev-reload'

const BASE_PATH = process.env.BASE_PATH ?? '/examples/hono'

// Import map for resolving @barefootjs/client in client JS
const importMapScript = JSON.stringify({
  imports: {
    '@barefootjs/client': `${BASE_PATH}/static/components/barefoot.js`,
    '@barefootjs/client/runtime': `${BASE_PATH}/static/components/barefoot.js`,
  },
})

// Runs before first paint to avoid FOUC in dark mode. Mirrors
// site/shared/lib/theme-init.ts so both sites and examples agree on the
// precedence: explicit localStorage choice > system preference.
const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&d)){document.documentElement.classList.add('dark')}}catch(e){}})();`

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="bf-theme-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="bf-theme-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SiteHeader() {
  return (
    <header className="bf-header">
      <div className="bf-header-inner">
        <div className="bf-header-left">
          <a href="https://barefootjs.dev" className="bf-header-logo">Barefoot.js</a>
          <div className="bf-header-sep" />
          <nav className="bf-header-nav">
            <a href="https://barefootjs.dev/docs/introduction" className="bf-header-link">Core</a>
            <a href="https://ui.barefootjs.dev" className="bf-header-link">UI</a>
            <a href="https://barefootjs.dev/playground" className="bf-header-link">Playground</a>
          </nav>
        </div>
        <div className="bf-header-right">
          <a
            href="https://github.com/barefootjs/barefootjs"
            target="_blank"
            rel="noopener noreferrer"
            className="bf-header-icon-btn"
            aria-label="View on GitHub"
          >
            <GitHubIcon />
          </a>
          <button
            type="button"
            className="bf-header-icon-btn"
            data-bf-theme-toggle
            aria-label="Toggle theme"
          >
            <SunIcon />
            <MoonIcon />
          </button>
        </div>
      </div>
    </header>
  )
}

export const renderer = jsxRenderer(
  ({ children }) => {
    return (
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BarefootJS + Hono/JSX</title>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <script type="importmap" dangerouslySetInnerHTML={{ __html: importMapScript }} />
          <link rel="stylesheet" href={`${BASE_PATH}/shared/styles/tokens.css`} />
          <link rel="stylesheet" href={`${BASE_PATH}/shared/styles/layout.css`} />
          <link rel="stylesheet" href={`${BASE_PATH}/shared/styles/components.css`} />
          <link rel="stylesheet" href={`${BASE_PATH}/shared/styles/todo-app.css`} />
          <link rel="stylesheet" href={`${BASE_PATH}/shared/styles/ai-chat.css`} />
        </head>
        <body>
          <SiteHeader />
          {children}
          <script src={`${BASE_PATH}/shared/scripts/theme-toggle.js`} defer />
          <BfScripts />
          <BfDevReload endpoint={`${BASE_PATH}/_bf/reload`} />
        </body>
      </html>
    )
  },
  { stream: true }
)
