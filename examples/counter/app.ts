/**
 * BareJS Counter Example
 *
 * counter.tsのロジックを使用し、DOMと接続する。
 */

import {
  type CounterValueEl,
  type DoubledValueEl,
  type IncrementBtn,
  type DecrementBtn,
  type ResetBtn,
  updateAll,
  handleIncrement,
  handleDecrement,
  handleReset,
} from './counter'

// ============================================
// DOM参照（1回だけ取得）
// ============================================
const counterValueEl: CounterValueEl = document.getElementById('counter')!
const doubledValueEl: DoubledValueEl = document.getElementById('doubled')!
const incrementBtn: IncrementBtn = document.getElementById('increment')!
const decrementBtn: DecrementBtn = document.getElementById('decrement')!
const resetBtn: ResetBtn = document.getElementById('reset')!

// ============================================
// イベント登録
// ============================================
incrementBtn.addEventListener('click', () =>
  handleIncrement(counterValueEl, doubledValueEl)
)
decrementBtn.addEventListener('click', () =>
  handleDecrement(counterValueEl, doubledValueEl)
)
resetBtn.addEventListener('click', () =>
  handleReset(counterValueEl, doubledValueEl)
)

// ============================================
// 初期化
// ============================================
updateAll(counterValueEl, doubledValueEl)
