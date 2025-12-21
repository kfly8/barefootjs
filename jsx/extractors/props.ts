/**
 * BarefootJS JSX Compiler - Props Extractor
 */

import ts from 'typescript'
import { createSourceFile, isPascalCase } from '../utils/helpers'

/**
 * コンポーネント関数のパラメータ（props）を抽出
 * function Counter({ initial = 0 }) → ['initial']
 * function Counter(props) → [] (destructuringでない場合は抽出しない)
 */
export function extractComponentProps(source: string, filePath: string): string[] {
  const sourceFile = createSourceFile(source, filePath)

  const props: string[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      const param = node.parameters[0]
      if (param && ts.isObjectBindingPattern(param.name)) {
        for (const element of param.name.elements) {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            props.push(element.name.text)
          }
        }
      }
    }
  })

  return props
}
