/**
 * Reactive primitives micro-benchmark
 *
 * Measures raw signal/effect performance to establish a baseline
 * for fine-grained reactivity claims.
 */
import {
  createSignal,
  createEffect,
  createMemo,
  createRoot,
  batch,
} from '../packages/client/src/index.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function measure(label: string, fn: () => void, iterations = 1): number {
  // Warm up
  for (let i = 0; i < 5; i++) fn()

  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  const median = times[Math.floor(times.length / 2)]
  return median
}

function report(label: string, ms: number, ops?: number) {
  const opsStr = ops ? ` (${(ops / ms * 1000).toFixed(0)} ops/sec)` : ''
  console.log(`  ${label.padEnd(40)} ${ms.toFixed(3)} ms${opsStr}`)
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

console.log('\n=== Reactive Primitives Benchmark ===\n')

// 1. Signal creation
{
  const N = 100_000
  const ms = measure('signal creation', () => {
    createRoot(() => {
      for (let i = 0; i < N; i++) {
        createSignal(i)
      }
    })
  }, 20)
  report(`Create ${N.toLocaleString()} signals`, ms, N)
}

// 2. Signal read
{
  const N = 100_000
  const signals = Array.from({ length: N }, (_, i) => createSignal(i))
  const ms = measure('signal read', () => {
    let sum = 0
    for (let i = 0; i < N; i++) {
      sum += signals[i][0]()
    }
  }, 20)
  report(`Read ${N.toLocaleString()} signals`, ms, N)
}

// 3. Signal write (no subscribers)
{
  const N = 100_000
  const signals = Array.from({ length: N }, (_, i) => createSignal(i))
  const ms = measure('signal write (no subscribers)', () => {
    for (let i = 0; i < N; i++) {
      signals[i][1](i + 1)
    }
  }, 20)
  report(`Write ${N.toLocaleString()} signals (no sub)`, ms, N)
}

// 4. Signal write → 1 effect (targeted update)
{
  const N = 10_000
  createRoot(() => {
    const [get, set] = createSignal(0)
    createEffect(() => { get() })
    const ms = measure('signal → 1 effect', () => {
      for (let i = 0; i < N; i++) {
        set(i)
      }
    }, 20)
    report(`Update signal → 1 effect × ${N.toLocaleString()}`, ms, N)
  })
}

// 5. Fan-out: 1 signal → N effects
{
  const EFFECTS = 1000
  createRoot(() => {
    const [get, set] = createSignal(0)
    for (let i = 0; i < EFFECTS; i++) {
      createEffect(() => { get() })
    }
    const ms = measure(`1 signal → ${EFFECTS} effects`, () => {
      set((v) => v + 1)
    }, 100)
    report(`Fan-out: 1 signal → ${EFFECTS} effects`, ms, EFFECTS)
  })
}

// 6. Deep chain: s0 → memo1 → memo2 → ... → memoN → effect
{
  const DEPTH = 100
  createRoot(() => {
    const [get, set] = createSignal(0)
    let current: () => number = get
    for (let i = 0; i < DEPTH; i++) {
      const prev = current
      current = createMemo(() => prev() + 1)
    }
    const last = current
    createEffect(() => { last() })
    const UPDATES = 1000
    const ms = measure(`deep chain (${DEPTH})`, () => {
      for (let i = 0; i < UPDATES; i++) {
        set(i)
      }
    }, 20)
    report(`Deep chain (${DEPTH} memos) × ${UPDATES} updates`, ms, UPDATES)
  })
}

// 6b. Deep chain with batch: same as above but wrapped in batch()
{
  const DEPTH = 100
  createRoot(() => {
    const [get, set] = createSignal(0)
    let current: () => number = get
    for (let i = 0; i < DEPTH; i++) {
      const prev = current
      current = createMemo(() => prev() + 1)
    }
    const last = current
    createEffect(() => { last() })
    const UPDATES = 1000
    const ms = measure(`deep chain batched (${DEPTH})`, () => {
      batch(() => {
        for (let i = 0; i < UPDATES; i++) {
          set(i)
        }
      })
    }, 20)
    report(`Deep chain batched (${DEPTH} memos) × ${UPDATES}`, ms, UPDATES)
  })
}

// 7. Wide + deep: N independent signal → memo → effect chains
{
  const CHAINS = 1000
  createRoot(() => {
    const signals: [() => number, (v: number | ((prev: number) => number)) => void][] = []
    for (let i = 0; i < CHAINS; i++) {
      const [get, set] = createSignal(0)
      const doubled = createMemo(() => get() * 2)
      createEffect(() => { doubled() })
      signals.push([get, set])
    }
    const ms = measure(`${CHAINS} independent chains`, () => {
      for (let i = 0; i < CHAINS; i++) {
        signals[i][1](i)
      }
    }, 20)
    report(`${CHAINS} independent signal→memo→effect`, ms, CHAINS)
  })
}

// 8. Partial update: 1000 signals, update every 10th
{
  const ROWS = 1000
  let effectRunCount = 0
  createRoot(() => {
    const signals: [() => number, (v: number | ((prev: number) => number)) => void][] = []
    for (let i = 0; i < ROWS; i++) {
      const [get, set] = createSignal(i)
      createEffect(() => {
        get()
        effectRunCount++
      })
      signals.push([get, set])
    }
    effectRunCount = 0
    const ms = measure('partial update (every 10th)', () => {
      for (let i = 0; i < ROWS; i += 10) {
        signals[i][1]((v) => v + 1)
      }
    }, 100)
    report(`Partial update: ${ROWS / 10} of ${ROWS} rows`, ms, ROWS / 10)
    console.log(`    → Effects run: ${effectRunCount / 100} per iteration (expect ${ROWS / 10})`)
  })
}

console.log('')
