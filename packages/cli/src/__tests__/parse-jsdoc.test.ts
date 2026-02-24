import { describe, test, expect } from 'bun:test'
import { extractDescription, extractExamples, extractPropDescriptions, parsePropsFromDefinition, extractJsdocBefore } from '../lib/parse-jsdoc'

describe('extractDescription', () => {
  test('extracts description from top-level JSDoc', () => {
    const source = `/**
 * Button Component
 *
 * A versatile button.
 */
function Button() {}`
    expect(extractDescription(source)).toBe('Button Component A versatile button.')
  })

  test('extracts description after "use client" directive', () => {
    const source = `"use client"

/**
 * Checkbox Component
 *
 * An accessible checkbox.
 */
function Checkbox() {}`
    expect(extractDescription(source)).toBe('Checkbox Component An accessible checkbox.')
  })

  test('stops at @example tags', () => {
    const source = `/**
 * My Component
 *
 * @example Basic usage
 * \`\`\`tsx
 * <MyComponent />
 * \`\`\`
 */
function MyComponent() {}`
    expect(extractDescription(source)).toBe('My Component')
  })

  test('returns empty string when no JSDoc', () => {
    expect(extractDescription('function Foo() {}')).toBe('')
  })
})

describe('extractExamples', () => {
  test('extracts @example blocks', () => {
    const source = `/**
 * My Component
 *
 * @example Basic usage
 * \`\`\`tsx
 * <MyComponent />
 * \`\`\`
 *
 * @example With props
 * \`\`\`tsx
 * <MyComponent size="lg" />
 * \`\`\`
 */
function MyComponent() {}`
    const examples = extractExamples(source)
    expect(examples).toHaveLength(2)
    expect(examples[0].title).toBe('Basic usage')
    expect(examples[0].code).toBe('<MyComponent />')
    expect(examples[1].title).toBe('With props')
    expect(examples[1].code).toBe('<MyComponent size="lg" />')
  })

  test('returns empty array when no examples', () => {
    const source = `/**
 * My Component
 */
function MyComponent() {}`
    expect(extractExamples(source)).toEqual([])
  })
})

describe('extractPropDescriptions', () => {
  test('extracts prop descriptions and defaults', () => {
    const source = `interface CheckboxProps {
  /**
   * Whether checked.
   * @default false
   */
  checked?: boolean
  /**
   * Callback when state changes.
   */
  onCheckedChange?: (checked: boolean) => void
}`
    const result = extractPropDescriptions(source)
    expect(result.checked).toEqual({ description: 'Whether checked.', defaultValue: 'false' })
    expect(result.onCheckedChange).toEqual({ description: 'Callback when state changes.', defaultValue: undefined })
  })

  test('handles interface with extends', () => {
    const source = `interface ButtonProps extends HTMLBaseAttributes {
  /** Visual style */
  variant?: ButtonVariant
}`
    const result = extractPropDescriptions(source)
    expect(result.variant).toEqual({ description: 'Visual style', defaultValue: undefined })
  })

  test('returns empty for no Props interface', () => {
    expect(extractPropDescriptions('const x = 1')).toEqual({})
  })
})

describe('parsePropsFromDefinition', () => {
  test('parses props from interface definition', () => {
    const definition = `interface CheckboxProps extends ButtonHTMLAttributes {
  /**
   * Default checked state.
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Controlled checked state.
   */
  checked?: boolean
  /**
   * Callback when state changes.
   */
  onCheckedChange?: (checked: boolean) => void
}`
    const props = parsePropsFromDefinition(definition)
    expect(props).toHaveLength(3)
    expect(props[0]).toEqual({
      name: 'defaultChecked',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Default checked state.',
    })
    expect(props[1]).toEqual({
      name: 'checked',
      type: 'boolean',
      required: false,
      default: undefined,
      description: 'Controlled checked state.',
    })
    expect(props[2]).toEqual({
      name: 'onCheckedChange',
      type: '(checked: boolean) => void',
      required: false,
      default: undefined,
      description: 'Callback when state changes.',
    })
  })

  test('marks required props', () => {
    const definition = `interface ItemProps {
  value: string
  label?: string
}`
    const props = parsePropsFromDefinition(definition)
    expect(props[0].required).toBe(true)
    expect(props[1].required).toBe(false)
  })

  test('returns empty for no body', () => {
    expect(parsePropsFromDefinition('type Foo = string')).toEqual([])
  })
})

describe('extractJsdocBefore', () => {
  test('extracts JSDoc immediately before a position', () => {
    const source = `/**
 * Props for Accordion.
 */
interface AccordionProps {}`
    const pos = source.indexOf('interface')
    expect(extractJsdocBefore(source, pos)).toBe('Props for Accordion.')
  })

  test('finds the last JSDoc block before position', () => {
    const source = `/**
 * First block.
 */
function Foo() {}

/**
 * Second block.
 */
interface BarProps {}`
    const pos = source.indexOf('interface')
    expect(extractJsdocBefore(source, pos)).toBe('Second block.')
  })

  test('returns empty when code exists between JSDoc and target', () => {
    const source = `/**
 * Some JSDoc.
 */
function Foo() {}
const x = 1
interface BarProps {}`
    const pos = source.indexOf('interface')
    expect(extractJsdocBefore(source, pos)).toBe('')
  })

  test('returns empty when no JSDoc exists', () => {
    expect(extractJsdocBefore('interface Foo {}', 0)).toBe('')
  })
})
