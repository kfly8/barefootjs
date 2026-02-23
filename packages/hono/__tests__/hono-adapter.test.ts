/**
 * Hono Adapter Tests
 *
 * Conformance tests (shared across adapters).
 */

import { HonoAdapter } from '../src/adapter'
import { runConformanceTests } from '@barefootjs/adapter-tests'

// =============================================================================
// Shared Conformance Tests
// =============================================================================

runConformanceTests({
  createAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
})
