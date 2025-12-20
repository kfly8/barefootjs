/**
 * Counter - ロジック部分
 */

import { signal } from 'barejs'

// ============================================
// 要素の型
// ============================================
export type CounterValueEl = HTMLElement
export type DoubledValueEl = HTMLElement
export type IncrementBtn = HTMLElement
export type DecrementBtn = HTMLElement
export type ResetBtn = HTMLElement

// ============================================
// 状態
// ============================================
export const count = signal(0)

// ============================================
// 更新関数
// ============================================

export function updateCounter(el: CounterValueEl): void {
  el.textContent = String(count())
}

export function updateDoubled(el: DoubledValueEl): void {
  el.textContent = `doubled: ${count() * 2}`
}

export function updateAll(
  counterValueEl: CounterValueEl,
  doubledValueEl: DoubledValueEl
): void {
  updateCounter(counterValueEl)
  updateDoubled(doubledValueEl)
}

// ============================================
// イベントハンドラ
// ============================================

export function handleIncrement(
  counterValueEl: CounterValueEl,
  doubledValueEl: DoubledValueEl
): void {
  count.update(n => n + 1)
  updateAll(counterValueEl, doubledValueEl)
}

export function handleDecrement(
  counterValueEl: CounterValueEl,
  doubledValueEl: DoubledValueEl
): void {
  count.update(n => n - 1)
  updateAll(counterValueEl, doubledValueEl)
}

export function handleReset(
  counterValueEl: CounterValueEl,
  doubledValueEl: DoubledValueEl
): void {
  count.set(0)
  updateAll(counterValueEl, doubledValueEl)
}
