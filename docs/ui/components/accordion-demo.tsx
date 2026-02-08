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
