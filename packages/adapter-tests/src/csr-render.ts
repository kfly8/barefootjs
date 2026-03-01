/**
 * CSR test renderer
 *
 * Compiles JSX source with HonoAdapter, extracts template functions from
 * client JS output, and evaluates them to produce HTML.
 * Used by CSR conformance tests to compare against SSR reference output.
 */

import { compileJSXSync } from '@barefootjs/jsx'
import type { TemplateAdapter } from '@barefootjs/jsx'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const CSR_TEMP_DIR = resolve(import.meta.dir, '../.csr-render-temp')

export interface CsrRenderOptions {
  /** JSX source code */
  source: string
  /** Template adapter to use */
  adapter: TemplateAdapter
  /** Props to inject (optional) */
  props?: Record<string, unknown>
  /** Additional component files (filename → source) */
  components?: Record<string, string>
}

export async function renderCsrComponent(options: CsrRenderOptions): Promise<string> {
  const { source, adapter, props = {}, components } = options

  // Compile child components first and collect their client JS
  const childClientJsList: string[] = []
  const componentKeys = new Set<string>()
  if (components) {
    for (const [filename, childSource] of Object.entries(components)) {
      componentKeys.add(filename)
      const childResult = compileJSXSync(childSource, filename, { adapter })
      const childErrors = childResult.errors.filter(e => e.severity === 'error')
      if (childErrors.length > 0) {
        throw new Error(`Compilation errors in ${filename}:\n${childErrors.map(e => e.message).join('\n')}`)
      }
      const clientJs = childResult.files.find(f => f.type === 'clientJs')
      if (clientJs) {
        childClientJsList.push(clientJs.content)
      }
    }
  }

  // Compile parent source
  const result = compileJSXSync(source, 'component.tsx', { adapter })
  const errors = result.errors.filter(e => e.severity === 'error')
  if (errors.length > 0) {
    throw new Error(`Compilation errors:\n${errors.map(e => e.message).join('\n')}`)
  }

  const clientJsFile = result.files.find(f => f.type === 'clientJs')
  if (!clientJsFile) throw new Error('No client JS in compile output')

  // Build evaluation module
  const allClientJs = [...childClientJsList, clientJsFile.content].join('\n')
  const code = buildCsrEvalModule(allClientJs, props)

  await mkdir(CSR_TEMP_DIR, { recursive: true })
  const tempFile = resolve(
    CSR_TEMP_DIR,
    `csr-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`,
  )
  await Bun.write(tempFile, code)

  try {
    const mod = await import(tempFile)
    return mod.default ?? ''
  } finally {
    await rm(tempFile, { force: true }).catch(() => {})
  }
}

/**
 * Build a self-contained ES module that evaluates CSR template functions.
 *
 * Strategy:
 * 1. Define mock runtime functions (hydrate registers templates, renderChild renders them)
 * 2. Execute client JS code (stripped of imports) which calls hydrate() for each component
 * 3. The last component registered is the main one — evaluate its template with props
 */
function buildCsrEvalModule(clientJs: string, props: Record<string, unknown>): string {
  // Strip ES module import statements (named imports and bare side-effect imports)
  const strippedCode = clientJs
    .replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]*['"];?\s*$/gm, '')

  return `
// --- Mock runtime ---
const __templates = new Map()
let __lastComponent = null

function hydrate(name, def) {
  if (def.template) __templates.set(name, def.template)
  __lastComponent = name
}

function renderChild(name, props, key, suffix) {
  const template = __templates.get(name)
  // Static children (with suffix): use deterministic scope ID matching SSR pattern
  // Loop children (no suffix): use component name + random hash
  const scopeId = suffix
    ? 'test_' + suffix
    : '~' + name + '_' + Math.random().toString(36).slice(2, 8)
  const keyAttr = key !== undefined ? ' data-key="' + key + '"' : ''
  if (!template) return '<div bf-s="' + scopeId + '"' + keyAttr + '>[' + name + ']</div>'
  const html = template(props).trim()
  return html.replace(/^(<\\w+)/, '$1 bf-s="' + scopeId + '"' + keyAttr)
}

// Noop stubs for init-phase functions (not needed for template evaluation)
const $ = () => null
const $t = () => null
const $c = () => null
const createSignal = (v) => [() => v, () => {}]
const createEffect = () => {}
const createMemo = (fn) => fn
const onMount = () => {}
const onCleanup = () => {}
const insert = () => {}
const reconcileElements = () => {}
const reconcileTemplates = () => {}
const updateClientMarker = () => {}
const initChild = () => {}
const createComponent = () => null
const createPortal = () => {}

// --- Execute client JS (registers templates via hydrate()) ---
${strippedCode}

// --- Evaluate main component template ---
const __templateFn = __templates.get(__lastComponent)
let __html = __templateFn ? __templateFn(${JSON.stringify(props)}) : ''
// Inject bf-s="test" on root element to match SSR scope ID convention.
// Insert before bf= marker to match SSR attribute order.
if (__html.match(/^<\\w+[^>]* bf="/)) {
  __html = __html.replace(/ bf="/, ' bf-s="test" bf="')
} else {
  __html = __html.replace(/^(<\\w+)/, '$1 bf-s="test"')
}
export default __html
`
}
