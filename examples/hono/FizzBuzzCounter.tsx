/**
 * Conditional Counter Component
 *
 * Demonstrates conditional rendering with element switching:
 * - When showing details: Displays count with doubled value
 * - Otherwise: Shows simple count
 */

import { createSignal, createMemo } from '@barefootjs/dom'

function FizzBuzzCounter() {
  const [count, setCount] = createSignal(0)
  const [showDetails, setShowDetails] = createSignal(false)
  const doubled = createMemo(() => count() * 2)

  return (
    <div class="conditional-counter">
      <div class="display">
        {showDetails() ? (
          <div class="details">
            <span class="count">Count: {count()}</span>
            <span class="doubled">Doubled: {doubled()}</span>
          </div>
        ) : (
          <span class="simple">{count()}</span>
        )}
      </div>
      <div class="controls">
        <button onClick={() => setCount(n => n + 1)}>+1</button>
        <button onClick={() => setCount(n => n - 1)}>-1</button>
        <button onClick={() => setShowDetails(!showDetails())}>
          Toggle Details
        </button>
      </div>
    </div>
  )
}

export default FizzBuzzCounter
