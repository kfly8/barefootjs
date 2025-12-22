import { describe, test, expect } from 'bun:test'
import { createSignal } from '../reactive'

describe('createSignal', () => {
  test('returns initial value', () => {
    const [count] = createSignal(0)
    expect(count()).toBe(0)
  })

  test('returns string initial value', () => {
    const [name] = createSignal('hello')
    expect(name()).toBe('hello')
  })

  test('returns object initial value', () => {
    const [user] = createSignal({ name: 'Kenta', age: 30 })
    expect(user()).toEqual({ name: 'Kenta', age: 30 })
  })

  test('setter updates value directly', () => {
    const [count, setCount] = createSignal(0)
    setCount(5)
    expect(count()).toBe(5)
  })

  test('setter can be called multiple times', () => {
    const [count, setCount] = createSignal(0)
    setCount(1)
    setCount(2)
    setCount(3)
    expect(count()).toBe(3)
  })

  test('setter accepts function to update value', () => {
    const [count, setCount] = createSignal(0)
    setCount(n => n + 1)
    expect(count()).toBe(1)
  })

  test('setter accepts function consecutively', () => {
    const [count, setCount] = createSignal(0)
    setCount(n => n + 1)
    setCount(n => n + 1)
    setCount(n => n + 1)
    expect(count()).toBe(3)
  })

  test('setter updates object', () => {
    const [user, setUser] = createSignal({ name: 'Kenta', age: 30 })
    setUser(u => ({ ...u, age: 31 }))
    expect(user()).toEqual({ name: 'Kenta', age: 31 })
  })

  test('handles array signals', () => {
    const [items, setItems] = createSignal<string[]>([])
    setItems(arr => [...arr, 'a'])
    setItems(arr => [...arr, 'b'])
    expect(items()).toEqual(['a', 'b'])
  })

  test('mixes direct values and functions', () => {
    const [count, setCount] = createSignal(0)
    setCount(10)
    setCount(n => n * 2)
    setCount(5)
    setCount(n => n + 1)
    expect(count()).toBe(6)
  })
})
