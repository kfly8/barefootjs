/**
 * Adapter Conformance Test Suite — Test Runner
 *
 * Runs conformance test cases against a TemplateAdapter implementation.
 * Uses bun:test for test registration and assertion.
 */

import { describe, test, expect } from 'bun:test'
import type { TemplateAdapter, ComponentIR, IRElement, IRExpression, IRConditional, IRLoop, IRComponent } from '@barefootjs/jsx'
import { loadTestCases } from './loader'
import { checkStructuralAssertions, checkExpectedOutput } from './assertions'
import type { ConformanceTestCase } from './types'

export interface RunConformanceOptions {
  /** Test case IDs to skip */
  skip?: string[]
  /** Factory to create a fresh adapter instance per test */
  createAdapter: () => TemplateAdapter
}

/**
 * Run all conformance test cases against the given adapter.
 * Creates a fresh adapter instance per test to avoid state leakage.
 *
 * Registers one test per case grouped by category for clear reporting.
 */
export function runConformanceTests(options: RunConformanceOptions): void {
  const { skip = [], createAdapter } = options
  const skipSet = new Set(skip)

  // bun:test requires synchronous describe/test registration,
  // so we use a single async test that loads and runs all cases.
  // Each case failure is reported with its ID for easy identification.
  describe('Adapter Conformance Tests', () => {
    test('all conformance cases pass', async () => {
      const cases = await loadTestCases()
      expect(cases.length).toBeGreaterThan(0)

      const adapterName = createAdapter().name
      const failures: string[] = []

      for (const testCase of cases) {
        if (skipSet.has(testCase.id)) continue

        const adapter = createAdapter()
        let output: string

        try {
          output = executeTestCase(adapter, testCase)
        } catch (err) {
          failures.push(`[${testCase.id}] Error: ${err}`)
          continue
        }

        // Check structural assertions
        if (testCase.assertions) {
          const assertionFailures = checkStructuralAssertions(output, testCase.assertions)
          for (const f of assertionFailures) {
            failures.push(`[${testCase.id}] Structural: ${f}`)
          }
        }

        // Check adapter-specific expected output
        const expected = testCase.expected?.[adapterName]
        if (expected) {
          const expectedFailures = checkExpectedOutput(output, expected)
          for (const f of expectedFailures) {
            failures.push(`[${testCase.id}] Expected: ${f}`)
          }
        }
      }

      if (failures.length > 0) {
        throw new Error(`${failures.length} conformance test failure(s):\n${failures.join('\n')}`)
      }
    })
  })
}

function executeTestCase(adapter: TemplateAdapter, testCase: ConformanceTestCase): string {
  if (testCase.level === 'generate') {
    const result = adapter.generate(testCase.input as unknown as ComponentIR)
    return result.template
  }

  switch (testCase.method) {
    case 'renderElement':
      return adapter.renderElement(testCase.input as unknown as IRElement)
    case 'renderExpression':
      return adapter.renderExpression(testCase.input as unknown as IRExpression)
    case 'renderConditional':
      return adapter.renderConditional(testCase.input as unknown as IRConditional)
    case 'renderLoop':
      return adapter.renderLoop(testCase.input as unknown as IRLoop)
    case 'renderComponent':
      return adapter.renderComponent(testCase.input as unknown as IRComponent)
    default:
      throw new Error(`Unknown method: ${testCase.method}`)
  }
}
