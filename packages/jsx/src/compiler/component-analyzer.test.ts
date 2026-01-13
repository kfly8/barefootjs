/**
 * Component Analyzer Tests
 */

import { describe, expect, it } from 'bun:test'
import { analyzeComponentBody, extractComponentProps } from './component-analyzer'

describe('analyzeComponentBody', () => {
  it('extracts variable declarations', () => {
    const source = `
      export function Icon({ name, size }) {
        const pixelSize = sizeMap[size]
        const path = strokeIcons[name]
        return <div>{path}</div>
      }
    `
    const result = analyzeComponentBody(source, 'Icon')

    expect(result).not.toBe(null)
    expect(result!.variableDeclarations).toHaveLength(2)

    expect(result!.variableDeclarations[0].name).toBe('pixelSize')
    expect(result!.variableDeclarations[0].expression).toBe('sizeMap[size]')
    expect(result!.variableDeclarations[0].dependsOn).toContain('sizeMap')
    expect(result!.variableDeclarations[0].dependsOn).toContain('size')

    expect(result!.variableDeclarations[1].name).toBe('path')
    expect(result!.variableDeclarations[1].expression).toBe('strokeIcons[name]')
  })

  it('extracts conditional returns', () => {
    const source = `
      export function Icon({ name, size }) {
        const pixelSize = sizeMap[size]

        if (name === 'github') {
          return <GitHubSvg size={pixelSize} />
        }

        if (name === 'search') {
          return <SearchSvg size={pixelSize} />
        }

        return <StrokeIcon d={path} />
      }
    `
    const result = analyzeComponentBody(source, 'Icon')

    expect(result).not.toBe(null)
    expect(result!.conditionalReturns).toHaveLength(2)

    expect(result!.conditionalReturns[0].condition).toBe("name === 'github'")
    expect(result!.conditionalReturns[0].returnExpression).toBe('<GitHubSvg size={pixelSize} />')
    expect(result!.conditionalReturns[0].conditionDependsOn).toContain('name')

    expect(result!.conditionalReturns[1].condition).toBe("name === 'search'")
    expect(result!.conditionalReturns[1].returnExpression).toBe('<SearchSvg size={pixelSize} />')
  })

  it('extracts final return', () => {
    const source = `
      export function Icon({ name }) {
        if (name === 'github') {
          return <GitHubSvg />
        }
        return <StrokeIcon d={path} size={pixelSize} />
      }
    `
    const result = analyzeComponentBody(source, 'Icon')

    expect(result).not.toBe(null)
    expect(result!.finalReturnExpression).toBe('<StrokeIcon d={path} size={pixelSize} />')
    expect(result!.finalReturnDependsOn).toContain('path')
    expect(result!.finalReturnDependsOn).toContain('pixelSize')
  })

  it('handles arrow function components', () => {
    const source = `
      const Button = ({ label }) => {
        const text = label.toUpperCase()
        return <button>{text}</button>
      }
    `
    const result = analyzeComponentBody(source, 'Button')

    expect(result).not.toBe(null)
    expect(result!.variableDeclarations).toHaveLength(1)
    expect(result!.variableDeclarations[0].name).toBe('text')
  })

  it('handles simple arrow function with implicit return', () => {
    const source = `
      const SunIcon = ({ size, class: className }) =>
        <Icon name="sun" size={size} class={className} />
    `
    const result = analyzeComponentBody(source, 'SunIcon')

    expect(result).not.toBe(null)
    expect(result!.variableDeclarations).toHaveLength(0)
    expect(result!.conditionalReturns).toHaveLength(0)
    expect(result!.finalReturnExpression).toContain('<Icon name="sun"')
  })

  it('handles if statements with inline return', () => {
    const source = `
      export function Icon({ name }) {
        if (name === 'github') return <GitHubSvg />
        return null
      }
    `
    const result = analyzeComponentBody(source, 'Icon')

    expect(result).not.toBe(null)
    expect(result!.conditionalReturns).toHaveLength(1)
    expect(result!.conditionalReturns[0].condition).toBe("name === 'github'")
    expect(result!.conditionalReturns[0].returnExpression).toBe('<GitHubSvg />')
  })

  it('returns null for non-existent component', () => {
    const source = `
      export function Button() {
        return <button />
      }
    `
    const result = analyzeComponentBody(source, 'Icon')

    expect(result).toBe(null)
  })
})

