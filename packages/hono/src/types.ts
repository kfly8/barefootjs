/**
 * BarefootJS Hono Integration - Type Definitions
 *
 * Local type definitions for the Hono adapter.
 */

// =============================================================================
// Prop Types
// =============================================================================

export interface PropInfo {
  name: string
  type: string
  optional: boolean
  localName?: string
  defaultValue?: string
}

// =============================================================================
// Import Types
// =============================================================================

export interface ImportInfo {
  name: string
  path: string
  isDefault: boolean
}

export interface ExternalImportInfo {
  code: string
}

// =============================================================================
// Module Definitions
// =============================================================================

export interface ModuleConstantInfo {
  code: string
}

export interface ModuleFunctionInfo {
  code: string
  tsxCode?: string
}

export interface LocalVariableInfo {
  code: string
}

// =============================================================================
// Component Data
// =============================================================================

export interface ComponentData {
  name: string
  props: PropInfo[]
  propsTypeRefName?: string
  restPropsName?: string
  jsx: string
  isDefaultExport: boolean
  localVariables?: LocalVariableInfo[]
  typeDefinitions: string[]
}

// =============================================================================
// Marked JSX Adapter
// =============================================================================

export interface MarkedJsxFileParams {
  sourcePath: string
  components: ComponentData[]
  moduleConstants: ModuleConstantInfo[]
  moduleFunctions?: ModuleFunctionInfo[]
  originalImports: ImportInfo[]
  externalImports?: ExternalImportInfo[]
}

export interface MarkedJsxAdapter {
  rawHtmlHelper: {
    importStatement: string
    helperCode: string
  }
  generateMarkedJsxFile: (params: MarkedJsxFileParams) => string
}
