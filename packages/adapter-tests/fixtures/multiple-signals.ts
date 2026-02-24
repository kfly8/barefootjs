import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'multiple-signals',
  description: 'Multiple signals of different types (string + number)',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function MultipleSignals() {
  const [name, setName] = createSignal('')
  const [age, setAge] = createSignal(0)
  return <div><span>{name()}</span><span>{age()}</span></div>
}
`,
})
