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

export interface RunJSXConformanceOptions {
  /** Factory to create the adapter under test */
  createAdapter: () => TemplateAdapter
  /** Factory to create the reference adapter (Hono). If provided, HTML output is compared. */
  referenceAdapter?: () => TemplateAdapter
  /** Fixture IDs to skip */
  skip?: string[]
  /** Optional error handler for render failures. Return true to skip the test. */
  onRenderError?: (err: Error, fixtureId: string) => boolean
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
        let html: string
        try {
          html = await renderComponent({
            source: fixture.source,
            adapter,
            props: fixture.props,
          })
        } catch (err) {
          if (options.onRenderError?.(err as Error, fixture.id)) return
          throw err
        }
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
