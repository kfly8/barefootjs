/**
 * Adapter Conformance Test Suite — Structural Assertion Checker
 *
 * Validates adapter output against adapter-independent structural assertions.
 */

import type { StructuralAssertion, ExpectedOutput } from './types'

export function checkStructuralAssertions(output: string, assertions: StructuralAssertion[]): string[] {
  const failures: string[] = []

  for (const assertion of assertions) {
    switch (assertion.type) {
      case 'contains-text':
        if (!output.includes(assertion.text)) {
          failures.push(`Expected output to contain "${assertion.text}"`)
        }
        break
      case 'not-contains-text':
        if (output.includes(assertion.text)) {
          failures.push(`Expected output NOT to contain "${assertion.text}"`)
        }
        break
      case 'contains-tag':
        if (!output.includes(`<${assertion.tag}`) && !output.includes(`<${assertion.tag}>`)) {
          failures.push(`Expected output to contain <${assertion.tag}> tag`)
        }
        break
      case 'has-scope-marker':
        if (!output.includes('bf-s=')) {
          failures.push('Expected output to contain scope marker (bf-s=)')
        }
        break
      case 'has-slot-marker':
        if (!output.includes(`bf="${assertion.slotId}"`) && !output.includes(`bf={${JSON.stringify(assertion.slotId)}}`)) {
          failures.push(`Expected output to contain slot marker for "${assertion.slotId}"`)
        }
        break
      case 'output-not-empty':
        if (output.trim() === '') {
          failures.push('Expected output to be non-empty')
        }
        break
      case 'output-empty':
        if (output.trim() !== '') {
          failures.push(`Expected output to be empty, got: "${output}"`)
        }
        break
    }
  }

  return failures
}

export function checkExpectedOutput(output: string, expected: ExpectedOutput): string[] {
  const failures: string[] = []

  if (expected.template !== undefined) {
    if (output !== expected.template) {
      failures.push(`Expected exact match:\n  expected: ${JSON.stringify(expected.template)}\n  actual:   ${JSON.stringify(output)}`)
    }
  }

  if (expected.contains) {
    for (const text of expected.contains) {
      if (!output.includes(text)) {
        failures.push(`Expected output to contain: "${text}"\n  actual: ${JSON.stringify(output)}`)
      }
    }
  }

  if (expected.notContains) {
    for (const text of expected.notContains) {
      if (output.includes(text)) {
        failures.push(`Expected output NOT to contain: "${text}"\n  actual: ${JSON.stringify(output)}`)
      }
    }
  }

  return failures
}
