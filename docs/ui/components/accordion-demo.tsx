"use client"
/**
 * AccordionDemo Components
 *
 * Interactive demos for Accordion component.
 * Used in accordion documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@ui/components/ui/accordion'

/**
 * Single open accordion (only one item can be open at a time)
 */
export function AccordionSingleOpenDemo() {
  const [openItem, setOpenItem] = createSignal<string | null>('item-1')

  return (
    <Accordion>
      <AccordionItem value="item-1" open={openItem() === 'item-1'} onOpenChange={(v) => setOpenItem(v ? 'item-1' : null)}>
        <AccordionTrigger>
          Is it accessible?
        </AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" open={openItem() === 'item-2'} onOpenChange={(v) => setOpenItem(v ? 'item-2' : null)}>
        <AccordionTrigger>
          Is it styled?
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" open={openItem() === 'item-3'} onOpenChange={(v) => setOpenItem(v ? 'item-3' : null)}>
        <AccordionTrigger>
          Is it animated?
        </AccordionTrigger>
        <AccordionContent>
          Yes. It uses CSS transitions for smooth open/close animations.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/**
 * Accordion with asChild trigger (mixed-mode: one asChild, one standard)
 * Tests keyboard navigation between display:contents and button triggers.
 */
export function AccordionAsChildDemo() {
  const [openItem, setOpenItem] = createSignal<string | null>(null)

  return (
    <div>
      <Accordion>
        <AccordionItem value="custom" open={openItem() === 'custom'} onOpenChange={(v) => setOpenItem(v ? 'custom' : null)}>
          <AccordionTrigger asChild>
            <button
              type="button"
              data-testid="accordion-aschild-trigger"
              className="flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all hover:underline focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            >
              Custom Trigger
            </button>
          </AccordionTrigger>
          <AccordionContent>
            This item uses a custom trigger element via asChild.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="standard" open={openItem() === 'standard'} onOpenChange={(v) => setOpenItem(v ? 'standard' : null)}>
          <AccordionTrigger>
            Standard Trigger
          </AccordionTrigger>
          <AccordionContent>
            This item uses the default button trigger.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <span data-testid="accordion-aschild-state">{openItem() === 'custom' ? 'open' : 'closed'}</span>
    </div>
  )
}

/**
 * Multiple open accordion (each item manages its own state)
 */
export function AccordionMultipleOpenDemo() {
  const [item1Open, setItem1Open] = createSignal(true)
  const [item2Open, setItem2Open] = createSignal(false)
  const [item3Open, setItem3Open] = createSignal(false)

  return (
    <Accordion>
      <AccordionItem value="item-1" open={item1Open()} onOpenChange={setItem1Open}>
        <AccordionTrigger>
          First Item
        </AccordionTrigger>
        <AccordionContent>
          This accordion allows multiple items to be open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" open={item2Open()} onOpenChange={setItem2Open}>
        <AccordionTrigger>
          Second Item
        </AccordionTrigger>
        <AccordionContent>
          Each item manages its own open/close state independently.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" open={item3Open()} onOpenChange={setItem3Open}>
        <AccordionTrigger>
          Third Item
        </AccordionTrigger>
        <AccordionContent>
          Click any trigger to toggle that item without affecting others.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
