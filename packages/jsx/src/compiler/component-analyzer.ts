/**
 * Component Body Analyzer
 *
 * Analyzes the body of a component function to extract:
 * - Variable declarations with their expressions and dependencies
 * - Conditional return statements (if/else branches)
 * - Final return statement
 *
 * This is used for compile-time component evaluation when props are known.
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'

/**
 * Information about a variable declaration in a component body
 */
export interface VariableDeclaration {
  /** Variable name (e.g., 'pixelSize') */
  name: string
  /** Expression as string (e.g., 'sizeMap[size]') */
  expression: string
  /** Names this variable depends on (props, other variables) */
  dependsOn: string[]
}

/**
 * Information about a conditional return statement
 */
export interface ConditionalReturn {
  /** Condition expression as string (e.g., 'name === "github"') */
  condition: string
  /** The JSX/expression being returned */
  returnExpression: string
  /** Names used in the condition */
  conditionDependsOn: string[]
}

/**
 * Result of analyzing a component body
 */
export interface ComponentBodyAnalysis {
  /** Variable declarations in order */
  variableDeclarations: VariableDeclaration[]
  /** Conditional returns (if statements with early return) */
  conditionalReturns: ConditionalReturn[]
  /** Final return expression (may be null for components that return nothing) */
  finalReturnExpression: string | null
  /** Names the final return depends on */
  finalReturnDependsOn: string[]
}

/**
 * Analyzes a component's source code to extract variable declarations,
 * conditional returns, and the final return statement.
 *
 * @param source - Full source code containing the component
 * @param componentName - Name of the component function to analyze
 * @returns Analysis result or null if component not found
 */
export function analyzeComponentBody(source: string, componentName: string): ComponentBodyAnalysis | null {
  const sourceFile = createSourceFile(source, '__analyze.tsx')

  // Find the component function
  let componentFunc: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | null = null

  function findComponent(node: ts.Node): void {
    // Function declaration: function Icon(...) { }
    if (ts.isFunctionDeclaration(node) && node.name?.text === componentName) {
      componentFunc = node
      return
    }

    // Variable declaration with function: const Icon = (...) => { } or const Icon = function(...) { }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === componentName && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            componentFunc = decl.initializer
            return
          }
        }
      }
    }

    ts.forEachChild(node, findComponent)
  }

  ts.forEachChild(sourceFile, findComponent)

  if (!componentFunc) {
    return null
  }

  // Get the body - FunctionDeclaration always has body, but ArrowFunction may have expression body
  const func = componentFunc as ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction
  const body = func.body
  if (!body) {
    return null
  }

  // If body is an expression (arrow function with implicit return)
  if (!ts.isBlock(body)) {
    return {
      variableDeclarations: [],
      conditionalReturns: [],
      finalReturnExpression: body.getText(sourceFile),
      finalReturnDependsOn: collectIdentifiers(body)
    }
  }

  // Analyze block body
  const variableDeclarations: VariableDeclaration[] = []
  const conditionalReturns: ConditionalReturn[] = []
  let finalReturnExpression: string | null = null
  let finalReturnDependsOn: string[] = []

  for (const statement of body.statements) {
    // Variable declaration
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          variableDeclarations.push({
            name: decl.name.text,
            expression: decl.initializer.getText(sourceFile),
            dependsOn: collectIdentifiers(decl.initializer)
          })
        }
      }
    }

    // If statement with return (conditional return)
    if (ts.isIfStatement(statement)) {
      const conditionalReturn = extractConditionalReturn(statement, sourceFile)
      if (conditionalReturn) {
        conditionalReturns.push(conditionalReturn)
      }
    }

    // Return statement at block level (final return)
    if (ts.isReturnStatement(statement)) {
      if (statement.expression) {
        finalReturnExpression = statement.expression.getText(sourceFile)
        finalReturnDependsOn = collectIdentifiers(statement.expression)
      } else {
        finalReturnExpression = 'null'
        finalReturnDependsOn = []
      }
    }
  }

  return {
    variableDeclarations,
    conditionalReturns,
    finalReturnExpression,
    finalReturnDependsOn
  }
}

/**
 * Extracts a conditional return from an if statement
 */
function extractConditionalReturn(
  ifStatement: ts.IfStatement,
  sourceFile: ts.SourceFile
): ConditionalReturn | null {
  const condition = ifStatement.expression.getText(sourceFile)
  const conditionDependsOn = collectIdentifiers(ifStatement.expression)

  // Check if the then branch is a return statement or block with return
  let returnExpression: string | null = null

  if (ts.isReturnStatement(ifStatement.thenStatement)) {
    returnExpression = ifStatement.thenStatement.expression?.getText(sourceFile) || 'null'
  } else if (ts.isBlock(ifStatement.thenStatement)) {
    // Look for return statement in block
    for (const stmt of ifStatement.thenStatement.statements) {
      if (ts.isReturnStatement(stmt)) {
        returnExpression = stmt.expression?.getText(sourceFile) || 'null'
        break
      }
    }
  }

  if (returnExpression === null) {
    return null
  }

  return {
    condition,
    returnExpression,
    conditionDependsOn
  }
}

/**
 * Collects all identifier names from a node
 */
function collectIdentifiers(node: ts.Node): string[] {
  const identifiers = new Set<string>()

  function visit(n: ts.Node): void {
    if (ts.isIdentifier(n)) {
      const parent = n.parent
      // Skip property names (e.g., 'md' in sizeMap.md, 'size' in { size: pixelSize })
      const isPropertyName =
        (ts.isPropertyAccessExpression(parent) && parent.name === n) ||
        (ts.isPropertyAssignment(parent) && parent.name === n)
      if (!isPropertyName) {
        identifiers.add(n.text)
      }
    }
    ts.forEachChild(n, visit)
  }

  visit(node)
  return Array.from(identifiers)
}

/**
 * Finds what props a component receives by analyzing its parameter
 *
 * @param source - Full source code
 * @param componentName - Component function name
 * @returns Array of prop names with their local names (for renamed props like class: className)
 */
export function extractComponentProps(
  source: string,
  componentName: string
): Array<{ name: string; localName: string; defaultValue?: string }> {
  const sourceFile = createSourceFile(source, '__props.tsx')
  const props: Array<{ name: string; localName: string; defaultValue?: string }> = []

  function findComponent(node: ts.Node): void {
    // Function declaration
    if (ts.isFunctionDeclaration(node) && node.name?.text === componentName) {
      extractPropsFromFunction(node, sourceFile, props)
      return
    }

    // Variable declaration with function
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === componentName && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            extractPropsFromFunction(decl.initializer, sourceFile, props)
            return
          }
        }
      }
    }

    ts.forEachChild(node, findComponent)
  }

  ts.forEachChild(sourceFile, findComponent)
  return props
}

/**
 * Extracts props from a function's first parameter
 */
function extractPropsFromFunction(
  func: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
  sourceFile: ts.SourceFile,
  props: Array<{ name: string; localName: string; defaultValue?: string }>
): void {
  const param = func.parameters[0]
  if (!param) return

  // Destructured props: ({ name, size = 'md', class: className })
  if (ts.isObjectBindingPattern(param.name)) {
    for (const element of param.name.elements) {
      if (ts.isBindingElement(element)) {
        const propertyName = element.propertyName
          ? (element.propertyName as ts.Identifier).text
          : (element.name as ts.Identifier).text
        const localName = (element.name as ts.Identifier).text
        const defaultValue = element.initializer?.getText(sourceFile)

        props.push({ name: propertyName, localName, defaultValue })
      }
    }
  }
}
