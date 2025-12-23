/**
 * JSX Compiler Test Helper Functions
 *
 * Provides common setup and utilities for tests.
 */

import { compileJSX } from '../../jsx-compiler'
import { testServerAdapter } from '../../adapters/test'

/**
 * Compiles a single component
 *
 * @param source - JSX source code
 * @returns Compilation result
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
export async function compile(source: string) {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  return compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testServerAdapter })
}

/**
 * Compiles components with multiple files
 *
 * @param entryPath - Entry point path
 * @param files - Map of file paths to source code
 * @returns Compilation result
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
) {
  return compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: testServerAdapter })
}
