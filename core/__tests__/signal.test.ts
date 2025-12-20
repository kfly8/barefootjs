import { describe, test, expect } from 'bun:test'
import { signal } from '../signal'

describe('signal', () => {
  test('初期値を取得できる', () => {
    const [count] = signal(0)
    expect(count()).toBe(0)
  })

  test('文字列の初期値を取得できる', () => {
    const [name] = signal('hello')
    expect(name()).toBe('hello')
  })

  test('オブジェクトの初期値を取得できる', () => {
    const [user] = signal({ name: 'Kenta', age: 30 })
    expect(user()).toEqual({ name: 'Kenta', age: 30 })
  })

  test('setterで値を直接更新できる', () => {
    const [count, setCount] = signal(0)
    setCount(5)
    expect(count()).toBe(5)
  })

  test('setterを複数回呼び出せる', () => {
    const [count, setCount] = signal(0)
    setCount(1)
    setCount(2)
    setCount(3)
    expect(count()).toBe(3)
  })

  test('setterに関数を渡して値を更新できる', () => {
    const [count, setCount] = signal(0)
    setCount(n => n + 1)
    expect(count()).toBe(1)
  })

  test('setterに関数を連続で渡せる', () => {
    const [count, setCount] = signal(0)
    setCount(n => n + 1)
    setCount(n => n + 1)
    setCount(n => n + 1)
    expect(count()).toBe(3)
  })

  test('setterでオブジェクトを更新できる', () => {
    const [user, setUser] = signal({ name: 'Kenta', age: 30 })
    setUser(u => ({ ...u, age: 31 }))
    expect(user()).toEqual({ name: 'Kenta', age: 31 })
  })

  test('配列のsignalを操作できる', () => {
    const [items, setItems] = signal<string[]>([])
    setItems(arr => [...arr, 'a'])
    setItems(arr => [...arr, 'b'])
    expect(items()).toEqual(['a', 'b'])
  })

  test('値と関数を混在して使える', () => {
    const [count, setCount] = signal(0)
    setCount(10)
    setCount(n => n * 2)
    setCount(5)
    setCount(n => n + 1)
    expect(count()).toBe(6)
  })
})
