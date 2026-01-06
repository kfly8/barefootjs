/**
 * BarefootJS JSX Compiler - Props Extractor
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'
import type { PropWithType } from '../types'
import { findComponentFunction } from './common'

/**
 * Extracts type definitions used in props from the source file.
 * Returns type alias and interface declarations that are referenced in prop types.
 */
export function extractTypeDefinitions(source: string, filePath: string, propTypes: string[]): string[] {
  const sourceFile = createSourceFile(source, filePath)
  const typeDefinitions: string[] = []
  const collectedTypes = new Set<string>()

  // Helper: extract nested type references from member types
  function collectMemberTypeReferences(members: ts.NodeArray<ts.TypeElement>) {
    for (const member of members) {
      if (ts.isPropertySignature(member) && member.type) {
        const memberTypeText = member.type.getText(sourceFile)
        // Look for PascalCase type names
        const typeRefs = memberTypeText.match(/\b[A-Z][a-zA-Z0-9]*\b/g)
        if (typeRefs) {
          for (const ref of typeRefs) {
            collectTypeReferences(ref)
          }
        }
      }
    }
  }

  // Recursively collect all referenced type names from a type
  function collectTypeReferences(typeName: string) {
    if (collectedTypes.has(typeName)) return
    collectedTypes.add(typeName)

    ts.forEachChild(sourceFile, (node) => {
      // Type alias: type Props = { ... }
      if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
        typeDefinitions.push(node.getText(sourceFile))

        if (ts.isTypeLiteralNode(node.type)) {
          collectMemberTypeReferences(node.type.members)
        }
      }
      // Interface: interface Props { ... }
      else if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
        typeDefinitions.push(node.getText(sourceFile))

        // Handle heritage clauses (extends)
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            for (const typeRef of clause.types) {
              const parentTypeName = typeRef.expression.getText(sourceFile)
              // Only collect if it's a local type (will be skipped if not found)
              collectTypeReferences(parentTypeName)
            }
          }
        }

        // Collect member type references
        collectMemberTypeReferences(node.members)
      }
    })
  }

  // Extract referenced types from prop type strings
  for (const propType of propTypes) {
    const typeRefs = propType.match(/\b[A-Z][a-zA-Z0-9]*\b/g)
    if (typeRefs) {
      for (const ref of typeRefs) {
        collectTypeReferences(ref)
      }
    }
  }

  return typeDefinitions
}

/**
 * Result of props extraction including the type reference name and rest props.
 */
export type PropsExtractionResult = {
  props: PropWithType[]
  /** Original type reference name (e.g., "ButtonProps") or null for inline types */
  typeRefName: string | null
  /** Name of rest spread props (e.g., 'props' from ...props) */
  restPropsName: string | null
}

/**
 * Extracts component function parameters (props) with their types.
 * function Counter({ initial = 0 }: { initial?: number }) → { props: [...], typeRefName: null }
 * function Counter({ initial = 0 }: Props) → { props: [...], typeRefName: 'Props' }
 *
 * @param source - Source code
 * @param filePath - File path
 * @param targetComponentName - Optional: specific component to extract props from
 */
