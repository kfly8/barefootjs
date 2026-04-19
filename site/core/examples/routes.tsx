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
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Examples</h1>
      <p className="text-muted-foreground mb-8">
        The same shared components running on three backends.
      </p>

      <ul className="list-none p-0 m-0">
        {ADAPTERS.map((a) => (
          <li className="py-3 border-b border-border last:border-b-0">
            <a href={`/examples/${a.slug}`} className="font-semibold mr-2">
              {a.name}
            </a>
            <span className="text-sm text-muted-foreground">{a.runtime}</span>
            <p className="text-sm text-muted-foreground m-0 mt-1">{a.description}</p>
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
