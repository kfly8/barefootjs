import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const cardSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Card', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'Card')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Card', () => {
    expect(result.componentName).toBe('Card')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=card', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('card')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('flex-col')
    expect(result.root.classes).toContain('rounded-xl')
  })
})

describe('CardHeader', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardHeader')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=card-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('card-header')
  })
})

describe('CardTitle', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardTitle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as h3 with data-slot=card-title', () => {
    expect(result.root.tag).toBe('h3')
    expect(result.root.props['data-slot']).toBe('card-title')
  })
})

describe('CardDescription', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardDescription')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as p with data-slot=card-description', () => {
    expect(result.root.tag).toBe('p')
    expect(result.root.props['data-slot']).toBe('card-description')
  })
})

describe('CardContent', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=card-content', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('card-content')
  })
})

describe('CardImage', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardImage')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as img with data-slot=card-image', () => {
    expect(result.root.tag).toBe('img')
    expect(result.root.props['data-slot']).toBe('card-image')
  })
})

describe('CardAction', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardAction')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=card-action', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('card-action')
  })
})

describe('CardFooter', () => {
  const result = renderToTest(cardSource, 'card.tsx', 'CardFooter')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=card-footer', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('card-footer')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('items-center')
  })
})