export function extractComponentPropsWithTypes(source: string, filePath: string, targetComponentName?: string): PropsExtractionResult {
  const sourceFile = createSourceFile(source, filePath)

  const props: PropWithType[] = []
  let typeRefName: string | null = null
  let restPropsName: string | null = null

  const component = findComponentFunction(sourceFile, targetComponentName)
  if (!component) {
    return { props, typeRefName, restPropsName }
  }

  const param = component.parameters[0]
  if (param && ts.isObjectBindingPattern(param.name)) {
    // Get the type annotation if present
    const typeAnnotation = param.type
    let typeMembers: Map<string, { type: string; optional: boolean }> = new Map()

    if (typeAnnotation && ts.isTypeLiteralNode(typeAnnotation)) {
      // Inline type: { prop: string; prop2?: number }
      for (const member of typeAnnotation.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText(sourceFile)
          const propType = member.type ? member.type.getText(sourceFile) : 'unknown'
          const isOptional = !!member.questionToken
          typeMembers.set(propName, { type: propType, optional: isOptional })
        }
      }
    } else if (typeAnnotation && ts.isTypeReferenceNode(typeAnnotation)) {
      // Type reference: Props
      // Store the original type reference name
      typeRefName = typeAnnotation.typeName.getText(sourceFile)
      // Try to find and resolve the type alias or interface
      const resolvedType = resolveTypeAlias(sourceFile, typeRefName)
      if (resolvedType) {
        typeMembers = resolvedType
      }
    }

    // Extract binding elements
    for (const element of param.name.elements) {
      if (ts.isBindingElement(element)) {
        // Check for rest spread: ...props
        if (element.dotDotDotToken && ts.isIdentifier(element.name)) {
          restPropsName = element.name.text
          continue
        }

        if (ts.isIdentifier(element.name)) {
          // For renamed props like { class: className }, propertyName is 'class' and name is 'className'
          // For regular props like { variant }, propertyName is undefined and name is 'variant'
          const localName = element.name.text
          const propName = element.propertyName
            ? ts.isIdentifier(element.propertyName)
              ? element.propertyName.text
              : element.propertyName.getText(sourceFile)
            : localName
          const hasDefault = !!element.initializer
          const typeInfo = typeMembers.get(propName)
          // Capture the default value if present
          const defaultValue = element.initializer
            ? element.initializer.getText(sourceFile)
            : undefined

          props.push({
            name: propName,
            localName: propName !== localName ? localName : undefined,
            type: typeInfo?.type || 'unknown',
            // When type info is not available (typeInfo is undefined), default to optional
            // This handles cases like interface extension where we can't resolve all members
            optional: typeInfo ? typeInfo.optional : true,
            defaultValue,
          })
        }
      }
    }
  }

  return { props, typeRefName, restPropsName }
}

/**
 * Helper: extract members from a type literal node into a Map.
 */
function extractMembersFromTypeLiteral(
  typeLiteral: ts.TypeLiteralNode,
  sourceFile: ts.SourceFile
): Map<string, { type: string; optional: boolean }> {
  const result = new Map<string, { type: string; optional: boolean }>()
  for (const member of typeLiteral.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText(sourceFile)
      const propType = member.type ? member.type.getText(sourceFile) : 'unknown'
      const isOptional = !!member.questionToken
      result.set(propName, { type: propType, optional: isOptional })
    }
  }
  return result
}

/**
 * Resolves a type alias or interface to its members.
 * type Props = { a: string; b?: number } → Map { 'a' => { type: 'string', optional: false }, ... }
 * interface Props { a: string; b?: number } → Map { 'a' => { type: 'string', optional: false }, ... }
 * interface ChildProps extends ParentProps { x: number } → Merges parent and child members
 */
function resolveTypeAlias(sourceFile: ts.SourceFile, typeName: string): Map<string, { type: string; optional: boolean }> | null {
  let result: Map<string, { type: string; optional: boolean }> | null = null

  ts.forEachChild(sourceFile, (node) => {
    // Type alias: type Props = { ... }
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      if (ts.isTypeLiteralNode(node.type)) {
        result = extractMembersFromTypeLiteral(node.type, sourceFile)
      }
      // Handle intersection type: type Props = BaseProps & { extra: string }
      else if (ts.isIntersectionTypeNode(node.type)) {
        result = new Map()
        for (const typeNode of node.type.types) {
          if (ts.isTypeLiteralNode(typeNode)) {
            const members = extractMembersFromTypeLiteral(typeNode, sourceFile)
            for (const [k, v] of members) result.set(k, v)
          } else if (ts.isTypeReferenceNode(typeNode)) {
            const refName = typeNode.typeName.getText(sourceFile)
            const resolved = resolveTypeAlias(sourceFile, refName)
            if (resolved) {
              for (const [k, v] of resolved) result.set(k, v)
            }
          }
        }
      }
    }
    // Interface: interface Props { ... }
    else if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
      result = new Map()

      // Collect from heritage clauses first (parent interfaces)
      if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
          if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
            for (const typeRef of clause.types) {
              const parentName = typeRef.expression.getText(sourceFile)
              const parentMembers = resolveTypeAlias(sourceFile, parentName)
              if (parentMembers) {
                for (const [k, v] of parentMembers) result.set(k, v)
              }
            }
          }
        }
      }

      // Then collect own members (may override parent members)
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText(sourceFile)
          const propType = member.type ? member.type.getText(sourceFile) : 'unknown'
          const isOptional = !!member.questionToken
          result.set(propName, { type: propType, optional: isOptional })
        }
      }
    }
  })

  return result
}
