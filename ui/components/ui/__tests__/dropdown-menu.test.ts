import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const dropdownMenuSource = readFileSync(resolve(__dirname, '../dropdown-menu.tsx'), 'utf-8')

describe('DropdownMenu', () => {
  const result = renderToTest(dropdownMenuSource, 'dropdown-menu.tsx', 'DropdownMenu')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is DropdownMenu', () => {
    expect(result.componentName).toBe('DropdownMenu')
  })

  test('no signals (open state from props via context)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders a div with data-slot=dropdown-menu', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('dropdown-menu')
  })
})

describe('DropdownMenuTrigger', () => {
  const result = renderToTest(dropdownMenuSource, 'dropdown-menu.tsx', 'DropdownMenuTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DropdownMenuTrigger', () => {
    expect(result.componentName).toBe('DropdownMenuTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('button has aria-expanded and aria-haspopup', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.aria).toHaveProperty('expanded')
    expect(button!.aria).toHaveProperty('haspopup')
  })
})

describe('DropdownMenuContent', () => {
  const result = renderToTest(dropdownMenuSource, 'dropdown-menu.tsx', 'DropdownMenuContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DropdownMenuContent', () => {
    expect(result.componentName).toBe('DropdownMenuContent')
  })

  test('has role=menu', () => {
    const menu = result.find({ role: 'menu' })
    expect(menu).not.toBeNull()
    expect(menu!.props['data-slot']).toBe('dropdown-menu-content')
  })

  test('has data-state attribute', () => {
    const menu = result.find({ role: 'menu' })!
    expect(menu.dataState).not.toBeNull()
  })
})

describe('DropdownMenuItem', () => {
  const result = renderToTest(dropdownMenuSource, 'dropdown-menu.tsx', 'DropdownMenuItem')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DropdownMenuItem', () => {
    expect(result.componentName).toBe('DropdownMenuItem')
  })

  test('has role=menuitem', () => {
    const item = result.find({ role: 'menuitem' })
    expect(item).not.toBeNull()
    expect(item!.props['data-slot']).toBe('dropdown-menu-item')
  })

})

describe('DropdownMenuSub', () => {
  const result = renderToTest(dropdownMenuSource, 'dropdown-menu.tsx', 'DropdownMenuSub')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DropdownMenuSub', () => {
    expect(result.componentName).toBe('DropdownMenuSub')
  })

  test('has signal: subOpen (createSignal)', () => {
    expect(result.signals).toContain('subOpen')
  })

  test('renders a div with data-slot=dropdown-menu-sub', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('dropdown-menu-sub')
  })
})
