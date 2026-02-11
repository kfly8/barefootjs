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

  describe('variable declarations with initializer', () => {
    test('strips type annotation but keeps initializer', () => {
      expect(stripTypeScriptSyntax("let x: string = ''")).toBe("let x = ''")
    })

    test('strips type annotation from const with initializer', () => {
      expect(stripTypeScriptSyntax('const count: number = 0')).toBe('const count = 0')
    })
  })
})
