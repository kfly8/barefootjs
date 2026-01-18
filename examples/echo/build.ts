/**
 * Build script for Go html/template example
 *
 * Compiles JSX components to Go html/template files.
 */

import { analyzeComponent, jsxToIR, generateClientJs, type ComponentIR } from '@barefootjs/jsx'
import { GoTemplateAdapter } from '@barefootjs/go-template'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = import.meta.dirname

// Component files to compile
const components = ['components/Counter.tsx']

// Output directories
const outputDir = resolve(projectRoot, 'dist')
const templatesDir = resolve(outputDir, 'templates')
const typesDir = resolve(outputDir, 'types')
const clientDir = resolve(outputDir, 'client')

// DOM package path
const domPkgDir = resolve(projectRoot, '../../packages/dom')
const domDistFile = resolve(domPkgDir, 'dist/index.js')

// Create output directories
mkdirSync(templatesDir, { recursive: true })
mkdirSync(typesDir, { recursive: true })
mkdirSync(clientDir, { recursive: true })

// Build and copy barefoot.js from @barefootjs/dom
console.log('Preparing @barefootjs/dom runtime...')
if (!existsSync(domDistFile)) {
  console.log('  Building @barefootjs/dom...')
  spawnSync('bun', ['run', 'build'], { cwd: domPkgDir, stdio: 'inherit' })
}
const barefootDest = resolve(clientDir, 'barefoot.js')
copyFileSync(domDistFile, barefootDest)
console.log('  Copied: barefoot.js\n')

// Create adapter
const adapter = new GoTemplateAdapter({ packageName: 'components' })

console.log('Building Go html/template files...\n')

for (const componentPath of components) {
  const fullPath = resolve(projectRoot, componentPath)
  const source = readFileSync(fullPath, 'utf-8')

  // Analyze and transform to IR
  const ctx = analyzeComponent(source, componentPath)
  if (ctx.errors.length > 0) {
    console.error(`Errors compiling ${componentPath}:`)
    for (const error of ctx.errors) {
      console.error(`  ${error.message}`)
    }
    continue
  }

  const root = jsxToIR(ctx)
  if (!root) {
    console.error(`Failed to transform ${componentPath} to IR`)
    continue
  }

  // Build ComponentIR
  const ir: ComponentIR = {
    version: '0.1',
    metadata: {
      componentName: ctx.componentName,
      hasDefaultExport: ctx.hasDefaultExport,
      typeDefinitions: ctx.typeDefinitions,
      propsType: ctx.propsType,
      propsParams: ctx.propsParams,
      restPropsName: ctx.restPropsName,
      signals: ctx.signals,
      memos: ctx.memos,
      effects: ctx.effects,
      imports: ctx.imports,
      localFunctions: ctx.localFunctions,
      localConstants: ctx.localConstants,
    },
    root,
    errors: [],
  }

  // Generate template
  const output = adapter.generate(ir)

  // Write template file
  const templateFileName = componentPath.split('/').pop()?.replace('.tsx', adapter.extension)
  const templatePath = resolve(templatesDir, templateFileName!)
  mkdirSync(dirname(templatePath), { recursive: true })
  writeFileSync(templatePath, output.template)
  console.log(`  Template: ${templateFileName}`)

  // Write types file
  if (output.types) {
    const componentName = componentPath.split('/').pop()?.replace('.tsx', '')
    const typesPath = resolve(typesDir, `${componentName}_types.go`)
    writeFileSync(typesPath, output.types)
    console.log(`  Types:    ${componentName}_types.go`)
  }

  // Generate and write client JS
  let clientJs = generateClientJs(ir)
  if (clientJs) {
    // Replace @barefootjs/dom import with relative path to barefoot.js
    clientJs = clientJs.replace(
      /from ['"]@barefootjs\/dom['"]/g,
      "from './barefoot.js'"
    )

    const componentName = componentPath.split('/').pop()?.replace('.tsx', '')
    const clientPath = resolve(clientDir, `${componentName}.client.js`)
    writeFileSync(clientPath, clientJs)
    console.log(`  Client:   ${componentName}.client.js`)
  }

  console.log(`✓ ${componentPath}`)
}

console.log('\nDone!')
