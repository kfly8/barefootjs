"use client"
/**
 * Counter Documentation Page
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Counter } from '../components/Counter'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add counter`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import { Counter } from '@/components/counter'

export default function Page() {
  const [count, setCount] = createSignal(0)
  return (
    <Counter
      value={count()}
      onIncrement={() => setCount(n => n + 1)}
      onDecrement={() => setCount(n => n - 1)}
    />
  )
}`

const basicCode = `const [count, setCount] = createSignal(0)

<Counter
  value={count()}
  onIncrement={() => setCount(n => n + 1)}
  onDecrement={() => setCount(n => n - 1)}
/>`

const derivedCode = `const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)
const isEven = createMemo(() => count() % 2 === 0)

<div>
  <Counter
    value={count()}
    onIncrement={() => setCount(n => n + 1)}
    onDecrement={() => setCount(n => n - 1)}
  />
  <p>Doubled: {doubled()}</p>
  <p>Is even: {isEven() ? 'Yes' : 'No'}</p>
</div>`

const disabledCode = `<Counter value={5} disabled />`

// Props definition
const counterProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'number',
    defaultValue: '0',
    description: 'The current value of the counter.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the counter is disabled.',
  },
  {
    name: 'onIncrement',
    type: '() => void',
    description: 'Event handler called when increment button is clicked.',
  },
  {
    name: 'onDecrement',
    type: '() => void',
    description: 'Event handler called when decrement button is clicked.',
  },
]

// Interactive example component
function InteractiveCounter() {
  const [count, setCount] = createSignal(0)
  return (
    <Counter
      value={count()}
      disabled={false}
      onIncrement={() => setCount(n => n + 1)}
      onDecrement={() => setCount(n => n - 1)}
    />
  )
}

// Derived state example
function DerivedCounter() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)
  const isEven = createMemo(() => count() % 2 === 0)

  return (
    <div class="space-y-2">
      <Counter
        value={count()}
        disabled={false}
        onIncrement={() => setCount(n => n + 1)}
        onDecrement={() => setCount(n => n - 1)}
      />
      <p class="text-zinc-100">Doubled: <span class="font-mono">{doubled()}</span></p>
      <p class="text-zinc-100">Is even: <span class="font-mono">{isEven() ? 'Yes' : 'No'}</span></p>
    </div>
  )
}

export function CounterPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Counter"
        description="A numeric input with increment and decrement buttons."
      />

      {/* Preview */}
      <Example title="" code={`<Counter />`}>
        <InteractiveCounter />
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Basic" code={basicCode}>
            <InteractiveCounter />
          </Example>

          <Example title="Derived State (Memo)" code={derivedCode}>
            <DerivedCounter />
          </Example>

          <Example title="Disabled" code={disabledCode}>
            <Counter value={5} disabled />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={counterProps} />
      </Section>
    </div>
  )
}
