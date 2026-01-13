/**
 * Compile-Time Evaluator Tests
 */

import { describe, expect, it } from 'bun:test'
import {
  evaluateComponentWithProps,
  createCompileTimeContext,
  tryEvaluateComponentCall,
  type CompileTimeEvalContext
} from './compile-time-evaluator'
import type { CompileResult } from '../types'

describe('evaluateComponentWithProps', () => {
  it('evaluates simple component with static JSX', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    // Simple component that returns static HTML
    componentSources.set('SimpleIcon', `
      export function SimpleIcon({ size }) {
        return <svg width={size} height={size}><path d="M0 0" /></svg>
      }
    `)
    components.set('SimpleIcon', createMockResult('SimpleIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['size', '20']])

    const result = evaluateComponentWithProps('SimpleIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('<svg')
    expect(result!.html).toContain('width="20"')
    expect(result!.html).toContain('height="20"')
  })

  it('evaluates component with variable declaration', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('IconWithSize', `
      const sizeMap = { sm: 16, md: 20, lg: 24 }

      export function IconWithSize({ size = 'md' }) {
        const pixelSize = sizeMap[size]
        return <svg width={pixelSize} height={pixelSize}></svg>
      }
    `)
    components.set('IconWithSize', createMockResult('IconWithSize'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['size', '"md"']])

    const result = evaluateComponentWithProps('IconWithSize', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('width="20"')
  })

  it('evaluates conditional return - first branch', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('ConditionalIcon', `
      export function ConditionalIcon({ name }) {
        if (name === 'github') {
          return <div class="github">GitHub</div>
        }
        return <div class="default">Default</div>
      }
    `)
    components.set('ConditionalIcon', createMockResult('ConditionalIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['name', '"github"']])

    const result = evaluateComponentWithProps('ConditionalIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('class="github"')
    expect(result!.html).toContain('GitHub')
  })

  it('evaluates conditional return - default branch', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('ConditionalIcon', `
      export function ConditionalIcon({ name }) {
        if (name === 'github') {
          return <div class="github">GitHub</div>
        }
        return <div class="default">Default</div>
      }
    `)
    components.set('ConditionalIcon', createMockResult('ConditionalIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['name', '"sun"']])

    const result = evaluateComponentWithProps('ConditionalIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('class="default"')
    expect(result!.html).toContain('Default')
  })

  it('evaluates nested component', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    // Inner component
    componentSources.set('InnerIcon', `
      export function InnerIcon({ path }) {
        return <path d={path} />
      }
    `)
    components.set('InnerIcon', createMockResult('InnerIcon'))

    // Outer component that uses InnerIcon
    componentSources.set('OuterIcon', `
      export function OuterIcon({ name }) {
        return <svg><InnerIcon path="M0 0" /></svg>
      }
    `)
    components.set('OuterIcon', createMockResult('OuterIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['name', '"test"']])

    const result = evaluateComponentWithProps('OuterIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('<svg>')
    expect(result!.html).toContain('<path')
    expect(result!.html).toContain('d="M0 0"')
  })

  it('returns null for dynamic props', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('DynamicIcon', `
      export function DynamicIcon({ size }) {
        return <svg width={size}></svg>
      }
    `)
    const result = createMockResult('DynamicIcon')
    result.signals = [{ getter: 'count', setter: 'setCount', initialValue: '0' }]
    components.set('DynamicIcon', result)

    const ctx = createCompileTimeContext(components, componentSources)
    // size is a signal getter call
    const props = new Map([['size', 'count()']])

    const evalResult = evaluateComponentWithProps('DynamicIcon', props, ctx)

    // Should return null because count() is dynamic
    expect(evalResult).toBe(null)
  })

  it('uses default prop values', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('DefaultIcon', `
      export function DefaultIcon({ size = 'md', class: className = '' }) {
        return <div class={className} data-size={size}></div>
      }
    `)
    components.set('DefaultIcon', createMockResult('DefaultIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    // Don't pass any props - should use defaults
    const props = new Map<string, string>()

    const result = evaluateComponentWithProps('DefaultIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('data-size="md"')
  })

  it('handles renamed props correctly', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('RenamedIcon', `
      export function RenamedIcon({ class: className = 'default' }) {
        return <div class={className}></div>
      }
    `)
    components.set('RenamedIcon', createMockResult('RenamedIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['class', '"custom"']])

    const result = evaluateComponentWithProps('RenamedIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('class="custom"')
  })
})

describe('tryEvaluateComponentCall', () => {
  it('evaluates component from props object expression', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    componentSources.set('Icon', `
      export function Icon({ name }) {
        return <span>{name}</span>
      }
    `)
    components.set('Icon', createMockResult('Icon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const html = tryEvaluateComponentCall('Icon', '{ name: "sun" }', ctx)

    expect(html).not.toBe(null)
    expect(html).toContain('sun')
  })
})

describe('Icon-like component scenario', () => {
  // Test with all components in the same source file (like actual icon.tsx)
  it('evaluates SunIcon with all components in same file', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    // All components in one source file (like icon.tsx)
    const iconFileSource = `
      const sizeMap = { sm: 16, md: 20, lg: 24 }
      const strokeIcons = {
        sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
        moon: 'M12 3a6 6 0 0 0 9 9'
      }

      function StrokeIcon({ d, size, className }) {
        return (
          <svg width={size} height={size} class={className}>
            <path d={d} />
          </svg>
        )
      }

      export function Icon({ name, size = 'md', class: className = '' }) {
        const pixelSize = sizeMap[size]
        const path = strokeIcons[name]
        return <StrokeIcon d={path} size={pixelSize} className={className} />
      }

      export function SunIcon({ size = 'md', class: className = '' }) {
        return <Icon name="sun" size={size} class={className} />
      }
    `

    // Only SunIcon is in the components map (what ThemeSwitcher would import)
    componentSources.set('SunIcon', iconFileSource)
    components.set('SunIcon', createMockResult('SunIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['size', '"md"']])

    const result = evaluateComponentWithProps('SunIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('<svg')
    expect(result!.html).toContain('width="20"')
    expect(result!.html).toContain('height="20"')
    expect(result!.html).toContain('M12 16a4')
  })

  it('evaluates SunIcon → Icon → StrokeIcon chain', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    // StrokeIcon component
    componentSources.set('StrokeIcon', `
      export function StrokeIcon({ d, size, className }) {
        return (
          <svg width={size} height={size} class={className}>
            <path d={d} />
          </svg>
        )
      }
    `)
    components.set('StrokeIcon', createMockResult('StrokeIcon'))

    // Icon component with conditionals
    componentSources.set('Icon', `
      const sizeMap = { sm: 16, md: 20, lg: 24 }
      const strokeIcons = {
        sun: 'M12 16a4...',
        moon: 'M12 3a6...'
      }

      export function Icon({ name, size = 'md', class: className = '' }) {
        const pixelSize = sizeMap[size]

        if (name === 'github') {
          return <div class="github">GitHub</div>
        }

        const path = strokeIcons[name]
        return <StrokeIcon d={path} size={pixelSize} className={className} />
      }
    `)
    components.set('Icon', createMockResult('Icon'))

    // SunIcon wrapper
    componentSources.set('SunIcon', `
      export function SunIcon({ size = 'md', class: className = '' }) {
        return <Icon name="sun" size={size} class={className} />
      }
    `)
    components.set('SunIcon', createMockResult('SunIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map([['size', '"md"']])

    const result = evaluateComponentWithProps('SunIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('<svg')
    expect(result!.html).toContain('width="20"')
    expect(result!.html).toContain('height="20"')
    expect(result!.html).toContain('M12 16a4...')
  })

  it('handles github conditional branch', () => {
    const components = new Map<string, CompileResult>()
    const componentSources = new Map<string, string>()

    // GitHubSvg component
    componentSources.set('GitHubSvg', `
      export function GitHubSvg({ size, className }) {
        return <svg width={size} height={size} class={className}><path d="github-path" /></svg>
      }
    `)
    components.set('GitHubSvg', createMockResult('GitHubSvg'))

    // Icon component
    componentSources.set('Icon', `
      const sizeMap = { md: 20 }

      export function Icon({ name, size = 'md', class: className = '' }) {
        const pixelSize = sizeMap[size]

        if (name === 'github') {
          return <GitHubSvg size={pixelSize} className={className} />
        }

        return <div>default</div>
      }
    `)
    components.set('Icon', createMockResult('Icon'))

    // GitHubIcon wrapper
    componentSources.set('GitHubIcon', `
      export function GitHubIcon({ size = 'md', class: className = '' }) {
        return <Icon name="github" size={size} class={className} />
      }
    `)
    components.set('GitHubIcon', createMockResult('GitHubIcon'))

    const ctx = createCompileTimeContext(components, componentSources)
    const props = new Map<string, string>()

    const result = evaluateComponentWithProps('GitHubIcon', props, ctx)

    expect(result).not.toBe(null)
    expect(result!.html).toContain('<svg')
    expect(result!.html).toContain('github-path')
  })
})

// Helper to create mock CompileResult
function createMockResult(name: string): CompileResult {
  return {
    componentName: name,
    clientJs: '',
    signals: [],
    memos: [],
    effects: [],
    moduleConstants: [],
    localFunctions: [],
    moduleFunctions: [],
    localVariables: [],
    childInits: [],
    interactiveElements: [],
    dynamicElements: [],
    listElements: [],
    dynamicAttributes: [],
    refElements: [],
    conditionalElements: [],
    props: [],
    propsTypeRefName: null,
    restPropsName: null,
    typeDefinitions: [],
    source: '',
    ir: null,
    imports: [],
    externalImports: [],
    hasUseClientDirective: false
  }
}
