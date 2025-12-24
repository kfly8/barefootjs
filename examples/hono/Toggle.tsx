import { createSignal } from '@barefootjs/dom'

function Toggle() {
  const [on, setOn] = createSignal(false)
  return (
    <div class="toggle">
      <span>{on() ? 'ON' : 'OFF'}</span>
      <button onClick={() => setOn(!on())}>Toggle</button>
    </div>
  )
}

export default Toggle
