/**
 * BarefootJS JSX Compiler - Props Extractor
 */

import ts from 'typescript'
import { createSourceFile, isPascalCase } from '../utils/helpers'
import type { PropWithType } from '../types'

/**
 * Extracts type definitions used in props from the source file.
 * Returns type alias declarations that are referenced in prop types.
 */
export function extractTypeDefinitions(source: string, filePath: string, propTypes: string[]): string[] {
  const sourceFile = createSourceFile(source, filePath)
  const typeDefinitions: string[] = []
  const collectedTypes = new Set<string>()

  // Recursively collect all referenced type names from a type
  function collectTypeReferences(typeName: string) {
    if (collectedTypes.has(typeName)) return
    collectedTypes.add(typeName)

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
        // Get the full text of the type definition
        typeDefinitions.push(node.getText(sourceFile))

        // If it's a type literal, check for nested type references
        if (ts.isTypeLiteralNode(node.type)) {
          for (const member of node.type.members) {
            if (ts.isPropertySignature(member) && member.type) {
              // Check if the member type references another type
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
 * Extracts component function parameters (props) with their types.
 * function Counter({ initial = 0 }: { initial?: number }) → [{ name: 'initial', type: 'number', optional: true }]
 * function Counter({ initial = 0 }: Props) → [{ name: 'initial', type: 'unknown', optional: true }] (type alias not resolved)
 */
export function extractComponentPropsWithTypes(source: string, filePath: string): PropWithType[] {
  const sourceFile = createSourceFile(source, filePath)

  const props: PropWithType[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      const param = node.parameters[0]
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
          // Try to find and resolve the type alias
          const typeName = typeAnnotation.typeName.getText(sourceFile)
          const resolvedType = resolveTypeAlias(sourceFile, typeName)
          if (resolvedType) {
            typeMembers = resolvedType
          }
        }

        // Extract binding elements
        for (const element of param.name.elements) {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            const propName = element.name.text
            const hasDefault = !!element.initializer
            const typeInfo = typeMembers.get(propName)

            props.push({
              name: propName,
              type: typeInfo?.type || 'unknown',
              optional: typeInfo?.optional || hasDefault,
            })
          }
        }
      }
    }
  })

  return props
}

/**
 * Resolves a type alias to its members.
 * type Props = { a: string; b?: number } → Map { 'a' => { type: 'string', optional: false }, ... }
 */
function resolveTypeAlias(sourceFile: ts.SourceFile, typeName: string): Map<string, { type: string; optional: boolean }> | null {
  let result: Map<string, { type: string; optional: boolean }> | null = null

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      if (ts.isTypeLiteralNode(node.type)) {
        result = new Map()
        for (const member of node.type.members) {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText(sourceFile)
            const propType = member.type ? member.type.getText(sourceFile) : 'unknown'
            const isOptional = !!member.questionToken
            result.set(propName, { type: propType, optional: isOptional })
          }
        }
      }
    }
  })

  return result
}
