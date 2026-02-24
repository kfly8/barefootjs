/**
 * JSX-Based Conformance Test Runner
 *
 * Compiles JSX source with adapters and compares rendered HTML output.
 * Each adapter provides its own render function.
 */

import { describe, test, expect } from 'bun:test'
import type { TemplateAdapter } from '@barefootjs/jsx'
import { jsxFixtures } from '../fixtures'

export interface RenderOptions {
  /** JSX source code */
  source: string
  /** Template adapter to use */
  adapter: TemplateAdapter
  /** Props to inject (optional) */
  props?: Record<string, unknown>
}

export interface RunJSXConformanceOptions {
  /** Factory to create the adapter under test */
  createAdapter: () => TemplateAdapter
  /** Render compiled template to HTML */
  render: (options: RenderOptions) => Promise<string>
  /** Factory to create the reference adapter (optional). If provided, HTML output is compared. */
  referenceAdapter?: () => TemplateAdapter
  /** Render function for reference adapter (required if referenceAdapter is set) */
  referenceRender?: (options: RenderOptions) => Promise<string>
  /** Fixture IDs to skip */
  skip?: string[]
  /** Optional error handler for render failures. Return true to skip the test. */
  onRenderError?: (err: Error, fixtureId: string) => boolean
}

/** HTML void elements that must not have a closing tag */
const VOID_ELEMENTS = 'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'

/**
 * Normalize rendered HTML for cross-adapter comparison.
 * Handles known formatting differences between adapters:
 * - Whitespace collapsing (template engine formatting)
 * - bf-p attribute removal (adapter-specific props serialization strategy)
 * - Void element self-closing normalization (<br/> vs <br>)
 * - Trailing whitespace before closing > in tags
 */
function normalizeHTML(html: string): string {
  return html
    // Remove bf-p attribute (Hono uses JSON serialization, Go uses struct fields)
    .replace(/\s*bf-p="[^"]*"/g, '')
    // Normalize void element self-closing: <br/> or <br /> → <br>
    .replace(new RegExp(`<(${VOID_ELEMENTS})(\\s[^>]*?)?\\s*/>`, 'g'), '<$1$2>')
    // Remove trailing whitespace before >
    .replace(/\s+>/g, '>')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export function runJSXConformanceTests(options: RunJSXConformanceOptions): void {
  const { createAdapter, render, referenceAdapter, referenceRender, skip = [] } = options
  const skipSet = new Set(skip)

  describe('JSX Conformance Tests', () => {
    for (const fixture of jsxFixtures) {
      if (skipSet.has(fixture.id)) continue

      test(`[${fixture.id}] ${fixture.description}`, async () => {
        const adapter = createAdapter()

        // 1. Render with the adapter under test
        let html: string
        try {
          html = await render({
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
        if (referenceAdapter && referenceRender) {
          const refAdapter = referenceAdapter()
          const refHtml = await referenceRender({
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
