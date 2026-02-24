/**
 * Hono test renderer
 *
 * Compiles JSX source with HonoAdapter and renders to HTML via Hono's app.request().
 * Used by adapter-tests conformance runner.
 */

import { compileJSXSync } from '@barefootjs/jsx'
import type { TemplateAdapter } from '@barefootjs/jsx'
import { Hono } from 'hono'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

// Place temp files inside the hono package so hono/jsx resolves correctly
const RENDER_TEMP_DIR = resolve(import.meta.dir, '../.render-temp')

export interface RenderOptions {
  /** JSX source code */
  source: string
  /** Template adapter to use */
  adapter: TemplateAdapter
  /** Props to inject (optional) */
  props?: Record<string, unknown>
}

export async function renderHonoComponent(options: RenderOptions): Promise<string> {
  const { source, adapter, props } = options

  // Compile JSX → marked template
  const result = compileJSXSync(source, 'component.tsx', { adapter })

  const errors = result.errors.filter(e => e.severity === 'error')
  if (errors.length > 0) {
    throw new Error(`Compilation errors:\n${errors.map(e => e.message).join('\n')}`)
  }

  const templateFile = result.files.find(f => f.type === 'markedTemplate')
  if (!templateFile) throw new Error('No marked template in compile output')

  // Add JSX pragma for Bun to use Hono's JSX runtime
  const code = `/** @jsxImportSource hono/jsx */\n${templateFile.content}`

  await mkdir(RENDER_TEMP_DIR, { recursive: true })
  // Unique filename per render to avoid Bun's process-level module cache
  // (bun#12371: re-importing the same path returns stale module)
  const tempFile = resolve(
    RENDER_TEMP_DIR,
    `render-${Date.now()}-${Math.random().toString(36).slice(2)}.tsx`,
  )
  await Bun.write(tempFile, code)

  try {
    const mod = await import(tempFile)

    // Find the exported component function
    const componentName = Object.keys(mod).find(k => typeof mod[k] === 'function')
    if (!componentName) throw new Error('No component function found in compiled module')

    const Component = mod[componentName]

    // Render using Hono's app.request()
    const app = new Hono()
    app.get('/', (c) =>
      c.html(Component({ __instanceId: 'test', __bfChild: false, ...props })),
    )

    const res = await app.request('/')
    return await res.text()
  } finally {
    await rm(tempFile, { force: true }).catch(() => {})
  }
}
