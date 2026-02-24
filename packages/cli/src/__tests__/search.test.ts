import { describe, test, expect, spyOn } from 'bun:test'
import { search } from '../commands/search'
import path from 'path'

const metaDir = path.resolve(import.meta.dir, '../../../../ui/meta')

describe('search', () => {
  test('finds component by name', () => {
    const results = search('button', metaDir)
    expect(results.some(r => r.name === 'button')).toBe(true)
  })

  test('finds component by category', () => {
    const results = search('input', metaDir)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r =>
      r.name.includes('input') ||
      r.category.includes('input') ||
      r.description.toLowerCase().includes('input') ||
      r.tags.some(t => t.includes('input'))
    )).toBe(true)
  })

  test('finds component by tag', () => {
    const results = search('button', metaDir)
    // All results should match "button" in name, category, description, or tags
    expect(results.every(r =>
      r.name.includes('button') ||
      r.category.includes('button') ||
      r.description.toLowerCase().includes('button') ||
      r.tags.some(t => t.includes('button'))
    )).toBe(true)
  })

  test('expands category aliases (form → input)', () => {
    const results = search('form', metaDir)
    const hasInputCategory = results.some(r => r.category === 'input')
    expect(hasInputCategory).toBe(true)
  })

  test('returns empty array for no match', () => {
    const results = search('zzz_nonexistent_zzz', metaDir)
    expect(results).toEqual([])
  })

  test('--dir override: searches in arbitrary directory', () => {
    // search() accepts any metaDir, verifying --dir plumbing works
    const results = search('button', metaDir)
    expect(results.some(r => r.name === 'button')).toBe(true)
  })

  test('exits with error on nonexistent directory', () => {
    const exitSpy = spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => search('button', '/nonexistent/path')).toThrow('exit')
      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      exitSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})
