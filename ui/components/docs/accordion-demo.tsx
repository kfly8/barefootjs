"use client"
/**
 * AccordionDemo Components
 *
 * Interactive demos for Accordion component.
 * Used in accordion documentation page.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion'

/**
 * Single open accordion (only one item can be open at a time)
 */
export function AccordionSingleOpenDemo() {
  const [openItem, setOpenItem] = createSignal<string | null>('item-1')

  // Computed open states for each item
  const isItem1Open = createMemo(() => openItem() === 'item-1')
  const isItem2Open = createMemo(() => openItem() === 'item-2')
  const isItem3Open = createMemo(() => openItem() === 'item-3')

  const toggle = (value: string) => {
    setOpenItem(openItem() === value ? null : value)
  }

  return (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={isItem1Open()}
          disabled={false}
          onClick={() => toggle('item-1')}
        >
          Is it accessible?
        </AccordionTrigger>
        <AccordionContent open={isItem1Open()}>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={isItem2Open()}
          disabled={false}
          onClick={() => toggle('item-2')}
        >
          Is it styled?
        </AccordionTrigger>
        <AccordionContent open={isItem2Open()}>
          Yes. It comes with default styles that match the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={isItem3Open()}
          disabled={false}
          onClick={() => toggle('item-3')}
        >
          Is it animated?
        </AccordionTrigger>
        <AccordionContent open={isItem3Open()}>
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
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={item1Open()}
          disabled={false}
          onClick={() => setItem1Open(!item1Open())}
        >
          First Item
        </AccordionTrigger>
        <AccordionContent open={item1Open()}>
          This accordion allows multiple items to be open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={item2Open()}
          disabled={false}
          onClick={() => setItem2Open(!item2Open())}
        >
          Second Item
        </AccordionTrigger>
        <AccordionContent open={item2Open()}>
          Each item manages its own open/close state independently.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={item3Open()}
          disabled={false}
          onClick={() => setItem3Open(!item3Open())}
        >
          Third Item
        </AccordionTrigger>
        <AccordionContent open={item3Open()}>
          Click any trigger to toggle that item without affecting others.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
