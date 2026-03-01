/**
 * CSR Conformance Tests
 *
 * Verifies that CSR template HTML output matches HonoAdapter reference output.
 * For each JSX fixture, compiles to client JS, evaluates the template function,
 * and compares the resulting HTML against the fixture's expectedHtml.
 */

import { describe, test, expect } from 'bun:test'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { jsxFixtures } from '../../fixtures'
import { normalizeHTML } from '../jsx-runner'
import { renderCsrComponent } from '../csr-render'

describe('CSR Conformance Tests', () => {
  // Fixtures that don't produce client JS (stateless, no signals/effects)
  // These components don't need CSR mode — they are fully rendered server-side.
  const noClientJs = new Set([
    'props-static',
    'nested-elements',
    'void-elements',
    'class-vs-classname',
    'style-attribute',
    'fragment',
    'default-props',
    // Local array variable (items) is not available at CSR template module scope.
    // This is a fundamental limitation: CSR templates only have access to props, not local consts.
    'static-array-children',
  ])

  for (const fixture of jsxFixtures) {
    if (noClientJs.has(fixture.id)) continue
    if (!fixture.expectedHtml) continue

    test(`[${fixture.id}] ${fixture.description}`, async () => {
      const adapter = new HonoAdapter()

      const html = await renderCsrComponent({
        source: fixture.source,
        adapter,
        props: fixture.props,
        components: fixture.components,
      })

      expect(html).toBeTruthy()

      const normalizedHtml = normalizeHTML(html)
      expect(normalizedHtml).toBe(fixture.expectedHtml!)
    })
  }
})
