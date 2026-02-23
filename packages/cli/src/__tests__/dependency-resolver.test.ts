import { describe, test, expect } from 'bun:test'
import { resolveDependencies } from '../lib/dependency-resolver'
import path from 'path'

const metaDir = path.resolve(import.meta.dir, '../../../../ui/meta')

describe('resolveDependencies', () => {
  test('button → [button, slot] (resolves internal dependency)', () => {
    const result = resolveDependencies(['button'], metaDir)
    expect(result).toEqual(['button', 'slot'])
  })

  test('checkbox → [checkbox] (no internal dependencies)', () => {
    const result = resolveDependencies(['checkbox'], metaDir)
    expect(result).toEqual(['checkbox'])
  })

  test('button + checkbox → [button, checkbox, slot] (deduplication)', () => {
    const result = resolveDependencies(['button', 'checkbox'], metaDir)
    expect(result).toEqual(['button', 'checkbox', 'slot'])
  })

  test('returns sorted results', () => {
    const result = resolveDependencies(['slot', 'button'], metaDir)
    expect(result).toEqual(['button', 'slot'])
  })

  test('skips unknown components gracefully', () => {
    const result = resolveDependencies(['nonexistent'], metaDir)
    expect(result).toEqual(['nonexistent'])
  })

  test('handles empty input', () => {
    const result = resolveDependencies([], metaDir)
    expect(result).toEqual([])
  })
})
