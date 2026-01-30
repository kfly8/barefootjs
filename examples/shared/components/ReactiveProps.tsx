'use client'

/**
 * ReactiveProps Component
 *
 * Tests reactivity model documented in spec/compiler.md:
 * 1. Signal access via getter calls: count()
 * 2. Parent-to-child reactive props propagation
 * 3. Callback props from child to parent
 */

import { createSignal, createMemo } from '@barefootjs/dom'

// Child component that receives reactive props
type ChildProps = {
  value: number
  label: string
  onIncrement: () => void
}

function ReactiveChild({ value, label, onIncrement }: ChildProps) {
  return (
    <div className="reactive-child">
      <span className="child-label">{label}</span>
      <span className="child-value">{value}</span>
      <button className="btn-child-increment" onClick={() => onIncrement()}>
        Increment from child
      </button>
    </div>
  )
}

// Parent component with signal
export function ReactiveProps() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)

  return (
    <div className="reactive-props-container">
      {/* Signal basic: count() getter call */}
      <div className="parent-section">
        <p className="parent-count">Parent count: {count()}</p>
        <p className="parent-doubled">Doubled: {doubled()}</p>
        <button className="btn-parent-increment" onClick={() => setCount(n => n + 1)}>
          +1
        </button>
      </div>

      {/* Parent-to-child reactive props */}
      <ReactiveChild
        value={count()}
        label="Child A"
        onIncrement={() => setCount(n => n + 1)}
      />

      {/* Multiple children with same reactive prop */}
      <ReactiveChild
        value={doubled()}
        label="Child B (doubled)"
        onIncrement={() => setCount(n => n + 1)}
      />
    </div>
  )
}

export default ReactiveProps
