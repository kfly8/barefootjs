// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Drawer, DrawerTrigger, DrawerOverlay, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '../drawer'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <Drawer open={open()} onOpenChange={setOpen}>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerOverlay />
      <DrawerContent direction="bottom" ariaLabelledby="drawer-title">
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle id="drawer-title">Drawer Title</DrawerTitle>
          <DrawerDescription>Drawer description here.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

