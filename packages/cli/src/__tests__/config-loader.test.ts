import { describe, test, expect } from 'bun:test'
import { findBuildConfig, loadBuildConfig } from '../lib/config-loader'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

describe('findBuildConfig', () => {
  test('finds barefoot.config.ts in directory', () => {
    const testDir = resolve(tmpdir(), `bf-test-config-find-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    writeFileSync(resolve(testDir, 'barefoot.config.ts'), 'export default {}')

    const result = findBuildConfig(testDir)
    expect(result).toBe(resolve(testDir, 'barefoot.config.ts'))

    rmSync(testDir, { recursive: true, force: true })
  })

  test('returns null when not found', () => {
    const result = findBuildConfig('/tmp/nonexistent-dir-bf-config-test')
    expect(result).toBeNull()
  })
})

describe('loadBuildConfig', () => {
  test('loads and validates config with adapter', async () => {
    const testDir = resolve(tmpdir(), `bf-test-load-valid-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    writeFileSync(
      resolve(testDir, 'barefoot.config.ts'),
      `export default { adapter: { name: 'test', extension: '.test' }, components: ['src'] }`
    )

    const config = await loadBuildConfig(resolve(testDir, 'barefoot.config.ts'))
    expect(config.adapter.name).toBe('test')
    expect(config.components).toEqual(['src'])

    rmSync(testDir, { recursive: true, force: true })
  })

  test('throws when no default export', async () => {
    const testDir = resolve(tmpdir(), `bf-test-load-nodefault-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    writeFileSync(
      resolve(testDir, 'barefoot.config.ts'),
      `export const foo = 1`
    )

    await expect(loadBuildConfig(resolve(testDir, 'barefoot.config.ts'))).rejects.toThrow('default export')

    rmSync(testDir, { recursive: true, force: true })
  })

  test('throws when adapter is missing', async () => {
    const testDir = resolve(tmpdir(), `bf-test-load-noadapter-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    writeFileSync(
      resolve(testDir, 'barefoot.config.ts'),
      `export default { components: ['src'] }`
    )

    await expect(loadBuildConfig(resolve(testDir, 'barefoot.config.ts'))).rejects.toThrow('adapter')

    rmSync(testDir, { recursive: true, force: true })
  })
})
