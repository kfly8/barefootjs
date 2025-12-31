import { createSignal } from '@barefootjs/dom'

// Reusable toggle component with label
function ToggleItem({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = createSignal(defaultOn)
  return (
    <div class="toggle-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
      <span style="min-width: 120px;">{label}</span>
      <button
        onClick={() => setOn(!on())}
        style={`padding: 4px 12px; min-width: 60px; background: ${on() ? '#4caf50' : '#ccc'}; color: ${on() ? 'white' : 'black'}; border: none; border-radius: 4px; cursor: pointer;`}
      >
        {on() ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

// Settings panel with multiple toggles
function Toggle() {
  return (
    <div class="settings-panel" style="padding: 16px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="margin-top: 0;">Settings</h3>
      <ToggleItem label="Setting 1" defaultOn={true} />
      <ToggleItem label="Setting 2" defaultOn={false} />
      <ToggleItem label="Setting 3" defaultOn={false} />
    </div>
  )
}

export default Toggle
