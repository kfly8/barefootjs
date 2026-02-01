/**
 * Props Destructuring Warning Tests
 *
 * Tests for BF043: Props destructuring in function parameters breaks reactivity
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { ErrorCodes } from '../errors'

describe('Props Destructuring Warning (BF043)', () => {
  test('warns on destructured props', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      export function Component({ checked }: Props) {
        return <div>{checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
    expect(propsWarnings[0].severity).toBe('warning')
    expect(propsWarnings[0].suggestion?.message).toContain('props object')
  })

  test('warns on rest props', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      export function Component({ ...props }: Props) {
        return <div>{props.checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('warns on partial destructuring with rest props', () => {
    const source = `
      'use client'

      interface Props {
        onClick: () => void
        checked: boolean
      }

      export function Component({ onClick, ...rest }: Props) {
        return <div onClick={onClick}>{rest.checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('no warning with @bf-ignore props-destructuring', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      // @bf-ignore props-destructuring
      export function Component({ checked }: Props) {
        return <div>{checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('no warning when props object is used', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      export function Component(props: Props) {
        return <div>{props.checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('no warning when no props parameter', () => {
    const source = `
      'use client'

      export function Component() {
        return <div>Hello</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('warns on arrow function component with destructuring', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      export const Component = ({ checked }: Props) => {
        return <div>{checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('no warning on arrow function with @bf-ignore', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
      }

      // @bf-ignore props-destructuring
      export const Component = ({ checked }: Props) => {
        return <div>{checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('warns on multiple destructured props', () => {
    const source = `
      'use client'

      interface Props {
        checked: boolean
        onChange: () => void
        label: string
      }

      export function Component({ checked, onChange, label }: Props) {
        return <div onClick={onChange}>{label}: {checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1) // One warning per component, not per prop
  })
})
