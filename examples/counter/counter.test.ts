import { describe, test, expect, beforeEach } from 'bun:test'
import {
  type CounterValueEl,
  type DoubledValueEl,
  count,
  updateCounter,
  updateDoubled,
  updateAll,
  handleIncrement,
  handleDecrement,
  handleReset,
} from './counter'

describe('counter', () => {
  let counterValueEl: CounterValueEl
  let doubledValueEl: DoubledValueEl

  beforeEach(() => {
    // グローバルdocumentを使用（happydom.tsでセットアップ済み）
    document.body.innerHTML = `
      <p id="counter">0</p>
      <p id="doubled">doubled: 0</p>
    `
    counterValueEl = document.getElementById('counter')!
    doubledValueEl = document.getElementById('doubled')!

    // countをリセット
    count.set(0)
  })

  describe('updateCounter', () => {
    test('countの値を表示する', () => {
      count.set(5)
      updateCounter(counterValueEl)
      expect(counterValueEl.textContent).toBe('5')
    })
  })

  describe('updateDoubled', () => {
    test('countの2倍の値を表示する', () => {
      count.set(3)
      updateDoubled(doubledValueEl)
      expect(doubledValueEl.textContent).toBe('doubled: 6')
    })
  })

  describe('updateAll', () => {
    test('両方の表示を更新する', () => {
      count.set(4)
      updateAll(counterValueEl, doubledValueEl)
      expect(counterValueEl.textContent).toBe('4')
      expect(doubledValueEl.textContent).toBe('doubled: 8')
    })
  })

  describe('handleIncrement', () => {
    test('countを+1して表示を更新する', () => {
      handleIncrement(counterValueEl, doubledValueEl)
      expect(count()).toBe(1)
      expect(counterValueEl.textContent).toBe('1')
      expect(doubledValueEl.textContent).toBe('doubled: 2')
    })

    test('連続で呼び出せる', () => {
      handleIncrement(counterValueEl, doubledValueEl)
      handleIncrement(counterValueEl, doubledValueEl)
      handleIncrement(counterValueEl, doubledValueEl)
      expect(count()).toBe(3)
      expect(counterValueEl.textContent).toBe('3')
    })
  })

  describe('handleDecrement', () => {
    test('countを-1して表示を更新する', () => {
      count.set(5)
      handleDecrement(counterValueEl, doubledValueEl)
      expect(count()).toBe(4)
      expect(counterValueEl.textContent).toBe('4')
      expect(doubledValueEl.textContent).toBe('doubled: 8')
    })

    test('負の値になれる', () => {
      handleDecrement(counterValueEl, doubledValueEl)
      expect(count()).toBe(-1)
      expect(counterValueEl.textContent).toBe('-1')
      expect(doubledValueEl.textContent).toBe('doubled: -2')
    })
  })

  describe('handleReset', () => {
    test('countを0にリセットして表示を更新する', () => {
      count.set(100)
      handleReset(counterValueEl, doubledValueEl)
      expect(count()).toBe(0)
      expect(counterValueEl.textContent).toBe('0')
      expect(doubledValueEl.textContent).toBe('doubled: 0')
    })
  })
})
