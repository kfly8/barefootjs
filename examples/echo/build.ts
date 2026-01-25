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
  '../shared/components/TodoItem.tsx',
  '../shared/components/TodoApp.tsx',
  '../shared/components/TodoAppSSR.tsx',
]

// Output directories
const outputDir = resolve(projectRoot, 'dist')
const templatesDir = resolve(outputDir, 'templates')
const clientDir = resolve(outputDir, 'client')

// DOM package path
const domPkgDir = resolve(projectRoot, '../../packages/dom')
const domDistFile = resolve(domPkgDir, 'dist/index.js')

// Create output directories
mkdirSync(templatesDir, { recursive: true })
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

// Create adapter (package name 'main' for direct use in main.go)
const adapter = new GoTemplateAdapter({ packageName: 'main' })

// Collect all types for combined components.go
const allTypeParts: string[] = []

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
        onMounts: ctx.onMounts,
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

    // Collect types for allTypeParts (will be combined later)
    if (output.types) {
      // Extract everything after package declaration and import (keep only types)
      const lines = output.types.split('\n')
      const packageEnd = lines.findIndex(l => l.startsWith('package '))
      if (packageEnd >= 0) {
        // Skip package line, empty line, and import line
        let startLine = packageEnd + 1
        while (startLine < lines.length &&
               (lines[startLine]?.trim() === '' ||
                lines[startLine]?.startsWith('import '))) {
          startLine++
        }
        const typesContent = lines.slice(startLine).join('\n').trim()
        if (typesContent) {
          typeParts.push(typesContent)
          allTypeParts.push(typesContent)
        }
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
          onMounts: ctx.onMounts,
          imports: ctx.imports,
          localFunctions: ctx.localFunctions,
          localConstants: ctx.localConstants,
        },
        root,
        errors: [],
      }

      let clientJs = generateClientJs(ir, allComponentNames)
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

// Write combined components.go with all types
if (allTypeParts.length > 0) {
  console.log('\nGenerating components.go...')

  // Combine all parts and deduplicate
  let combinedContent = allTypeParts.join('\n\n')

  // Deduplicate Input/Props types and NewXxxProps functions (keep the first occurrence)
  const seenDefinitions = new Set<string>()

  // Deduplicate type definitions
  const typeRegex = /\/\/ \w+ is .*\ntype (\w+) struct\s*\{[^}]*\}/g
  combinedContent = combinedContent.replace(typeRegex, (match, typeName) => {
    if (seenDefinitions.has(`type:${typeName}`)) {
      return '' // Remove duplicate
    }
    seenDefinitions.add(`type:${typeName}`)
    return match
  })

  // Deduplicate NewXxxProps functions
  const funcRegex = /\/\/ (New\w+Props) creates .*\nfunc \1\([^)]*\) \w+ \{[\s\S]*?\n\}/g
  combinedContent = combinedContent.replace(funcRegex, (match, funcName) => {
    if (seenDefinitions.has(`func:${funcName}`)) {
      return '' // Remove duplicate
    }
    seenDefinitions.add(`func:${funcName}`)
    return match
  })

  // Clean up multiple empty lines
  combinedContent = combinedContent.replace(/\n{3,}/g, '\n\n').trim()

  // Manual types that cannot be auto-generated from components
  // These are application-specific types used by TodoApp
  const manualTypes = `
// =============================================================================
// Manual Types (application-specific, not generated from components)
// =============================================================================

// Todo represents a single todo item.
type Todo struct {
	ID      int    \`json:"id"\`
	Text    string \`json:"text"\`
	Done    bool   \`json:"done"\`
	Editing bool   \`json:"editing"\`
}
`

  // Post-process: Fix types to use Todo instead of interface{}
  // Order matters: fix individual fields first, then add extra fields to TodoAppProps

  // 1. Fix TodoItemInput: Todo interface{} -> Todo Todo
  combinedContent = combinedContent.replace(
    /(\tTodo) interface\{\}(\n)/g,
    '$1 Todo$2'
  )

  // 2. Fix TodoItemProps: Todo interface{} `json:"todo"` -> Todo Todo `json:"todo"`
  combinedContent = combinedContent.replace(
    /(\tTodo) interface\{\} (`json:"todo"`)/g,
    '$1 Todo $2'
  )

  // 3. Fix TodoAppInput: InitialTodos interface{} -> InitialTodos []Todo
  combinedContent = combinedContent.replace(
    /(InitialTodos) \[\]interface\{\}(\n)/g,
    '$1 []Todo$2'
  )

  // 4. Fix TodoAppProps: InitialTodos []interface{} `json:...` -> InitialTodos []Todo `json:...`
  combinedContent = combinedContent.replace(
    /(InitialTodos) \[\]interface\{\} (`json:"initialTodos"`)/g,
    '$1 []Todo $2'
  )

  // 5. Fix TodoAppProps: Todos []interface{} -> Todos []Todo
  combinedContent = combinedContent.replace(
    /(\tTodos) \[\]interface\{\} (`json:"todos"`)/g,
    '$1 []Todo $2'
  )

  // 6. Add extra fields to TodoAppProps (before closing brace)
  // Find the closing brace of TodoAppProps and insert fields before it
  combinedContent = combinedContent.replace(
    /(type TodoAppProps struct \{[\s\S]*?)(^\})/m,
    `$1	TodoItems    []TodoItemProps  \`json:"-"\`         // For Go template (not in JSON)
	DoneCount    int              \`json:"doneCount"\` // Pre-computed done count
$2`
  )

  // 7. Fix TodoAppSSRProps and TodoAppProps: Filter interface{} -> Filter string
  combinedContent = combinedContent.replace(
    /(Filter) interface\{\} (`json:"filter"`)/g,
    '$1 string $2'
  )

  // 7b. Fix Filter initial value: nil -> ""
  combinedContent = combinedContent.replace(
    /Filter: nil,/g,
    'Filter: "all",'
  )

  // 8. Add extra fields to TodoAppSSRProps (before closing brace)
  combinedContent = combinedContent.replace(
    /(type TodoAppSSRProps struct \{[\s\S]*?)(^\})/m,
    `$1	TodoItems    []TodoItemProps  \`json:"-"\`         // For Go template (not in JSON)
	DoneCount    int              \`json:"doneCount"\` // Pre-computed done count
$2`
  )

  const componentsGoContent = `// Code generated by BarefootJS. DO NOT EDIT.
package main

import "math/rand"

// randomID generates a random string of length n for ScopeID.
func randomID(n int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}
${manualTypes}
${combinedContent}
`
  writeFileSync(resolve(projectRoot, 'components.go'), componentsGoContent)
  console.log('✓ components.go')
}

console.log('\nDone!')
