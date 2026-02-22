import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const avatarSource = readFileSync(resolve(__dirname, '../avatar.tsx'), 'utf-8')

describe('Avatar', () => {
  const result = renderToTest(avatarSource, 'avatar.tsx', 'Avatar')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Avatar', () => {
    expect(result.componentName).toBe('Avatar')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is a span with data-slot=avatar', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['data-slot']).toBe('avatar')
  })

  test('has resolved base CSS classes', () => {
    const span = result.find({ tag: 'span' })!
    expect(span.classes).toContain('relative')
    expect(span.classes).toContain('flex')
    expect(span.classes).toContain('overflow-hidden')
    expect(span.classes).toContain('rounded-full')
  })
})

describe('AvatarImage', () => {
  const result = renderToTest(avatarSource, 'avatar.tsx', 'AvatarImage')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AvatarImage', () => {
    expect(result.componentName).toBe('AvatarImage')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is an img with data-slot=avatar-image', () => {
    const img = result.find({ tag: 'img' })
    expect(img).not.toBeNull()
    expect(img!.props['data-slot']).toBe('avatar-image')
  })

  test('has resolved base CSS classes', () => {
    const img = result.find({ tag: 'img' })!
    expect(img.classes).toContain('aspect-square')
    expect(img.classes).toContain('size-full')
  })
})

describe('AvatarFallback', () => {
  const result = renderToTest(avatarSource, 'avatar.tsx', 'AvatarFallback')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AvatarFallback', () => {
    expect(result.componentName).toBe('AvatarFallback')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is a span with data-slot=avatar-fallback', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['data-slot']).toBe('avatar-fallback')
  })

  test('has resolved base CSS classes', () => {
    const span = result.find({ tag: 'span' })!
    expect(span.classes).toContain('flex')
    expect(span.classes).toContain('items-center')
    expect(span.classes).toContain('justify-center')
    expect(span.classes).toContain('bg-muted')
  })
})
