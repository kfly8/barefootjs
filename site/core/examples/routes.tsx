/**
 * Examples index routes.
 *
 * GET /examples renders a catalog of the adapter demos. Each card links to
 * the adapter's home page (served by the adapter itself under
 * /examples/<slug>/), so visitors can compare how the same JSX runs on
 * different backends.
 */

import { Hono } from 'hono'
import { landingRenderer } from '../landing/renderer'

type Adapter = {
  slug: string
  name: string
  runtime: string
  description: string
}

const ADAPTERS: Adapter[] = [
  {
    slug: 'hono',
    name: 'Hono',
    runtime: 'TypeScript · Cloudflare Workers',
    description:
      'SSR and client hydration on Workers. Same JSX runs through the Hono adapter with Workers Assets serving the compiled client JS.',
  },
  {
    slug: 'echo',
    name: 'Echo',
    runtime: 'Go · Labstack Echo',
    description:
      'JSX compiled to Go html/template. The Go server renders the templates; the shared client runtime hydrates the result.',
  },
  {
    slug: 'mojolicious',
    name: 'Mojolicious',
    runtime: 'Perl · Mojolicious::Lite',
    description:
      'JSX compiled to Mojolicious ep templates. Demonstrates that the reactivity model is portable to any backend with a template engine.',
  },
]

function ExamplesIndex() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold mb-2">Examples</h1>
        <p className="text-muted-foreground">
          The same shared components running on three backends. Click through
          to try them out.
        </p>
      </header>

      <ul className="grid gap-4 list-none p-0 md:grid-cols-2">
        {ADAPTERS.map((a) => (
          <li className="m-0">
            <a
              href={`/examples/${a.slug}`}
              className="block rounded-lg border border-border p-5 hover:border-foreground/40 transition-colors no-underline"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xl font-semibold m-0">{a.name}</h2>
                <code className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                  {a.runtime}
                </code>
              </div>
              <p className="text-sm text-muted-foreground m-0">{a.description}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function createExamplesApp() {
  const app = new Hono()
  app.use(landingRenderer)

  app.get('/', (c) =>
    c.render(<ExamplesIndex />, {
      title: 'Examples — Barefoot.js',
      description:
        'Same JSX components running on Hono (Workers), Echo (Go), and Mojolicious (Perl).',
    }),
  )

  return app
}
