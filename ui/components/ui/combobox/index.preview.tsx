"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxItem,
} from '../combobox'

export function Default() {
  const [value, setValue] = createSignal('')

  return (
    <Combobox value={value()} onValueChange={setValue}>
      <ComboboxTrigger className="w-[280px]">
        <ComboboxValue placeholder="Select framework..." />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search framework..." />
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxItem value="next">Next.js</ComboboxItem>
        <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
        <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
        <ComboboxItem value="remix">Remix</ComboboxItem>
        <ComboboxItem value="astro">Astro</ComboboxItem>
      </ComboboxContent>
    </Combobox>
  )
}
