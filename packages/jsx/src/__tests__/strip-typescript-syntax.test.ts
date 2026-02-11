import { describe, test, expect } from 'bun:test'
import { stripTypeScriptSyntax } from '../ir-to-client-js/utils'

describe('stripTypeScriptSyntax', () => {
  describe('variable declarations without initializer', () => {
    test('strips simple type annotation', () => {
      expect(stripTypeScriptSyntax('let enterExitClass: string')).toBe('let enterExitClass')
    })

    test('strips union type annotation', () => {
      expect(stripTypeScriptSyntax('let x: number | null')).toBe('let x')
    })

    test('strips complex generic type annotation', () => {
      expect(stripTypeScriptSyntax('let timer: ReturnType<typeof setTimeout> | null')).toBe('let timer')
    })

    test('strips var declaration type annotation', () => {
      expect(stripTypeScriptSyntax('var x: string')).toBe('var x')
    })
  })

  describe('type assertions (as)', () => {
    test('strips simple type assertion', () => {
      expect(stripTypeScriptSyntax('e.target as HTMLElement')).toBe('e.target')
    })

    test('strips union type assertion', () => {
      expect(stripTypeScriptSyntax('document.activeElement as HTMLElement | null')).toBe('document.activeElement')
    })

    test('strips 3+ union type assertion', () => {
      expect(stripTypeScriptSyntax('value as string | number | null')).toBe('value')
    })

    test('strips generic + union type assertion', () => {
      expect(stripTypeScriptSyntax('value as Set<string> | null')).toBe('value')
    })

    test('strips union type assertion in method call result (issue #308)', () => {
      expect(
        stripTypeScriptSyntax('someElement.closest(\'[data-slot="trigger"]\') as HTMLElement | null')
      ).toBe('someElement.closest(\'[data-slot="trigger"]\')')
    })
  })

  describe('variable declarations with initializer', () => {
    test('strips type annotation but keeps initializer', () => {
      expect(stripTypeScriptSyntax("let x: string = ''")).toBe("let x = ''")
    })

    test('strips type annotation from const with initializer', () => {
      expect(stripTypeScriptSyntax('const count: number = 0')).toBe('const count = 0')
    })
  })
})
