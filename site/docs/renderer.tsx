/**
 * HTML layout renderer for the documentation site.
 * Provides the shell: <html>, <head> with meta tags, sidebar navigation, and content area.
 */

import { jsxRenderer } from 'hono/jsx-renderer'
import { navigation, type NavItem } from './lib/navigation'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: {
        title?: string
        description?: string
        meta?: Record<string, string>
        slug?: string
      }
    ): Response | Promise<Response>
  }
}

// Theme initialization script — runs before render to prevent FOUC
const themeInitScript = `
(function() {
  var stored = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
`

// Theme toggle script
const themeToggleScript = `
document.getElementById('theme-toggle').addEventListener('click', function() {
  var isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
`

// Mobile menu toggle script
const mobileMenuScript = `
document.getElementById('mobile-menu-toggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('sidebar-open');
  document.getElementById('sidebar-overlay').classList.toggle('overlay-visible');
});
document.getElementById('sidebar-overlay').addEventListener('click', function() {
  document.getElementById('sidebar').classList.remove('sidebar-open');
  this.classList.remove('overlay-visible');
});
`

function NavLink({ item, currentSlug, depth = 0 }: { item: NavItem; currentSlug: string; depth?: number }) {
  const isActive = currentSlug === item.slug
  const isParentActive = currentSlug.startsWith(item.slug + '/')
  const activeClass = isActive ? ' nav-link-active' : ''
  const parentClass = isParentActive ? ' nav-link-parent-active' : ''

  return (
    <li>
      <a
        href={`/${item.slug}`}
        class={`nav-link nav-link-depth-${depth}${activeClass}${parentClass}`}
      >
        {item.title}
      </a>
      {item.children && (
        <ul class="nav-children">
          {item.children.map((child) => (
            <NavLink item={child} currentSlug={currentSlug} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function Sidebar({ currentSlug }: { currentSlug: string }) {
  return (
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-header">
        <a href="/" class="sidebar-logo">BarefootJS</a>
      </div>
      <nav class="sidebar-nav">
        <ul>
          {navigation.map((item) => (
            <NavLink item={item} currentSlug={currentSlug} />
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function MdToggleButton({ slug }: { slug: string }) {
  const mdPath = slug === '' ? '/README.md' : `/${slug}.md`
  return (
    <a href={mdPath} class="md-toggle-btn" title="View as Markdown">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15V4.15C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z" />
      </svg>
      <span>Markdown</span>
    </a>
  )
}

export const renderer = jsxRenderer(
  ({ children, title, description, meta, slug }) => {
    const pageTitle = title ? `${title} — BarefootJS` : 'BarefootJS Documentation'
    const currentSlug = slug || ''

    return (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{pageTitle}</title>
          {description && <meta name="description" content={description} />}
          {meta && Object.entries(meta).map(([key, value]) => {
            if (key.startsWith('og:')) {
              return <meta property={key} content={value} />
            }
            return <meta name={key} content={value} />
          })}
          <meta name="author" content="kobaken a.k.a @kfly8" />
          <link rel="author" href="https://kobaken.co" />
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <link rel="stylesheet" href="/static/globals.css" />
        </head>
        <body>
          <div id="sidebar-overlay" class="sidebar-overlay" />

          <header class="top-header">
            <button id="mobile-menu-toggle" class="mobile-menu-toggle" aria-label="Toggle menu">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
              </svg>
            </button>
            <a href="/" class="header-logo">BarefootJS</a>
            <div class="header-actions">
              <MdToggleButton slug={currentSlug} />
              <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle theme">
                <svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </header>

          <Sidebar currentSlug={currentSlug} />

          <main class="main-content">
            <article class="doc-article">
              {children}
            </article>
          </main>

          <script dangerouslySetInnerHTML={{ __html: themeToggleScript }} />
          <script dangerouslySetInnerHTML={{ __html: mobileMenuScript }} />
        </body>
      </html>
    )
  },
  { stream: true }
)
