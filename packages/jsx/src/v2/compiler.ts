/**
 * BarefootJS Compiler v2 - Main Entry Point
 *
 * Compiles JSX components to Marked Templates + Client JS.
 */

import type {
  ComponentIR,
  IRMetadata,
  CompileOptions,
  CompileResult,
  FileOutput,
} from './types'
import { analyzeComponent } from './analyzer'
import { jsxToIR } from './jsx-to-ir'
import { HonoAdapter } from './adapters/hono'
import { generateClientJs } from './ir-to-client-js'

// =============================================================================
// Main Entry Point
// =============================================================================

export async function compileJSX(
  entryPath: string,
  readFile: (path: string) => Promise<string>,
  options?: CompileOptions
): Promise<CompileResult> {
  const files: FileOutput[] = []
  const errors: CompileResult['errors'] = []

  // Read source file
  const source = await readFile(entryPath)

  // Analyze component
  const ctx = analyzeComponent(source, entryPath)

  // Collect any analysis errors
  errors.push(...ctx.errors)

  // Check if we have JSX to compile
  if (!ctx.jsxReturn) {
    return { files, errors }
  }

  // Generate IR
  const ir = jsxToIR(ctx)
  if (!ir) {
    return { files, errors }
  }

  // Build ComponentIR
  const componentIR: ComponentIR = {
    version: '2.0',
    metadata: buildMetadata(ctx),
    root: ir,
    errors: [],
  }

  // Output IR JSON if requested
  if (options?.outputIR) {
    files.push({
      path: entryPath.replace(/\.tsx?$/, '.ir.json'),
      content: JSON.stringify(componentIR, null, 2),
      type: 'ir',
    })
  }

  // Generate Marked JSX using adapter
  const adapter = new HonoAdapter()
  const adapterOutput = adapter.generate(componentIR)

  files.push({
    path: entryPath.replace(/\.tsx?$/, adapter.extension),
    content: adapterOutput.template,
    type: 'markedJsx',
  })

  // Generate Client JS
  const clientJs = generateClientJs(componentIR)
  if (clientJs) {
    files.push({
      path: entryPath.replace(/\.tsx?$/, '.client.js'),
      content: clientJs,
      type: 'clientJs',
    })
  }

  return { files, errors }
}

// =============================================================================
// Helpers
// =============================================================================

function buildMetadata(
  ctx: ReturnType<typeof analyzeComponent>
): IRMetadata {
  return {
    componentName: ctx.componentName || 'Unknown',
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
  }
}

// =============================================================================
// Sync Version (for compatibility)
// =============================================================================

export function compileJSXSync(
  source: string,
  filePath: string,
  options?: CompileOptions
): CompileResult {
  const files: FileOutput[] = []
  const errors: CompileResult['errors'] = []

  // Analyze component
  const ctx = analyzeComponent(source, filePath)
  errors.push(...ctx.errors)

  if (!ctx.jsxReturn) {
    return { files, errors }
  }

  // Generate IR
  const ir = jsxToIR(ctx)
  if (!ir) {
    return { files, errors }
  }

  // Build ComponentIR
  const componentIR: ComponentIR = {
    version: '2.0',
    metadata: buildMetadata(ctx),
    root: ir,
    errors: [],
  }

  // Output IR JSON if requested
  if (options?.outputIR) {
    files.push({
      path: filePath.replace(/\.tsx?$/, '.ir.json'),
      content: JSON.stringify(componentIR, null, 2),
      type: 'ir',
    })
  }

  // Generate Marked JSX
  const adapter = new HonoAdapter()
  const adapterOutput = adapter.generate(componentIR)

  files.push({
    path: filePath.replace(/\.tsx?$/, adapter.extension),
    content: adapterOutput.template,
    type: 'markedJsx',
  })

  // Generate Client JS
  const clientJs = generateClientJs(componentIR)
  if (clientJs) {
    files.push({
      path: filePath.replace(/\.tsx?$/, '.client.js'),
      content: clientJs,
      type: 'clientJs',
    })
  }

  return { files, errors }
}

// =============================================================================
// Export Types
// =============================================================================

export type { ComponentIR, CompileOptions, CompileResult, FileOutput }
