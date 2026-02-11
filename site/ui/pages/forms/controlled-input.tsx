/**
 * Controlled Input Documentation Page
 *
 * Demonstrates Signal ↔ input value synchronization patterns.
 */

import { Input } from '@/components/ui/input'
import {
  BasicControlledDemo,
  CharacterCountDemo,
  LivePreviewDemo,
  MultiInputSyncDemo,
} from '@/components/controlled-input-demo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  type TocItem,
} from '../../components/shared/docs'
import { TableOfContents } from '@/components/table-of-contents'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'pattern-overview', title: 'Pattern Overview' },
  { id: 'examples', title: 'Examples' },
  { id: 'key-points', title: 'Key Points' },
]

// Code examples
const basicCode = `import { createSignal } from '@barefootjs/dom'
import { Input } from '@/components/ui/input'

const [text, setText] = createSignal('')

<Input
  inputValue={text()}
  onInput={(e) => setText(e.target.value)}
  inputPlaceholder="Type something..."
/>
<p>Current value: {text()}</p>`

const characterCountCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [text, setText] = createSignal('')
const charCount = createMemo(() => text().length)
const remaining = createMemo(() => 100 - text().length)

<Input
  inputValue={text()}
  onInput={(e) => setText(e.target.value)}
/>
<p>Characters: {charCount()}</p>
<p>{remaining()} remaining</p>`

const livePreviewCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [text, setText] = createSignal('')
const uppercase = createMemo(() => text().toUpperCase())
const wordCount = createMemo(() => {
  const trimmed = text().trim()
  return trimmed === '' ? 0 : trimmed.split(/\\s+/).length
})

<Input
  inputValue={text()}
  onInput={(e) => setText(e.target.value)}
/>
<p>Uppercase: {uppercase()}</p>
<p>Word count: {wordCount()}</p>`

const multiInputCode = `import { createSignal } from '@barefootjs/dom'

const [text, setText] = createSignal('')

// Both inputs share the same signal
<Input inputValue={text()} onInput={(e) => setText(e.target.value)} />
<Input inputValue={text()} onInput={(e) => setText(e.target.value)} />
<p>Shared value: {text()}</p>`

export function ControlledInputPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Controlled Input"
          description="Demonstrates Signal ↔ input value synchronization patterns for two-way data binding."
        />

        {/* Preview - Static example (interactive demos are in Examples section) */}
        <Example title="" code={basicCode}>
          <div className="max-w-sm">
            <Input inputPlaceholder="Type something..." />
            <p className="text-sm text-muted-foreground mt-2">
              See interactive examples below.
            </p>
          </div>
        </Example>

        {/* Pattern Overview */}
        <Section id="pattern-overview" title="Pattern Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The controlled input pattern uses <code className="text-foreground">value={'{signal()}'}</code> combined with{' '}
              <code className="text-foreground">onInput</code> to create two-way binding between a signal and an input element.
              This pattern enables real-time synchronization and derived computations.
            </p>
          </div>
          <CodeBlock code={basicCode} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic Two-Way Binding" code={basicCode}>
              <div className="max-w-sm">
                <BasicControlledDemo />
              </div>
            </Example>

            <Example title="Character Count" code={characterCountCode}>
              <div className="max-w-sm">
                <CharacterCountDemo />
              </div>
            </Example>

            <Example title="Live Preview" code={livePreviewCode}>
              <div className="max-w-sm">
                <LivePreviewDemo />
              </div>
            </Example>

            <Example title="Multi-Input Sync" code={multiInputCode}>
              <div className="max-w-sm">
                <MultiInputSyncDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Key Points */}
        <Section id="key-points" title="Key Points">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Pattern Structure</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="text-foreground">inputValue={'{signal()}'}</code> - Binds signal value to input</li>
                <li><code className="text-foreground">{'onInput={(e) => setSignal(e.target.value)}'}</code> - Updates signal on input</li>
                <li>Use <code className="text-foreground">createMemo</code> for derived values (character count, transformations)</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Use Cases</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Form validation with real-time feedback</li>
                <li>Character/word counters</li>
                <li>Live search/filter</li>
                <li>Synced inputs (e.g., mirrored text fields)</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
