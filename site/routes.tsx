/**
 * BarefootJS Site Routes
 *
 * Landing page route.
 */

import { Hono } from 'hono'
import { renderer } from './renderer'
import { Hero } from './components/hero'
import { FiveFeaturesSection, UIComponentsSection } from './components/features'

/**
 * Create the site app with routes.
 */
export function createApp() {
  const app = new Hono()

  app.use(renderer)

  // Landing page
  app.get('/', (c) => {
    return c.render(
      <>
        <Hero />
        <FiveFeaturesSection />
        <UIComponentsSection />
      </>,
      {
        title: 'Barefoot.js - Reactive TSX for any backend',
        description:
          'Type-safe TSX with signals and selective hydration for server-first applications.',
      }
    )
  })

  return app
}
