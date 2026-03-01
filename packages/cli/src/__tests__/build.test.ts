import { describe, test, expect } from 'bun:test'
import {
  hasUseClientDirective,
  discoverComponentFiles,
  generateHash,
  addScriptCollection,
  resolveBuildConfig,
} from '../lib/build'
import type { BuildSection } from '../context'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

// ── hasUseClientDirective ────────────────────────────────────────────────

describe('hasUseClientDirective', () => {
  test('detects double-quoted directive', () => {
    expect(hasUseClientDirective('"use client"\n\nimport ...')).toBe(true)
  })

  test('detects single-quoted directive', () => {
    expect(hasUseClientDirective("'use client'\n\nimport ...")).toBe(true)
  })

  test('detects directive after block comment', () => {
    expect(hasUseClientDirective('/* license */\n"use client"')).toBe(true)
  })

  test('detects directive after line comments', () => {
    expect(hasUseClientDirective('// comment\n"use client"')).toBe(true)
  })

  test('detects directive with leading whitespace', () => {
    expect(hasUseClientDirective('  \n  "use client"')).toBe(true)
  })

  test('returns false for missing directive', () => {
    expect(hasUseClientDirective('import { foo } from "bar"')).toBe(false)
  })

  test('returns false for directive in wrong position', () => {
    expect(hasUseClientDirective('import { foo } from "bar"\n"use client"')).toBe(false)
  })

  test('returns false for empty file', () => {
    expect(hasUseClientDirective('')).toBe(false)
  })
})

// ── discoverComponentFiles ───────────────────────────────────────────────

describe('discoverComponentFiles', () => {
  const testDir = resolve(tmpdir(), `bf-test-discover-${Date.now()}`)

  test('discovers .tsx files recursively', async () => {
    mkdirSync(resolve(testDir, 'sub'), { recursive: true })
    writeFileSync(resolve(testDir, 'Button.tsx'), '"use client"')
    writeFileSync(resolve(testDir, 'sub/Input.tsx'), '"use client"')
    writeFileSync(resolve(testDir, 'Button.test.tsx'), 'test')
    writeFileSync(resolve(testDir, 'Button.preview.tsx'), 'preview')
    writeFileSync(resolve(testDir, 'styles.css'), 'css')

    const files = await discoverComponentFiles(testDir)
    const names = files.map(f => f.split('/').pop())

    expect(names).toContain('Button.tsx')
    expect(names).toContain('Input.tsx')
    expect(names).not.toContain('Button.test.tsx')
    expect(names).not.toContain('Button.preview.tsx')
    expect(names).not.toContain('styles.css')

    rmSync(testDir, { recursive: true, force: true })
  })

  test('returns empty array for non-existent directory', async () => {
    const files = await discoverComponentFiles('/tmp/nonexistent-dir-bf-test')
    expect(files).toEqual([])
  })
})

// ── generateHash ─────────────────────────────────────────────────────────

describe('generateHash', () => {
  test('returns a hex string', () => {
    const hash = generateHash('hello world')
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  test('returns 8 characters', () => {
    expect(generateHash('test content')).toHaveLength(8)
  })

  test('same input produces same hash', () => {
    expect(generateHash('foo')).toBe(generateHash('foo'))
  })

  test('different input produces different hash', () => {
    expect(generateHash('foo')).not.toBe(generateHash('bar'))
  })
})

// ── addScriptCollection ──────────────────────────────────────────────────

describe('addScriptCollection', () => {
  test('injects imports and script collector into exported function', () => {
    const input = `import { jsx } from 'hono/jsx'

export function Counter(props: CounterProps) {
  return (<div>hello</div>)
}`

    const result = addScriptCollection(input, 'Counter', 'Counter.client.js')

    expect(result).toContain("import { useRequestContext } from 'hono/jsx-renderer'")
    expect(result).toContain("import { Fragment } from 'hono/jsx'")
    expect(result).toContain('__bfWrap')
    expect(result).toContain('bfCollectedScripts')
    expect(result).toContain("'Counter'")
    expect(result).toContain('Counter.client.js')
  })

  test('preserves content when no import match', () => {
    const input = 'const x = 1'
    // Should not throw, returns unchanged or minimally modified
    const result = addScriptCollection(input, 'Test', 'Test.client.js')
    expect(result).toBeDefined()
  })
})

// ── resolveBuildConfig ───────────────────────────────────────────────────

describe('resolveBuildConfig', () => {
  const projectDir = '/test/project'

  test('resolves defaults for hono adapter', () => {
    const section: BuildSection = { adapter: 'hono' }
    const config = resolveBuildConfig(projectDir, section)

    expect(config.adapter).toBe('hono')
    expect(config.componentDirs).toEqual(['/test/project/components'])
    expect(config.outDir).toBe('/test/project/dist')
    expect(config.minify).toBe(false)
    expect(config.contentHash).toBe(false)
    expect(config.scriptCollection).toBe(true) // default true for hono
    expect(config.clientOnly).toBe(false)
  })

  test('resolves defaults for go-template adapter', () => {
    const section: BuildSection = { adapter: 'go-template' }
    const config = resolveBuildConfig(projectDir, section)

    expect(config.scriptCollection).toBe(false) // default false for non-hono
    expect(config.clientOnly).toBe(false)
  })

  test('resolves clientOnly option', () => {
    const section: BuildSection = { adapter: 'hono', clientOnly: true }
    const config = resolveBuildConfig(projectDir, section)

    expect(config.clientOnly).toBe(true)
    expect(config.scriptCollection).toBe(true) // still defaults for hono
  })

  test('applies overrides', () => {
    const section: BuildSection = {
      adapter: 'hono',
      minify: false,
    }
    const config = resolveBuildConfig(projectDir, section, { minify: true })

    expect(config.minify).toBe(true)
  })

  test('resolves custom component dirs', () => {
    const section: BuildSection = {
      adapter: 'hono',
      components: ['src/components', '../shared'],
    }
    const config = resolveBuildConfig(projectDir, section)

    expect(config.componentDirs).toEqual([
      '/test/project/src/components',
      '/test/shared',
    ])
  })

  test('resolves custom outDir', () => {
    const section: BuildSection = {
      adapter: 'hono',
      outDir: 'build/output',
    }
    const config = resolveBuildConfig(projectDir, section)

    expect(config.outDir).toBe('/test/project/build/output')
  })
})
