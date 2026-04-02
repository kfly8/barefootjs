/**
 * Cart Reference Page (/components/cart)
 */

import { CartDemo } from '@/components/cart-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'

function Cart() {
  const [items, setItems] = createSignal([...])

  // Derived state chain
  const subtotal = createMemo(() => items().reduce(...))
  const discount = createMemo(() => subtotal() >= 200 ? ... : 0)
  const tax = createMemo(() => (subtotal() - discount()) * 0.08)
  const total = createMemo(() => subtotal() - discount() + tax())

  return (
    <div>
      {items().map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => updateQuantity(item.id, -1)}>−</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, 1)}>+</button>
        </div>
      ))}
      <div>Total: {formatPrice(total())}</div>
    </div>
  )
}`

export function CartRefPage() {
  return (
    <DocPage slug="cart" toc={tocItems}>
      <PageHeader
        title="Cart"
        description="A shopping cart with inline quantity editing, item removal, and a derived state chain for pricing (subtotal → discount → tax → total)."
      />

      <Section id="preview" title="Preview">
        <Example code={previewCode}>
          <CartDemo />
        </Example>
      </Section>

      <Section id="features" title="Features">
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Inline editing:</strong> +/− buttons update quantity per item</li>
          <li><strong>Derived state chain:</strong> subtotal → discount → tax → total via 4 chained createMemo</li>
          <li><strong>Conditional discount:</strong> 10% off when subtotal exceeds $200</li>
          <li><strong>Remove item:</strong> Filters array, triggers reconciliation</li>
          <li><strong>Empty state:</strong> Conditional rendering when all items removed</li>
          <li><strong>Line totals:</strong> Per-item price × quantity computed in template</li>
        </ul>
      </Section>
    </DocPage>
  )
}
