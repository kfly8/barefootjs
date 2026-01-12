/**
 * Counter Component - Client JS
 *
 * This is what the BarefootJS compiler would generate.
 * Works with any server-side template that outputs the Marked Template.
 */

import { createSignal, createEffect, findScope, find, hydrate } from './barefoot.js';

export function initCounter(__props, __instanceIndex = 0, __parentScope = null) {
  const __scope = findScope('Counter', __instanceIndex, __parentScope);
  if (!__scope) return;

  // Find elements by data-bf attribute
  const _0 = find(__scope, '0');  // count display
  const _1 = find(__scope, '1');  // increment button
  const _2 = find(__scope, '2');  // decrement button

  // Initialize signal with prop or default
  const [count, setCount] = createSignal(__props.count ?? 0);

  // Reactive update for count display
  createEffect(() => {
    if (_0) _0.textContent = String(count());
  });

  // Event handlers
  if (_1) {
    _1.onclick = () => setCount(n => n + 1);
  }
  if (_2) {
    _2.onclick = () => setCount(n => n - 1);
  }
}

// Auto-hydration
hydrate('Counter', initCounter);
