"use client"

/**
 * Select Component
 *
 * Demonstrates reactive select dropdown with value binding.
 * Changes to the select update the displayed value in real-time.
 */

import { createSignal } from '@barefootjs/dom'

type Props = {
  initialValue?: string
}

function Select({ initialValue = 'option-a' }: Props) {
  const [selected, setSelected] = createSignal(initialValue)

  return (
    <>
      <div class="select-container">
        <label>Choose an option:</label>
        <select
          class="select"
          value={selected()}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="option-a">Option A</option>
          <option value="option-b">Option B</option>
          <option value="option-c">Option C</option>
        </select>
      </div>
      <p class="selected-value">Selected: {selected()}</p>
    </>
  )
}

export default Select
