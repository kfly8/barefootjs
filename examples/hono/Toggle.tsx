import { signal } from 'barefoot'

function Toggle() {
  const [on, setOn] = signal(false)
  return (
    <div class="toggle">
      <span>{on() ? 'ON' : 'OFF'}</span>
      <button onClick={() => setOn(!on())}>Toggle</button>
    </div>
  )
}

export default Toggle
