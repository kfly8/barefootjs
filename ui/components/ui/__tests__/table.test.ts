import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const tableSource = readFileSync(resolve(__dirname, '../table.tsx'), 'utf-8')

describe('Table', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'Table')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Table', () => {
    expect(result.componentName).toBe('Table')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div container with data-slot=table-container', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('table-container')
  })

  test('has overflow-x-auto class on container', () => {
    expect(result.root.classes).toContain('overflow-x-auto')
  })

  test('contains table element with data-slot=table', () => {
    const table = result.find({ tag: 'table' })
    expect(table).not.toBeNull()
    expect(table!.props['data-slot']).toBe('table')
  })
})

describe('TableHeader', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableHeader')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as thead with data-slot=table-header', () => {
    expect(result.root.tag).toBe('thead')
    expect(result.root.props['data-slot']).toBe('table-header')
  })
})

describe('TableBody', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableBody')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as tbody with data-slot=table-body', () => {
    expect(result.root.tag).toBe('tbody')
    expect(result.root.props['data-slot']).toBe('table-body')
  })
})

describe('TableFooter', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableFooter')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as tfoot with data-slot=table-footer', () => {
    expect(result.root.tag).toBe('tfoot')
    expect(result.root.props['data-slot']).toBe('table-footer')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('border-t')
    expect(result.root.classes).toContain('font-medium')
  })
})

describe('TableRow', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableRow')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as tr with data-slot=table-row', () => {
    expect(result.root.tag).toBe('tr')
    expect(result.root.props['data-slot']).toBe('table-row')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('border-b')
    expect(result.root.classes).toContain('transition-colors')
  })
})

describe('TableHead', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableHead')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as th with data-slot=table-head', () => {
    expect(result.root.tag).toBe('th')
    expect(result.root.props['data-slot']).toBe('table-head')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('font-medium')
    expect(result.root.classes).toContain('text-left')
  })
})

describe('TableCell', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableCell')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as td with data-slot=table-cell', () => {
    expect(result.root.tag).toBe('td')
    expect(result.root.props['data-slot']).toBe('table-cell')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('p-2')
    expect(result.root.classes).toContain('align-middle')
  })
})

describe('TableCaption', () => {
  const result = renderToTest(tableSource, 'table.tsx', 'TableCaption')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as caption with data-slot=table-caption', () => {
    expect(result.root.tag).toBe('caption')
    expect(result.root.props['data-slot']).toBe('table-caption')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-sm')
  })
})
