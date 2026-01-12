/**
 * BarefootJS Minimal Runtime for non-JS servers
 *
 * This is a standalone version of @barefootjs/dom primitives
 * for use with server-side templates (Perl, Ruby, Python, etc.)
 */

// Reactive system
let currentEffect = null;

export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const get = () => {
    if (currentEffect) {
      subscribers.add(currentEffect);
    }
    return value;
  };

  const set = (valueOrFn) => {
    const newValue = typeof valueOrFn === 'function' ? valueOrFn(value) : valueOrFn;
    if (Object.is(value, newValue)) return;
    value = newValue;
    for (const effect of [...subscribers]) {
      effect();
    }
  };

  return [get, set];
}

export function createEffect(fn) {
  const effect = () => {
    currentEffect = effect;
    try {
      fn();
    } finally {
      currentEffect = null;
    }
  };
  effect();
}

export function createMemo(fn) {
  const [value, setValue] = createSignal();
  createEffect(() => setValue(fn()));
  return value;
}

/**
 * Find scope element for a component
 */
export function findScope(name, instanceIndex = 0, parentScope = null) {
  const container = parentScope || document;
  const allScopes = Array.from(container.querySelectorAll(`[data-bf-scope^="${name}_"]`));
  const uninitializedScopes = allScopes.filter(s => !s.hasAttribute('data-bf-init'));
  const scope = uninitializedScopes[instanceIndex];
  if (scope) {
    scope.setAttribute('data-bf-init', 'true');
  }
  return scope;
}

/**
 * Find element within scope by data-bf id
 */
export function find(scope, id) {
  if (!scope) return null;
  return scope.querySelector(`[data-bf="${id}"]`);
}

/**
 * Auto-hydration helper
 */
export function hydrate(name, initFn) {
  const scopeEls = document.querySelectorAll(`[data-bf-scope^="${name}_"]`);
  for (const scopeEl of scopeEls) {
    if (scopeEl.parentElement?.closest('[data-bf-scope]')) continue;
    const instanceId = scopeEl.dataset.bfScope;
    const propsEl = document.querySelector(`script[data-bf-props="${instanceId}"]`);
    const props = propsEl ? JSON.parse(propsEl.textContent || '{}') : {};
    initFn(props, 0, scopeEl);
  }
}
