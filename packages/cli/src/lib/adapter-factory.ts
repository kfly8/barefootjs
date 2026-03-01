// Adapter factory: resolve adapter name → TemplateAdapter instance.

import type { TemplateAdapter } from '@barefootjs/jsx'

/**
 * Create a TemplateAdapter from a name string.
 * Supports "hono" and "go-template".
 */
export async function createAdapter(
  name: string,
  options?: Record<string, unknown>
): Promise<TemplateAdapter> {
  switch (name) {
    case 'hono': {
      const { HonoAdapter } = await import('@barefootjs/hono/adapter')
      return new HonoAdapter(options)
    }
    case 'go-template': {
      const { GoTemplateAdapter } = await import('@barefootjs/go-template')
      return new GoTemplateAdapter(options)
    }
    default:
      throw new Error(`Unknown adapter: "${name}". Supported: "hono", "go-template"`)
  }
}
