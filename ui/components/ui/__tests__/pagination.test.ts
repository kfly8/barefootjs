import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../pagination.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Pagination (nav wrapper with role=navigation)
// ---------------------------------------------------------------------------

describe('Pagination', () => {
  const result = renderToTest(source, 'pagination.tsx', 'Pagination')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Pagination', () => {
    expect(result.componentName).toBe('Pagination')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as nav', () => {
    expect(result.root.tag).toBe('nav')
  })

  test('has role=navigation', () => {
    expect(result.root.role).toBe('navigation')
  })

  test('has aria-label=pagination', () => {
    expect(result.root.aria['label']).toBe('pagination')
  })

  test('has data-slot=pagination', () => {
    expect(result.root.props['data-slot']).toBe('pagination')
  })
})

// ---------------------------------------------------------------------------
// PaginationContent (ul wrapper with flex layout)
// ---------------------------------------------------------------------------

describe('PaginationContent', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationContent', () => {
    expect(result.componentName).toBe('PaginationContent')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as ul', () => {
    expect(result.root.tag).toBe('ul')
  })

  test('has data-slot=pagination-content', () => {
    expect(result.root.props['data-slot']).toBe('pagination-content')
  })

  test('has flex layout classes', () => {
    expect(result.root.classes).toContain('flex')
  })
})

// ---------------------------------------------------------------------------
// PaginationItem (li wrapper)
// ---------------------------------------------------------------------------

describe('PaginationItem', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationItem')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationItem', () => {
    expect(result.componentName).toBe('PaginationItem')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as li', () => {
    expect(result.root.tag).toBe('li')
  })

  test('has data-slot=pagination-item', () => {
    expect(result.root.props['data-slot']).toBe('pagination-item')
  })
})

// ---------------------------------------------------------------------------
// PaginationLink (anchor link with data-slot)
// ---------------------------------------------------------------------------

describe('PaginationLink', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationLink')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationLink', () => {
    expect(result.componentName).toBe('PaginationLink')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('contains an <a> element with data-slot=pagination-link', () => {
    const link = result.find({ tag: 'a' })
    expect(link).not.toBeNull()
    expect(link!.props['data-slot']).toBe('pagination-link')
  })
})

// ---------------------------------------------------------------------------
// PaginationPrevious (anchor with "Go to previous page" label)
// ---------------------------------------------------------------------------

describe('PaginationPrevious', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationPrevious')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationPrevious', () => {
    expect(result.componentName).toBe('PaginationPrevious')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as a', () => {
    expect(result.root.tag).toBe('a')
  })

  test('has aria-label "Go to previous page"', () => {
    expect(result.root.aria['label']).toBe('Go to previous page')
  })
})

// ---------------------------------------------------------------------------
// PaginationNext (anchor with "Go to next page" label)
// ---------------------------------------------------------------------------

describe('PaginationNext', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationNext')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationNext', () => {
    expect(result.componentName).toBe('PaginationNext')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as a', () => {
    expect(result.root.tag).toBe('a')
  })

  test('has aria-label "Go to next page"', () => {
    expect(result.root.aria['label']).toBe('Go to next page')
  })
})

// ---------------------------------------------------------------------------
// PaginationEllipsis (span with aria-hidden)
// ---------------------------------------------------------------------------

describe('PaginationEllipsis', () => {
  const result = renderToTest(source, 'pagination.tsx', 'PaginationEllipsis')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is PaginationEllipsis', () => {
    expect(result.componentName).toBe('PaginationEllipsis')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as span', () => {
    expect(result.root.tag).toBe('span')
  })

  test('has data-slot=pagination-ellipsis', () => {
    expect(result.root.props['data-slot']).toBe('pagination-ellipsis')
  })
})
