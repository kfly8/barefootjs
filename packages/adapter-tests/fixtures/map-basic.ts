import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'map-basic',
  description: 'Basic array map rendering',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
type Item = { name: string }
export function MapBasic() {
  const [items, setItems] = createSignal<Item[]>([])
  return <ul>{items().map(item => <li>{item.name}</li>)}</ul>
}
`,
})
