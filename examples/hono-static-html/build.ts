/**
 * BarefootJS + Hono build script
 *
 * Compiles page components and generates:
 * - dist/{Page}.html (static HTML)
 * - dist/{Component}-{hash}.js (client JS)
 * - dist/manifest.json
 * - dist/manifest.d.ts (type definitions)
 */

import { compileJSX } from '../../jsx'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Page components to compile
const PAGES = ['HomePage', 'CounterPage', 'TogglePage', 'TodoPage']

await mkdir(DIST_DIR, { recursive: true })

// Copy barefoot.js
const barefootFileName = 'barefoot.js'
await Bun.write(
  resolve(DIST_DIR, barefootFileName),
  Bun.file(resolve(DOM_DIR, 'runtime.js'))
)
console.log(`Generated: dist/${barefootFileName}`)

// Manifest types
type ManifestEntry = {
  staticHtml: string
  clientJs?: string
  props: string[]
  components?: string[]  // Only for pages: list of component dependencies
}

// Manifest
const manifest: Record<string, ManifestEntry> = {
  '__barefoot__': { staticHtml: '', clientJs: barefootFileName, props: [] }
}

// Compile each page and track dependencies
for (const pageName of PAGES) {
  const entryPath = resolve(ROOT_DIR, `pages/${pageName}.tsx`)
  const result = await compileJSX(entryPath, async (path) => {
    return await Bun.file(path).text()
  })

  // Track non-page component dependencies for this page
  const pageComponents: string[] = []

  for (const component of result.components) {
    // Static HTML
    const htmlFileName = `${component.name}.html`
    await Bun.write(resolve(DIST_DIR, htmlFileName), component.staticHtml)
    console.log(`Generated: dist/${htmlFileName}`)

    // Client JS
    let clientFileName: string | undefined
    if (component.hasClientJs) {
      clientFileName = component.filename
      await Bun.write(resolve(DIST_DIR, clientFileName), component.clientJs)
      console.log(`Generated: dist/${clientFileName}`)
    }

    // Track non-page components as dependencies
    if (!component.name.endsWith('Page')) {
      pageComponents.push(component.name)
    }

    manifest[component.name] = {
      staticHtml: htmlFileName,
      clientJs: clientFileName,
      props: component.props,
    }
  }

  // Add component dependencies to the page entry
  if (manifest[pageName]) {
    manifest[pageName].components = pageComponents
  }
}

// Output manifest
await Bun.write(resolve(DIST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('Generated: dist/manifest.json')

// Generate type definitions
const componentNames = Object.keys(manifest).filter(n => n !== '__barefoot__')
const pageNames = componentNames.filter(n => n.endsWith('Page'))
const pagesWithProps = pageNames.filter(n => manifest[n].props.length > 0)
const pagesWithoutProps = pageNames.filter(n => manifest[n].props.length === 0)

let dts = `/**
 * BarefootJS Page Types (auto-generated)
 */

export type PageName = ${pageNames.map(n => `'${n}'`).join(' | ')}

export type PageProps = {
${pageNames.map(n => {
  const props = manifest[n].props
  if (props.length === 0) {
    return `  ${n}: {}`
  }
  return `  ${n}: { ${props.map(p => `${p}: unknown`).join('; ')} }`
}).join('\n')}
}

// Pages without props
${pagesWithoutProps.map(n =>
  `export declare function renderPage(name: '${n}', title: string): string`
).join('\n')}

// Pages with props
${pagesWithProps.map(n => {
  const props = manifest[n].props
  return `export declare function renderPage(name: '${n}', title: string, props: { ${props.map(p => `${p}: unknown`).join('; ')} }): string`
}).join('\n')}
`

await Bun.write(resolve(DIST_DIR, 'manifest.d.ts'), dts)
console.log('Generated: dist/manifest.d.ts')

console.log('\nBuild complete!')
