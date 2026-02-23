/**
 * Adapter Conformance Test Suite — Structural Assertion Checker
 *
 * Validates adapter output against adapter-independent structural assertions.
 */

import type { StructuralAssertion } from './types'

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
      case 'no-self-closing-tag':
        if (output.includes(`</${assertion.tag}>`)) {
          failures.push(`Expected output NOT to contain closing tag </${assertion.tag}>`)
        }
        break
      case 'attr-name-normalized':
        if (output.includes(assertion.from)) {
          failures.push(`Expected attribute "${assertion.from}" to be normalized to "${assertion.to}", but "${assertion.from}" still appears in output`)
        }
        if (!output.includes(assertion.to)) {
          failures.push(`Expected output to contain normalized attribute "${assertion.to}"`)
        }
        break
    }
  }

  return failures
}
