// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion'

export function Default() {
  const [openItem, setOpenItem] = createSignal<string | null>(null)

  return (
    <Accordion>
      <AccordionItem value="item-1" open={openItem() === 'item-1'} onOpenChange={(v) => setOpenItem(v ? 'item-1' : null)}>
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content for section 1</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

