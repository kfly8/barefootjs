import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const portalSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Portal', () => {
  const result = renderToTest(portalSource, 'portal.tsx', 'Portal')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Portal', () => {
    expect(result.componentName).toBe('Portal')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders a div with data-slot=portal', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('portal')
  })

  test('has data-portal=true', () => {
    const div = result.find({ tag: 'div' })
    expect(div!.props['data-portal']).toBe('true')
  })
})
