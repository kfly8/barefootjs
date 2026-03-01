import { describe, test, expect } from 'bun:test'
import { createAdapter } from '../lib/adapter-factory'

describe('createAdapter', () => {
  test('creates HonoAdapter', async () => {
    const adapter = await createAdapter('hono')
    expect(adapter.name).toBe('hono')
    expect(adapter.extension).toBe('.hono.tsx')
  })

  test('creates GoTemplateAdapter', async () => {
    const adapter = await createAdapter('go-template')
    expect(adapter.name).toBe('go-template')
    expect(adapter.extension).toBe('.tmpl')
  })

  test('throws for unknown adapter', async () => {
    expect(createAdapter('unknown')).rejects.toThrow('Unknown adapter: "unknown"')
  })
})
