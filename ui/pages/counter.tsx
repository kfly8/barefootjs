/**
 * Counter Documentation Page
 */

import { Counter } from '@/components/Counter'
import { CounterInteractiveDemo, CounterDerivedDemo } from '@/components/CounterDemo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../_shared/docs'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

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

export function CounterPage() {
  return (
    <DocPage slug="counter" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Counter"
          description="A numeric input with increment and decrement buttons."
        />

        {/* Preview */}
        <Example title="" code={`<Counter />`}>
          <CounterInteractiveDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Basic" code={basicCode}>
              <CounterInteractiveDemo />
            </Example>

            <Example title="Derived State (Memo)" code={derivedCode}>
              <CounterDerivedDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <Counter value={5} disabled />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={counterProps} />
        </Section>
      </div>
    </DocPage>
  )
}
