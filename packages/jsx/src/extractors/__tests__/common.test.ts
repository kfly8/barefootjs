import { describe, test, expect } from 'bun:test'
import ts from 'typescript'
import { createSourceFile } from '../../utils/helpers'
import {
  isComponentFunction,
  findComponentFunction,
  forEachComponentFunction,
  forEachVariableDeclaration
} from '../common'

describe('isComponentFunction', () => {
  test('returns true for PascalCase function declarations', () => {
    const source = `function Counter() { return <div /> }`
    const sourceFile = createSourceFile(source, 'test.tsx')

    let found = false
    ts.forEachChild(sourceFile, (node) => {
      if (isComponentFunction(node)) {
        found = true
        expect(node.name.text).toBe('Counter')
      }
    })
    expect(found).toBe(true)
  })

  test('returns false for camelCase function declarations', () => {
    const source = `function myHelper() { return 1 }`
    const sourceFile = createSourceFile(source, 'test.tsx')

    let found = false
    ts.forEachChild(sourceFile, (node) => {
      if (isComponentFunction(node)) {
        found = true
      }
    })
    expect(found).toBe(false)
  })

  test('returns false for anonymous functions', () => {
    const source = `const fn = function() { return 1 }`
    const sourceFile = createSourceFile(source, 'test.tsx')

    let found = false
    ts.forEachChild(sourceFile, (node) => {
      if (isComponentFunction(node)) {
        found = true
      }
    })
    expect(found).toBe(false)
  })
})

describe('findComponentFunction', () => {
  test('finds first component when no target specified', () => {
    const source = `
      function Helper() { return <span /> }
      function Counter() { return <div /> }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile)
    expect(component).toBeDefined()
    expect(component?.name.text).toBe('Helper')
  })

  test('finds specific component by name', () => {
    const source = `
      function Helper() { return <span /> }
      function Counter() { return <div /> }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile, 'Counter')
    expect(component).toBeDefined()
    expect(component?.name.text).toBe('Counter')
  })

  test('returns undefined when target not found', () => {
    const source = `
      function Helper() { return <span /> }
      function Counter() { return <div /> }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile, 'NonExistent')
    expect(component).toBeUndefined()
  })

  test('finds nested component functions', () => {
    const source = `
      export default function Wrapper() {
        function Inner() { return <span /> }
        return <Inner />
      }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    // Without target, finds Wrapper first
    const wrapper = findComponentFunction(sourceFile)
    expect(wrapper?.name.text).toBe('Wrapper')

    // With target, can find Inner
    const inner = findComponentFunction(sourceFile, 'Inner')
    expect(inner?.name.text).toBe('Inner')
  })
})

describe('forEachComponentFunction', () => {
  test('iterates all component functions', () => {
    const source = `
      function First() { return <div /> }
      function Second() { return <span /> }
      function Third() { return <p /> }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const names: string[] = []
    forEachComponentFunction(sourceFile, (component, name) => {
      names.push(name)
    })

    expect(names).toEqual(['First', 'Second', 'Third'])
  })

  test('excludes specified component', () => {
    const source = `
      function Main() { return <div /> }
      function Helper() { return <span /> }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const names: string[] = []
    forEachComponentFunction(
      sourceFile,
      (component, name) => { names.push(name) },
      { excludeName: 'Main' }
    )

    expect(names).toEqual(['Helper'])
  })

  test('applies predicate filter', () => {
    const source = `
      function HasBody() { return <div /> }
      function NoBody(): JSX.Element;
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const names: string[] = []
    forEachComponentFunction(
      sourceFile,
      (component, name) => { names.push(name) },
      { predicate: (node) => node.body !== undefined }
    )

    expect(names).toEqual(['HasBody'])
  })
})

describe('forEachVariableDeclaration', () => {
  test('iterates variable declarations in block', () => {
    const source = `
      function Component() {
        const a = 1
        const b = 2
        let c = 3
        return <div />
      }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile)
    expect(component?.body).toBeDefined()

    const names: string[] = []
    forEachVariableDeclaration(component!.body!, (decl) => {
      if (ts.isIdentifier(decl.name)) {
        names.push(decl.name.text)
      }
    })

    expect(names).toEqual(['a', 'b', 'c'])
  })

  test('handles destructuring declarations', () => {
    const source = `
      function Component() {
        const [count, setCount] = createSignal(0)
        const { a, b } = props
        return <div />
      }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile)
    expect(component?.body).toBeDefined()

    let arrayBindingCount = 0
    let objectBindingCount = 0
    forEachVariableDeclaration(component!.body!, (decl) => {
      if (ts.isArrayBindingPattern(decl.name)) {
        arrayBindingCount++
      }
      if (ts.isObjectBindingPattern(decl.name)) {
        objectBindingCount++
      }
    })

    expect(arrayBindingCount).toBe(1)
    expect(objectBindingCount).toBe(1)
  })

  test('provides statement context', () => {
    const source = `
      function Component() {
        const handler = () => {}
        return <div />
      }
    `
    const sourceFile = createSourceFile(source, 'test.tsx')

    const component = findComponentFunction(sourceFile)
    expect(component?.body).toBeDefined()

    let statementText = ''
    forEachVariableDeclaration(component!.body!, (decl, statement) => {
      statementText = statement.getText(sourceFile)
    })

    expect(statementText).toBe('const handler = () => {}')
  })
})
