/**
 * Hono Adapter Tests
 *
 * JSX conformance tests (shared across adapters).
 */

import { HonoAdapter } from '../src/adapter'
import { runJSXConformanceTests } from '@barefootjs/adapter-tests'

// =============================================================================
// JSX-Based Conformance Tests
// =============================================================================

runJSXConformanceTests({
  createAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
  // No referenceAdapter: compile + render success only
})
