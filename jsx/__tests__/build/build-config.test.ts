/**
 * Build configuration tests
 * 
 * Verify that the configuration-based build system works correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { build, loadBuildConfig } from '../../build-runner'
import { resolve } from 'node:path'
import { rm, mkdir } from 'node:fs/promises'

const EXAMPLES_DIR = resolve(import.meta.dir, '../../../examples')
const TEST_TMP_DIR = resolve('/tmp/barefoot-build-test')

describe('loadBuildConfig', () => {
  it('loads static build config for counter', async () => {
    const configPath = resolve(EXAMPLES_DIR, 'counter/barefoot.config.json')
    const config = await loadBuildConfig(configPath)
    
    expect(config.mode).toBe('static')
    expect(config.rootDir).toContain('examples/counter')
    expect(config.distDir).toContain('dist')
    
    if (config.mode === 'static') {
      expect(config.entry).toBe('index.tsx')
      expect(config.template).toBe('template.html')
      expect(config.title).toBe('BarefootJS Counter')
    }
  })
  
  it('loads static build config for todo', async () => {
    const configPath = resolve(EXAMPLES_DIR, 'todo/barefoot.config.json')
    const config = await loadBuildConfig(configPath)
    
    expect(config.mode).toBe('static')
    
    if (config.mode === 'static') {
      expect(config.entry).toBe('index.tsx')
      expect(config.template).toBe('template.html')
      expect(config.title).toBe('BarefootJS Todo')
    }
  })
  
  it('loads server build config for hono', async () => {
    const configPath = resolve(EXAMPLES_DIR, 'hono/barefoot.config.json')
    const config = await loadBuildConfig(configPath)
    
    expect(config.mode).toBe('server')
    
    if (config.mode === 'server') {
      expect(config.components).toEqual(['Counter', 'Toggle'])
    }
  })
})

describe('build - counter example', () => {
  const testDir = resolve(TEST_TMP_DIR, 'counter')
  const configPath = resolve(testDir, 'barefoot.config.json')
  
  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true })
    
    // Copy counter example files
    const counterDir = resolve(EXAMPLES_DIR, 'counter')
    await Bun.write(
      resolve(testDir, 'barefoot.config.json'),
      Bun.file(resolve(counterDir, 'barefoot.config.json'))
    )
    await Bun.write(
      resolve(testDir, 'index.tsx'),
      Bun.file(resolve(counterDir, 'index.tsx'))
    )
    await Bun.write(
      resolve(testDir, 'Counter.tsx'),
      Bun.file(resolve(counterDir, 'Counter.tsx'))
    )
    await Bun.write(
      resolve(testDir, 'template.html'),
      Bun.file(resolve(counterDir, 'template.html'))
    )
  })
  
  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })
  
  it('builds successfully', async () => {
    await build(configPath)
    
    const distDir = resolve(testDir, 'dist')
    
    // Check that files were generated
    const indexHtml = await Bun.file(resolve(distDir, 'index.html')).text()
    expect(indexHtml).toContain('BarefootJS Counter')
    expect(indexHtml).toContain('<script type="module"')
    
    const barefootJs = await Bun.file(resolve(distDir, 'barefoot.js')).text()
    expect(barefootJs).toContain('createSignal')
    
    // Check that component files exist
    const files = await Array.fromAsync(
      new Bun.Glob('*.js').scan({ cwd: distDir })
    )
    expect(files.length).toBeGreaterThan(0)
  })
})

describe('build - hono example', () => {
  const testDir = resolve(TEST_TMP_DIR, 'hono')
  const configPath = resolve(testDir, 'barefoot.config.json')
  
  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true })
    
    // Copy hono example files
    const honoDir = resolve(EXAMPLES_DIR, 'hono')
    await Bun.write(
      resolve(testDir, 'barefoot.config.json'),
      Bun.file(resolve(honoDir, 'barefoot.config.json'))
    )
    await Bun.write(
      resolve(testDir, 'Counter.tsx'),
      Bun.file(resolve(honoDir, 'Counter.tsx'))
    )
    await Bun.write(
      resolve(testDir, 'Toggle.tsx'),
      Bun.file(resolve(honoDir, 'Toggle.tsx'))
    )
  })
  
  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })
  
  it('builds successfully', async () => {
    await build(configPath)
    
    const distDir = resolve(testDir, 'dist')
    
    // Check that manifest was generated
    const manifest = await Bun.file(resolve(distDir, 'manifest.json')).json()
    expect(manifest).toHaveProperty('__barefoot__')
    expect(manifest).toHaveProperty('Counter')
    expect(manifest).toHaveProperty('Toggle')
    
    // Check that server components were generated
    const counterTsx = await Bun.file(resolve(distDir, 'Counter.tsx')).text()
    expect(counterTsx).toContain('export')
    
    const toggleTsx = await Bun.file(resolve(distDir, 'Toggle.tsx')).text()
    expect(toggleTsx).toContain('export')
  })
})
