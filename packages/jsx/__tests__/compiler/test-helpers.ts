/**
 * JSX Compiler Test Helper Functions
 *
 * Provides common setup and utilities for tests.
 */

import { compileJSX, type CompileJSXResult } from '../../src/jsx-compiler'
import { testJsxAdapter } from '../../src/adapters/testing'
import type { PropWithType } from '../../src/types'

/**
 * Component-like interface for backward compatibility with tests
 * that use result.components[]
 */
export interface ComponentLike {
  name: string
  clientJs: string
  serverJsx: string
  hasClientJs: boolean
  props: PropWithType[]
  hash: string
  filename: string
  sourcePath: string
}

/**
 * Result type with backward-compatible components array
 */
export interface CompileResultWithComponents extends CompileJSXResult {
  components: ComponentLike[]
}

/**
 * Converts file-based output to component-like array for backward compatibility
 */
function toComponentsArray(result: CompileJSXResult): ComponentLike[] {
  const components: ComponentLike[] = []
  for (const file of result.files) {
    for (const compName of file.componentNames) {
      components.push({
        name: compName,
        clientJs: file.clientJs,
        serverJsx: file.serverJsx,
        hasClientJs: file.hasClientJs,
        props: file.componentProps[compName] || [],
        hash: file.hash,
        filename: file.clientJsFilename,
        sourcePath: file.sourcePath,
      })
    }
  }
  return components
}

/**
 * Compiles a single component
 *
 * @param source - JSX source code
 * @returns Compilation result with backward-compatible components array
 *
 * @example
 * ```typescript
 * const result = await compile(`
 *   import { signal } from 'barefoot'
 *   function Counter() {
 *     const [count, setCount] = signal(0)
 *     return <p>{count()}</p>
 *   }
 * `)
 * expect(result.components[0].clientJs).toContain('signal(0)')
 * ```
 */
export async function compile(source: string): Promise<CompileResultWithComponents> {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  const result = await compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testJsxAdapter })

  return {
    ...result,
    components: toComponentsArray(result),
  }
}

/**
 * Compiles components with multiple files
 *
 * @param entryPath - Entry point path
 * @param files - Map of file paths to source code
 * @returns Compilation result with backward-compatible components array
 *
 * @example
 * ```typescript
 * const result = await compileWithFiles('/test/App.tsx', {
 *   '/test/App.tsx': `
 *     import Counter from './Counter'
 *     function App() { return <Counter /> }
 *   `,
 *   '/test/Counter.tsx': `
 *     import { signal } from 'barefoot'
 *     function Counter() { ... }
 *   `,
 * })
 * ```
 */
export async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
): Promise<CompileResultWithComponents> {
  const result = await compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testJsxAdapter })

  return {
    ...result,
    components: toComponentsArray(result),
  }
}