describe('extractComponentProps', () => {
  it('extracts simple props', () => {
    const source = `
      export function Icon({ name, size }) {
        return <div />
      }
    `
    const props = extractComponentProps(source, 'Icon')

    expect(props).toHaveLength(2)
    expect(props[0]).toEqual({ name: 'name', localName: 'name', defaultValue: undefined })
    expect(props[1]).toEqual({ name: 'size', localName: 'size', defaultValue: undefined })
  })

  it('extracts props with defaults', () => {
    const source = `
      export function Icon({ name, size = 'md' }) {
        return <div />
      }
    `
    const props = extractComponentProps(source, 'Icon')

    expect(props).toHaveLength(2)
    expect(props[0]).toEqual({ name: 'name', localName: 'name', defaultValue: undefined })
    expect(props[1]).toEqual({ name: 'size', localName: 'size', defaultValue: "'md'" })
  })

  it('extracts renamed props', () => {
    const source = `
      export function Icon({ name, class: className }) {
        return <div />
      }
    `
    const props = extractComponentProps(source, 'Icon')

    expect(props).toHaveLength(2)
    expect(props[0]).toEqual({ name: 'name', localName: 'name', defaultValue: undefined })
    expect(props[1]).toEqual({ name: 'class', localName: 'className', defaultValue: undefined })
  })

  it('extracts renamed props with defaults', () => {
    const source = `
      export function Icon({ name, size = 'md', class: className = '' }) {
        return <div />
      }
    `
    const props = extractComponentProps(source, 'Icon')

    expect(props).toHaveLength(3)
    expect(props[0]).toEqual({ name: 'name', localName: 'name', defaultValue: undefined })
    expect(props[1]).toEqual({ name: 'size', localName: 'size', defaultValue: "'md'" })
    expect(props[2]).toEqual({ name: 'class', localName: 'className', defaultValue: "''" })
  })
})

describe('Icon component scenario', () => {
  it('analyzes the actual Icon component', () => {
    const source = `
      export function Icon({ name, size = 'md', class: className = '' }) {
        const pixelSize = sizeMap[size]

        if (name === 'github') {
          return <GitHubSvg size={pixelSize} className={className} />
        }

        if (name === 'search') {
          return <SearchSvg size={pixelSize} className={className} />
        }

        const path = strokeIcons[name]
        if (path) {
          return <StrokeIcon d={path} size={pixelSize} className={className} />
        }

        return null
      }
    `

    const result = analyzeComponentBody(source, 'Icon')

    expect(result).not.toBe(null)

    // Variable declarations
    expect(result!.variableDeclarations).toHaveLength(2)
    expect(result!.variableDeclarations[0].name).toBe('pixelSize')
    expect(result!.variableDeclarations[1].name).toBe('path')

    // Conditional returns (3 total: github, search, path check)
    expect(result!.conditionalReturns).toHaveLength(3)
    expect(result!.conditionalReturns[0].condition).toBe("name === 'github'")
    expect(result!.conditionalReturns[1].condition).toBe("name === 'search'")
    expect(result!.conditionalReturns[2].condition).toBe("path")

    // Final return
    expect(result!.finalReturnExpression).toBe('null')
  })

  it('analyzes SunIcon wrapper', () => {
    const source = `
      export function SunIcon({ size = 'md', class: className = '' }) {
        return <Icon name="sun" size={size} class={className} />
      }
    `

    const result = analyzeComponentBody(source, 'SunIcon')

    expect(result).not.toBe(null)
    expect(result!.variableDeclarations).toHaveLength(0)
    expect(result!.conditionalReturns).toHaveLength(0)
    expect(result!.finalReturnExpression).toContain('<Icon name="sun"')
  })
})
