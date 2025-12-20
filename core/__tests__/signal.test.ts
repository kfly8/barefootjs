import { describe, test, expect } from 'bun:test'
import { signal } from '../signal'

describe('signal', () => {
  test('初期値を取得できる', () => {
    const count = signal(0)
    expect(count()).toBe(0)
  })

  test('文字列の初期値を取得できる', () => {
    const name = signal('hello')
    expect(name()).toBe('hello')
  })

  test('オブジェクトの初期値を取得できる', () => {
    const user = signal({ name: 'Kenta', age: 30 })
    expect(user()).toEqual({ name: 'Kenta', age: 30 })
  })

  test('set()で値を更新できる', () => {
    const count = signal(0)
    count.set(5)
    expect(count()).toBe(5)
  })

  test('set()を複数回呼び出せる', () => {
    const count = signal(0)
    count.set(1)
    count.set(2)
    count.set(3)
    expect(count()).toBe(3)
  })

  test('update()で関数を使って値を更新できる', () => {
    const count = signal(0)
    count.update(n => n + 1)
    expect(count()).toBe(1)
  })

  test('update()を連続で呼び出せる', () => {
    const count = signal(0)
    count.update(n => n + 1)
    count.update(n => n + 1)
    count.update(n => n + 1)
    expect(count()).toBe(3)
  })

  test('update()でオブジェクトを更新できる', () => {
    const user = signal({ name: 'Kenta', age: 30 })
    user.update(u => ({ ...u, age: 31 }))
    expect(user()).toEqual({ name: 'Kenta', age: 31 })
  })

  test('配列のsignalを操作できる', () => {
    const items = signal<string[]>([])
    items.update(arr => [...arr, 'a'])
    items.update(arr => [...arr, 'b'])
    expect(items()).toEqual(['a', 'b'])
  })

  test('set()とupdate()を混在して使える', () => {
    const count = signal(0)
    count.set(10)
    count.update(n => n * 2)
    count.set(5)
    count.update(n => n + 1)
    expect(count()).toBe(6)
  })
})
