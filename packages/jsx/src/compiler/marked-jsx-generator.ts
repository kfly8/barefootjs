/**
 * Marked JSX Generator
 *
 * Generates Marked JSX (server-side JSX with hydration markers) for file-based output.
 * Collects component data and delegates to the server adapter.
 */

import type { CompileOptions, MarkedJsxComponentData } from '../types'
import type { ComponentData } from './file-grouping'
import { irToMarkedJsx } from '../transformers/ir-to-marked-jsx'
import { collectAllChildComponentNames } from '../transformers/ir-to-client-js'
import { calculateElementPaths } from '../utils/element-paths'

/**
 * Generate combined Marked JSX for a file
 */
export function generateFileMarkedJsx(
  fileComponents: ComponentData[],
  sourcePath: string,
  options?: CompileOptions
): string {
  // Only generate if adapter supports file-based generation
  if (!options?.markedJsxAdapter?.generateMarkedJsxFile) {
    return ''
  }

  // Collect component data for Marked JSX file generation
  const markedJsxComponents: MarkedJsxComponentData[] = fileComponents
    .filter(c => c.result.ir)
    .map(c => {
      const paths = calculateElementPaths(c.result.ir!)
      const needsDataBfIds = new Set([
        ...paths.filter(p => p.path === null).map(p => p.id),
        ...c.result.dynamicElements.map(el => el.id),
      ])
      const jsx = irToMarkedJsx(
        c.result.ir!,
        c.name,
        c.result.signals,
        needsDataBfIds,
        { outputEventAttrs: true, memos: c.result.memos, props: c.result.props }
      )
      const childComponents = collectAllChildComponentNames(c.result.ir!)

      return {
        name: c.name,
        props: c.result.props,
        propsTypeRefName: c.result.propsTypeRefName,
        restPropsName: c.result.restPropsName,
        typeDefinitions: c.result.typeDefinitions,
        jsx,
        ir: c.result.ir,
        signals: c.result.signals,
        memos: c.result.memos,
        childComponents,
        localVariables: c.result.localVariables,
        isDefaultExport: c.result.isDefaultExport,
      }
    })

  // Collect all module constants (deduplicated)
  const allModuleConstants = fileComponents.flatMap(c => c.result.moduleConstants)
  const uniqueModuleConstants = allModuleConstants.filter((c, i, arr) =>
    arr.findIndex(x => x.name === c.name) === i
  )

  // Collect all module functions (deduplicated)
  const allModuleFunctions = fileComponents.flatMap(c => c.result.moduleFunctions)
  const uniqueModuleFunctions = allModuleFunctions.filter((fn, i, arr) =>
    arr.findIndex(x => x.name === fn.name) === i
  )

  // Collect all imports (deduplicated)
  const allOriginalImports = fileComponents.flatMap(c => c.result.imports)
  const uniqueImports = allOriginalImports.filter((imp, i, arr) =>
    arr.findIndex(x => x.name === imp.name && x.path === imp.path) === i
  )

  // Collect all external imports (deduplicated by path)
  const allExternalImports = fileComponents.flatMap(c => c.result.externalImports)
  const uniqueExternalImports = allExternalImports.filter((imp, i, arr) =>
    arr.findIndex(x => x.path === imp.path) === i
  )

  return options.markedJsxAdapter.generateMarkedJsxFile({
    sourcePath,
    components: markedJsxComponents,
    moduleConstants: uniqueModuleConstants,
    moduleFunctions: uniqueModuleFunctions,
    originalImports: uniqueImports,
    externalImports: uniqueExternalImports,
  })
}
