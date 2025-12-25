import { describe, test, expect } from 'bun:test'
import { createSignal, createMemo, createEffect } from '../src/reactive'

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

describe('createMemo', () => {
  test('returns computed value', () => {
    const [count, setCount] = createSignal(2)
    const doubled = createMemo(() => count() * 2)

    expect(doubled()).toBe(4)
    setCount(5)
    expect(doubled()).toBe(10)
  })

  test('only recalculates when dependencies change', () => {
    let calcCount = 0
    const [count, setCount] = createSignal(1)
    const doubled = createMemo(() => {
      calcCount++
      return count() * 2
    })

    doubled()
    doubled()
    expect(calcCount).toBe(1) // cached, not recalculated

    setCount(2)
    expect(calcCount).toBe(2) // recalculated once
  })

  test('works with chained memos (A -> B -> C)', () => {
    const [a, setA] = createSignal(1)
    const b = createMemo(() => a() * 2)
    const c = createMemo(() => b() + 10)

    expect(c()).toBe(12) // 1*2 + 10
    setA(5)
    expect(c()).toBe(20) // 5*2 + 10
  })

  test('works as dependency in createEffect', () => {
    const results: number[] = []
    const [count, setCount] = createSignal(1)
    const doubled = createMemo(() => count() * 2)

    createEffect(() => {
      results.push(doubled())
    })

    expect(results).toEqual([2])
    setCount(3)
    expect(results).toEqual([2, 6])
  })
})
