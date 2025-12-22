/**
 * Counter build script
 */

import { compileJSX, honoServerAdapter } from '../../jsx'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT_DIR = dirname(import.meta.path)
const DIST_DIR = resolve(ROOT_DIR, 'dist')
const DOM_DIR = resolve(ROOT_DIR, '../../dom')

// Create dist/ directory
await mkdir(DIST_DIR, { recursive: true })

// Compile
const entryPath = resolve(ROOT_DIR, 'index.tsx')
const result = await compileJSX(entryPath, async (path) => {
  return await Bun.file(path).text()
}, { serverAdapter: honoServerAdapter })

// Output component JS (with hash)
const scriptTags: string[] = []

for (const component of result.components) {
  await Bun.write(resolve(DIST_DIR, component.filename), component.clientJs)
  scriptTags.push(`<script type="module" src="./${component.filename}"></script>`)
  console.log(`Generated: dist/${component.filename}`)
}

// Load template and generate HTML
const template = await Bun.file(resolve(ROOT_DIR, 'template.html')).text()
const html = template
  .replace('{{title}}', 'BarefootJS Counter')
  .replace('{{content}}', result.html)
  .replace('{{scripts}}', scriptTags.join('\n  '))

await Bun.write(resolve(DIST_DIR, 'index.html'), html)
console.log('Generated: dist/index.html')

// Copy barefoot.js
await Bun.write(
  resolve(DIST_DIR, 'barefoot.js'),
  Bun.file(resolve(DOM_DIR, 'runtime.js'))
)
console.log('Copied: dist/barefoot.js')
