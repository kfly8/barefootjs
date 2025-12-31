"use client"

/**
 * Dashboard with feature flag-based conditional rendering
 *
 * Tests server-side conditional rendering where the server decides
 * which widgets to show based on feature flags.
 */

import { createSignal } from '@barefootjs/dom'

type Props = {
  showCounter?: boolean
  showMessage?: boolean
  initialCount?: number
  message?: string
}

function Dashboard({ showCounter = true, showMessage = true, initialCount = 0, message = 'Hello' }: Props) {
  const [count, setCount] = createSignal(initialCount)
  const [text, setText] = createSignal(message)

  return (
    <div class="dashboard">
      <h2>Dashboard (Feature Flags)</h2>

      {showCounter && (
        <div class="widget counter-widget">
          <h3>Counter Widget</h3>
          <p class="count">{count()}</p>
          <button onClick={() => setCount(n => n + 1)}>+1</button>
          <button onClick={() => setCount(n => n - 1)}>-1</button>
        </div>
      )}

      {showMessage && (
        <div class="widget message-widget">
          <h3>Message Widget</h3>
          <p class="message">{text()}</p>
          <input
            type="text"
            value={text()}
            onInput={(e) => setText(e.target.value)}
            placeholder="Enter message..."
          />
        </div>
      )}

      {!showCounter && !showMessage && (
        <p class="no-widgets">No widgets enabled</p>
      )}
    </div>
  )
}

export default Dashboard
