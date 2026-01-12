// src/reactive.ts
var currentEffect = null;
var effectDepth = 0;
var MAX_EFFECT_RUNS = 100;
function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set;
  const get = () => {
    if (currentEffect) {
      subscribers.add(currentEffect);
      currentEffect.dependencies.add(subscribers);
    }
    return value;
  };
  const set = (valueOrFn) => {
    const newValue = typeof valueOrFn === "function" ? valueOrFn(value) : valueOrFn;
    if (Object.is(value, newValue)) {
      return;
    }
    value = newValue;
    const effectsToRun = [...subscribers];
    for (const effect of effectsToRun) {
      runEffect(effect);
    }
  };
  return [get, set];
}
function createEffect(fn) {
  if (currentEffect !== null) {
    throw new Error("createEffect cannot be nested inside another effect");
  }
  const effect = {
    fn,
    cleanup: null,
    dependencies: new Set
  };
  runEffect(effect);
}
function runEffect(effect) {
  effectDepth++;
  if (effectDepth > MAX_EFFECT_RUNS) {
    effectDepth = 0;
    throw new Error(`Effect exceeded maximum run limit (${MAX_EFFECT_RUNS}). Possible circular dependency.`);
  }
  if (effect.cleanup) {
    effect.cleanup();
    effect.cleanup = null;
  }
  for (const dep of effect.dependencies) {
    dep.delete(effect);
  }
  effect.dependencies.clear();
  const prevEffect = currentEffect;
  currentEffect = effect;
  try {
    const result = effect.fn();
    if (typeof result === "function") {
      effect.cleanup = result;
    }
  } finally {
    currentEffect = prevEffect;
    effectDepth--;
  }
}
function onCleanup(fn) {
  if (currentEffect) {
    const effect = currentEffect;
    const prevCleanup = effect.cleanup;
    effect.cleanup = () => {
      if (prevCleanup)
        prevCleanup();
      fn();
    };
  }
}
function createMemo(fn) {
  const [value, setValue] = createSignal(undefined);
  let initialized = false;
  createEffect(() => {
    const result = fn();
    if (initialized) {
      setValue(result);
    } else {
      initialized = true;
      setValue(result);
    }
  });
  return value;
}
// src/portal.ts
function createPortal(children, container = document.body) {
  let element;
  if (children instanceof HTMLElement) {
    element = children;
  } else {
    const html = typeof children === "string" ? children : children.toString();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const parsed = temp.firstElementChild;
    if (!parsed) {
      throw new Error("createPortal: Invalid HTML provided");
    }
    element = parsed;
  }
  container.appendChild(element);
  return {
    element,
    unmount() {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
}
// src/list.ts
function reconcileList(container, items, getKey, renderItem) {
  if (!items) {
    return;
  }
  const activeElement = document.activeElement;
  const focusedKey = activeElement?.closest("[data-key]")?.getAttribute("data-key");
  const focusedSelector = activeElement?.tagName?.toLowerCase();
  const focusedEventId = activeElement?.getAttribute("data-event-id");
  const existingByKey = new Map;
  for (const child of Array.from(container.children)) {
    const el = child;
    const key = el.dataset.key;
    if (key !== undefined) {
      existingByKey.set(key, el);
    }
  }
  const fragment = document.createDocumentFragment();
  for (let i = 0;i < items.length; i++) {
    const item = items[i];
    const key = getKey(item, i);
    const html = renderItem(item, i);
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const newEl = template.content.firstChild;
    let el;
    if (existingByKey.has(key)) {
      el = existingByKey.get(key);
      existingByKey.delete(key);
      updateAttributes(el, newEl);
      const hasFocusedInput = container.contains(activeElement) && (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA");
      if (hasFocusedInput) {
        updateChildrenSelectively(el, newEl);
      } else {
        el.innerHTML = newEl.innerHTML;
      }
    } else {
      el = newEl;
    }
    fragment.appendChild(el);
  }
  container.innerHTML = "";
  container.appendChild(fragment);
  if (focusedKey && focusedSelector && container.contains(document.activeElement) === false) {
    const keyEl = container.querySelector(`[data-key="${focusedKey}"]`);
    if (keyEl) {
      let targetEl = null;
      if (focusedEventId) {
        targetEl = keyEl.querySelector(`${focusedSelector}[data-event-id="${focusedEventId}"]`);
      }
      if (!targetEl) {
        targetEl = keyEl.querySelector(focusedSelector);
      }
      if (targetEl && typeof targetEl.focus === "function") {
        targetEl.focus();
      }
    }
  }
}
function updateChildrenSelectively(existing, newEl) {
  const existingChildren = Array.from(existing.children);
  const newChildren = Array.from(newEl.children);
  for (let i = 0;i < newChildren.length && i < existingChildren.length; i++) {
    const existingChild = existingChildren[i];
    const newChild = newChildren[i];
    if (existingChild.tagName !== newChild.tagName) {
      existingChild.replaceWith(newChild.cloneNode(true));
      continue;
    }
    if (existingChild.tagName === "INPUT" || existingChild.tagName === "TEXTAREA") {
      updateAttributesExcept(existingChild, newChild, ["value", "checked"]);
    } else {
      updateAttributes(existingChild, newChild);
      if (!existingChild.querySelector("input, textarea")) {
        existingChild.textContent = newChild.textContent;
      } else {
        updateChildrenSelectively(existingChild, newChild);
      }
    }
  }
  if (newChildren.length > existingChildren.length) {
    for (let i = existingChildren.length;i < newChildren.length; i++) {
      existing.appendChild(newChildren[i].cloneNode(true));
    }
  }
  if (existingChildren.length > newChildren.length) {
    for (let i = existingChildren.length - 1;i >= newChildren.length; i--) {
      existingChildren[i].remove();
    }
  }
}
function updateAttributesExcept(existing, newEl, excludeAttrs) {
  const excludeSet = new Set(excludeAttrs.map((a) => a.toLowerCase()));
  const existingAttrs = Array.from(existing.attributes);
  for (const attr of existingAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && !newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name);
    }
  }
  const newAttrs = Array.from(newEl.attributes);
  for (const attr of newAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value);
    }
  }
}
function updateAttributes(existing, newEl) {
  const existingAttrs = Array.from(existing.attributes);
  for (const attr of existingAttrs) {
    if (!newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name);
    }
  }
  const newAttrs = Array.from(newEl.attributes);
  for (const attr of newAttrs) {
    if (existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value);
    }
  }
}
// src/runtime.ts
function unwrap(prop) {
  return typeof prop === "function" ? prop() : prop;
}
function findScope(name, idx, parent) {
  if (parent?.dataset?.bfScope?.startsWith(`${name}_`)) {
    return parent;
  }
  const searchRoot = parent || document;
  const allScopes = Array.from(searchRoot.querySelectorAll(`[data-bf-scope^="${name}_"]`));
  const uninitializedScopes = allScopes.filter((s) => !s.hasAttribute("data-bf-init"));
  const scope = uninitializedScopes[idx] || null;
  if (scope) {
    scope.setAttribute("data-bf-init", "true");
  }
  return scope;
}
function find(scope, selector) {
  if (!scope)
    return null;
  if (scope.matches?.(selector))
    return scope;
  for (const el of scope.querySelectorAll(selector)) {
    if (el.closest("[data-bf-scope]") === scope) {
      return el;
    }
  }
  return null;
}
function hydrate(name, init) {
  const scopeEls = document.querySelectorAll(`[data-bf-scope^="${name}_"]`);
  for (const scopeEl of scopeEls) {
    if (scopeEl.parentElement?.closest("[data-bf-scope]"))
      continue;
    const instanceId = scopeEl.dataset.bfScope;
    const propsEl = document.querySelector(`script[data-bf-props="${instanceId}"]`);
    const props = propsEl ? JSON.parse(propsEl.textContent || "{}") : {};
    init(props, 0, scopeEl);
  }
}
var BOOLEAN_PROPS = [
  "disabled",
  "checked",
  "hidden",
  "readOnly",
  "required",
  "multiple",
  "autofocus",
  "autoplay",
  "controls",
  "loop",
  "muted",
  "selected",
  "open"
];
function bind(el, props) {
  if (!el || !props)
    return;
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && key.length > 2 && typeof value === "function") {
      const eventName = key[2].toLowerCase() + key.slice(3);
      el.addEventListener(eventName, value);
    } else if (typeof value === "function") {
      const getter = value;
      if (BOOLEAN_PROPS.includes(key)) {
        createEffect(() => {
          el[key] = !!getter();
        });
      } else {
        createEffect(() => {
          const v = getter();
          if (v != null)
            el.setAttribute(key, String(v));
          else
            el.removeAttribute(key);
        });
      }
    }
  }
}
function cond(scope, id, conditionFn, templateFns, handlers) {
  if (!scope)
    return;
  const [whenTrueTemplateFn, whenFalseTemplateFn] = templateFns;
  const sampleTrue = whenTrueTemplateFn();
  const sampleFalse = whenFalseTemplateFn();
  const isFragmentCond = sampleTrue.includes(`<!--bf-cond-start:${id}-->`) || sampleFalse.includes(`<!--bf-cond-start:${id}-->`);
  let prevCond;
  createEffect(() => {
    const currCond = Boolean(conditionFn());
    const isFirstRun = prevCond === undefined;
    const prevVal = prevCond;
    prevCond = currCond;
    if (isFirstRun) {
      if (!currCond)
        return;
    } else if (currCond === prevVal) {
      return;
    }
    if (!isFirstRun) {
      const html = currCond ? whenTrueTemplateFn() : whenFalseTemplateFn();
      if (isFragmentCond) {
        updateFragmentConditional(scope, id, html);
      } else {
        updateElementConditional(scope, id, html);
      }
    }
    if (handlers) {
      for (const { selector, event, handler } of handlers) {
        const el = find(scope, selector);
        if (el) {
          el[`on${event}`] = handler;
        }
      }
    }
  });
}
function updateFragmentConditional(scope, id, html) {
  let startComment = null;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT);
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue === `bf-cond-start:${id}`) {
      startComment = walker.currentNode;
      break;
    }
  }
  const condEl = scope.querySelector(`[data-bf-cond="${id}"]`);
  if (startComment) {
    const nodesToRemove = [];
    let node = startComment.nextSibling;
    while (node && !(node.nodeType === 8 && node.nodeValue === `bf-cond-end:${id}`)) {
      nodesToRemove.push(node);
      node = node.nextSibling;
    }
    const endComment = node;
    nodesToRemove.forEach((n) => n.parentNode?.removeChild(n));
    const template = document.createElement("template");
    template.innerHTML = html;
    const newNodes = [];
    let child = template.content.firstChild;
    while (child) {
      if (!(child.nodeType === 8 && child.nodeValue?.startsWith("bf-cond-"))) {
        newNodes.push(child.cloneNode(true));
      }
      child = child.nextSibling;
    }
    newNodes.forEach((n) => startComment.parentNode?.insertBefore(n, endComment));
  } else if (condEl) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const firstChild = template.content.firstChild;
    if (firstChild?.nodeType === 8 && firstChild?.nodeValue === `bf-cond-start:${id}`) {
      const parent = condEl.parentNode;
      const nodes = Array.from(template.content.childNodes).map((n) => n.cloneNode(true));
      nodes.forEach((n) => parent?.insertBefore(n, condEl));
      condEl.remove();
    } else if (firstChild) {
      condEl.replaceWith(firstChild.cloneNode(true));
    }
  }
}
function updateElementConditional(scope, id, html) {
  const condEl = scope.querySelector(`[data-bf-cond="${id}"]`);
  if (!condEl)
    return;
  const template = document.createElement("template");
  template.innerHTML = html;
  const newEl = template.content.firstChild;
  if (newEl) {
    condEl.replaceWith(newEl.cloneNode(true));
  }
}
export {
  unwrap,
  reconcileList,
  onCleanup,
  hydrate,
  findScope,
  find,
  createSignal,
  createPortal,
  createMemo,
  createEffect,
  cond,
  bind
};
