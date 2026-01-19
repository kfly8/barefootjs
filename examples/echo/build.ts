/**
 * Build script for Go html/template example
 *
 * Compiles JSX components to Go html/template files.
 */

import { analyzeComponent, listExportedComponents, jsxToIR, generateClientJs, type ComponentIR } from '@barefootjs/jsx'
import { GoTemplateAdapter } from '@barefootjs/go-template'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = import.meta.dirname

// Component files to compile (from shared directory)
const components = [
  '../shared/components/Counter.tsx',
  '../shared/components/Toggle.tsx',
  '../shared/components/FizzBuzzCounter.tsx',
  '../shared/components/Dashboard.tsx',
  '../shared/components/TodoItem.tsx',
  '../shared/components/AddTodoForm.tsx',
  '../shared/components/TodoApp.tsx',
]

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

  // Find all component functions in the file
  const allComponentNames = listExportedComponents(source, componentPath)

  // Generate templates for all components in the file
  const templateParts: string[] = []
  const typeParts: string[] = []
  let mainComponentIR: ComponentIR | null = null

  for (const targetComponentName of allComponentNames) {
    // Analyze each component
    const ctx = analyzeComponent(source, componentPath, targetComponentName)
    if (ctx.errors.length > 0) {
      console.error(`Errors compiling ${targetComponentName} in ${componentPath}:`)
      for (const error of ctx.errors) {
        console.error(`  ${error.message}`)
      }
      continue
    }

    const root = jsxToIR(ctx)
    if (!root) {
      console.error(`Failed to transform ${targetComponentName} to IR`)
      continue
    }

    // Build ComponentIR
    const ir: ComponentIR = {
      version: '0.1',
      metadata: {
        componentName: ctx.componentName!,
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
    templateParts.push(output.template)

    // Collect types
    if (output.types) {
      // Extract just the struct definition (skip package declaration for non-first)
      const lines = output.types.split('\n')
      const structStart = lines.findIndex(l => l.startsWith('type '))
      if (structStart >= 0) {
        typeParts.push(lines.slice(structStart).join('\n'))
      }
    }

    // Keep track of the main (default exported) component for client JS
    if (ctx.hasDefaultExport) {
      mainComponentIR = ir
    }
  }

  if (templateParts.length === 0) {
    console.error(`No components found in ${componentPath}`)
    continue
  }

  // Write combined template file
  const templateFileName = componentPath.split('/').pop()?.replace('.tsx', adapter.extension)
  const templatePath = resolve(templatesDir, templateFileName!)
  mkdirSync(dirname(templatePath), { recursive: true })
  writeFileSync(templatePath, templateParts.join('\n'))
  console.log(`  Template: ${templateFileName}`)

  // Write combined types file
  if (typeParts.length > 0) {
    const componentName = componentPath.split('/').pop()?.replace('.tsx', '')
    const typesPath = resolve(typesDir, `${componentName}_types.go`)
    const typesContent = `package ${adapter['options'].packageName}\n\n${typeParts.join('\n\n')}`
    writeFileSync(typesPath, typesContent)
    console.log(`  Types:    ${componentName}_types.go`)
  }

  // Generate client JS for the main component (default export) and any local components
  if (mainComponentIR) {
    // Combine all component client JS into one file
    const clientJsParts: string[] = []
    let importStatement = ''

    for (const targetComponentName of allComponentNames) {
      const ctx = analyzeComponent(source, componentPath, targetComponentName)
      if (ctx.errors.length > 0) continue

      const root = jsxToIR(ctx)
      if (!root) continue

      const ir: ComponentIR = {
        version: '0.1',
        metadata: {
          componentName: ctx.componentName!,
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

      let clientJs = generateClientJs(ir)
      if (clientJs) {
        // Replace @barefootjs/dom import with relative path to barefoot.js
        clientJs = clientJs.replace(
          /from ['"]@barefootjs\/dom['"]/g,
          "from './barefoot.js'"
        )

        // Extract import statement from first component
        const importMatch = clientJs.match(/^import .* from '\.\/barefoot\.js'\n\n?/)
        if (importMatch && !importStatement) {
          importStatement = importMatch[0]
        }

        // Remove import statement (will add it once at the beginning)
        const withoutImport = clientJs.replace(/^import .* from '\.\/barefoot\.js'\n\n?/, '')
        clientJsParts.push(withoutImport)
      }
    }

    if (clientJsParts.length > 0) {
      const componentName = componentPath.split('/').pop()?.replace('.tsx', '')
      const clientPath = resolve(clientDir, `${componentName}.client.js`)
      writeFileSync(clientPath, importStatement + clientJsParts.join('\n'))
      console.log(`  Client:   ${componentName}.client.js`)
    }
  }

  console.log(`✓ ${componentPath}`)
}

console.log('\nDone!')
