/**
 * HTML layout renderer for the documentation site.
 * Provides the shell: <html>, <head> with meta tags, sidebar navigation, and content area.
 *
 * Modernized: uses @barefootjs/hono/jsx, BfScripts, import map, UnoCSS,
 * compiled ThemeSwitcher and Logo components.
 */

import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { navigation, type NavItem } from './lib/navigation'
import { BfScripts } from '../../packages/hono/src/scripts'

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

/**
 * Predictable instance ID generator for consistent SSR.
 */
const createPredictableIdGenerator = () => {
  const counters = new Map<string, number>()
  return (name: string) => {
    const count = counters.get(name) || 0
    counters.set(name, count + 1)
    return `${name}_${count}`
  }
}

function WithPredictableIds({ children }: { children: any }) {
  const c = useRequestContext()
  c.set('bfInstanceIdGenerator', createPredictableIdGenerator())
  return <>{children}</>
}

import { themeInitScript } from '@barefootjs/site-shared/lib/theme-init'

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

// Import map for resolving @barefootjs/dom in client JS
const importMapScript = JSON.stringify({
  imports: {
    '@barefootjs/dom': '/static/components/barefoot.js',
  },
})

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

// Import compiled shared components
import { Logo } from '@/components/logo'
import { ThemeSwitcher } from '@/components/theme-switcher'

export const renderer = jsxRenderer(
  ({ children, title, description, meta, slug }) => {
    const pageTitle = title ? `${title} — BarefootJS` : 'BarefootJS Documentation'
    const currentSlug = slug || ''

    return (
      <WithPredictableIds>
        <html lang="en">
          <head>
            <script type="importmap" dangerouslySetInnerHTML={{ __html: importMapScript }} />
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" type="image/png" sizes="32x32" href="/static/icon-32.png" />
            <link rel="icon" type="image/png" sizes="64x64" href="/static/icon-64.png" />
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
            <link rel="stylesheet" href="/static/uno.css" />
          </head>
          <body>
            <div id="sidebar-overlay" class="sidebar-overlay" />

            <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] flex items-center gap-3 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
              <button id="mobile-menu-toggle" className="hidden max-md:inline-flex p-1 text-foreground" aria-label="Toggle menu">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
                </svg>
              </button>
              <a href="/" className="text-foreground no-underline">
                <Logo />
              </a>
              <div className="ml-auto flex items-center gap-2">
                <MdToggleButton slug={currentSlug} />
                <ThemeSwitcher />
              </div>
            </header>

            <Sidebar currentSlug={currentSlug} />

            <main class="main-content">
              <article class="doc-article">
                {children}
              </article>
            </main>

            <script dangerouslySetInnerHTML={{ __html: mobileMenuScript }} />
            <BfScripts />
          </body>
        </html>
      </WithPredictableIds>
    )
  },
  { stream: true }
)
