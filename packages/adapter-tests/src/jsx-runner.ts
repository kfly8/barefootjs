/**
 * JSX-Based Conformance Test Runner
 *
 * Compiles JSX source with adapters and compares rendered HTML output.
 * Uses renderComponent from @barefootjs/preview for actual rendering.
 */

import { describe, test, expect } from 'bun:test'
import type { TemplateAdapter } from '@barefootjs/jsx'
import { renderComponent, normalizeHTML } from '@barefootjs/preview/render'
import { jsxFixtures } from '../fixtures'
import type { JSXFixture } from './types'

export interface RunJSXConformanceOptions {
  /** Factory to create the adapter under test */
  createAdapter: () => TemplateAdapter
  /** Factory to create the reference adapter (Hono). If provided, HTML output is compared. */
  referenceAdapter?: () => TemplateAdapter
  /** Fixture IDs to skip */
  skip?: string[]
}

export function runJSXConformanceTests(options: RunJSXConformanceOptions): void {
  const { createAdapter, referenceAdapter, skip = [] } = options
  const skipSet = new Set(skip)

  describe('JSX Conformance Tests', () => {
    for (const fixture of jsxFixtures) {
      if (skipSet.has(fixture.id)) continue

      test(`[${fixture.id}] ${fixture.description}`, async () => {
        const adapter = createAdapter()

        // 1. Render with the adapter under test
        const html = await renderComponent({
          source: fixture.source,
          adapter,
          props: fixture.props,
        })
        expect(html).toBeTruthy()

        // 2. If reference adapter provided, compare HTML output
        if (referenceAdapter) {
          const refAdapter = referenceAdapter()
          const refHtml = await renderComponent({
            source: fixture.source,
            adapter: refAdapter,
            props: fixture.props,
          })

          const normalizedHtml = normalizeHTML(html)
          const normalizedRefHtml = normalizeHTML(refHtml)

          expect(normalizedHtml).toBe(normalizedRefHtml)
        }
      })
    }
  })
}
