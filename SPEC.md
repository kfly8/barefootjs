# BarefootJS JSX Compiler Specification

This document defines the transformation rules for the BarefootJS JSX compiler. Each rule is assigned a unique ID and linked to corresponding test files.

## Overview

The BarefootJS compiler transforms JSX components into two outputs:
1. **Marked JSX** - Server-side JSX with hydration markers (`data-bf-scope`, `data-bf`, `data-bf-cond`)
2. **Client JS** - Minimal JavaScript for reactivity using `createEffect`

## Specification Categories

| Category | Prefix | Description |
|----------|--------|-------------|
| Basic JSX Syntax | JSX-XXX | Elements, text, fragments |
| Attributes | ATTR-XXX | Static, dynamic, spread attributes |
| Expressions | EXPR-XXX | Signals, memos, dynamic content |
| Control Flow | CTRL-XXX | Conditionals, lists |
| Components | COMP-XXX | Component composition, props, children |
| Events | EVT-XXX | Event handlers, delegation |
| Refs | REF-XXX | Ref callbacks |
| Edge Cases | EDGE-XXX | Whitespace, nesting, special cases |
| Out of Scope | OOS-XXX | Intentionally not supported |

---

## JSX: Basic JSX Syntax

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| JSX-001 | `<div>text</div>` | `<div data-bf-scope="C">text</div>` | jsx-to-ir.test.ts:30 | Plain text preserved |
| JSX-002 | `<div>\n  text\n</div>` | `<div>text</div>` | jsx-to-ir.test.ts:43 | Indentation whitespace removed |
| JSX-003 | `<span>a</span> <span>b</span>` | `<span>a</span> <span>b</span>` | jsx-to-ir.test.ts:58 | Inline spaces preserved |
| JSX-004 | `<div><span /></div>` | `<div><span /></div>` | jsx-to-ir.test.ts:145 | Nested elements preserved |
| JSX-005 | `<input />` | `<input />` | jsx-to-ir.test.ts:180 | Self-closing preserved |
| JSX-006 | `<br />` | `<br />` | jsx-to-ir.test.ts:193 | Void elements supported |
| JSX-007 | `<img src="x" />` | `<img src="x" />` | jsx-to-ir.test.ts:204 | Attributes on void elements |
| JSX-008 | `<></>` | `<></>` | jsx-to-ir.test.ts:218, fragment.test.ts:157 | Empty fragment |
| JSX-009 | `<><a/><b/></>` | `<><a/><b/></>` | jsx-to-ir.test.ts:229, fragment.test.ts:19 | Fragment with children |
| JSX-010 | `<><div>{signal()}</div></>` | `<><div data-bf-scope="C">{signal}</div></>` | fragment.test.ts:41 | Fragment with dynamic content |
| JSX-011 | `<><><a/></></>` | Nested fragments preserved | fragment.test.ts:66 | Nested fragments |
| JSX-012 | `<>text<span/></>` | `<>text<span/></>` | fragment.test.ts:119 | Mixed text and elements in fragment |
| JSX-013 | `<><div/></>` (single child) | `<><div data-bf-scope="C"/></>` | fragment.test.ts:139 | Single child gets scope marker |

---

## ATTR: Attributes

### Static Attributes

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| ATTR-001 | `<div id="x"></div>` | `<div id="x"></div>` | jsx-to-ir.test.ts:78 | String literals preserved |
| ATTR-002 | `<div disabled></div>` | `<div disabled={true}></div>` | jsx-to-ir.test.ts:157 | Boolean shorthand → true |
| ATTR-003 | `<div class="x"></div>` | `<div className="x"></div>` | ir-to-marked-jsx.test.ts:662 | class → className conversion |
| ATTR-004 | `<svg ...>` | `<svg xmlns="...">` | ir-to-marked-jsx.test.ts:644, svg-elements.test.ts:18 | SVG gets xmlns automatically |
| ATTR-005 | `<svg viewBox="0 0 100 100">` | `<svg viewBox="0 0 100 100">` | svg-elements.test.ts:39 | CamelCase SVG attrs preserved |

### Dynamic Attributes

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS Effect | Test File:Line | Notes |
|----|---------------|------------------------------|------------------|----------------|-------|
| ATTR-010 | `<div class={expr}></div>` | `<div class={expr} data-bf="0"></div>` | `createEffect(() => el.setAttribute('class', expr))` | jsx-to-ir.test.ts:92, attributes.test.ts:39 | Dynamic class |
| ATTR-011 | `<div style={obj}></div>` | `<div style={obj} data-bf="0"></div>` | `Object.assign(el.style, obj)` | attributes.test.ts:57, ir-to-client-js.test.ts:177 | Style object |
| ATTR-012 | `<div style={str}></div>` | `<div style={str} data-bf="0"></div>` | `el.style.cssText = str` | ir-to-client-js.test.ts:188 | Style string |
| ATTR-013 | `<div disabled={expr}></div>` | `<div disabled={expr} data-bf="0"></div>` | `el.disabled = expr` | attributes.test.ts:75, ir-to-client-js.test.ts:199 | Boolean attributes |
| ATTR-014 | `<input value={expr} />` | `<input value={expr} data-bf="0" />` | `el.value = expr ?? undefined` | attributes.test.ts:93, ir-to-client-js.test.ts:210 | Value with null check |
| ATTR-015 | `<div hidden={expr}></div>` | `<div hidden={expr} data-bf="0"></div>` | `el.hidden = expr` | dynamic-attributes.test.ts:175 | Hidden attribute |
| ATTR-016 | `<input checked={expr} />` | `<input checked={expr} data-bf="0" />` | `el.checked = expr` | dynamic-attributes.test.ts:228 | Checked attribute |
| ATTR-017 | `<div data-x={expr}></div>` | `<div data-x={expr} data-bf="0"></div>` | `el.setAttribute('data-x', val)` (with undefined check) | ir-to-client-js.test.ts:223 | Generic dynamic attr |
| ATTR-018 | `<div class={a ? "x" : "y"}></div>` | `<div class={a ? "x" : "y"} data-bf="0"></div>` | Ternary evaluated in effect | dynamic-attributes.test.ts:80 | Complex class expression |

### Spread Attributes

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| ATTR-020 | `<div {...props}></div>` | `<div {...props}></div>` | jsx-to-ir.test.ts:167, spread-attributes.test.ts:18 | Spread preserved |
| ATTR-021 | `<div {...a} {...b}></div>` | `<div {...a} {...b}></div>` | spread-attributes.test.ts:53 | Multiple spreads (order preserved) |
| ATTR-022 | `<div {...a} id="x"></div>` | `<div {...a} id="x"></div>` | spread-attributes.test.ts:35 | Spread with static attrs |
| ATTR-023 | `<input {...a} />` | `<input {...a} />` | spread-attributes.test.ts:90 | Spread on self-closing |

---

## EXPR: Expressions

### Signals

| ID | Input Pattern | Expected Output | Client JS | Test File:Line | Notes |
|----|---------------|-----------------|-----------|----------------|-------|
| EXPR-001 | `const [c, setC] = createSignal(0)` | Extracted as signal | `const [c, setC] = createSignal(0)` | signal.test.ts:28 | Number signal |
| EXPR-002 | `const [f, setF] = createSignal(false)` | Extracted | `const [f, setF] = createSignal(false)` | signal.test.ts:43 | Boolean signal |
| EXPR-003 | `const [s, setS] = createSignal("")` | Extracted | `const [s, setS] = createSignal("")` | signal.test.ts:58 | String signal |
| EXPR-004 | `const [a, setA] = ...; const [b, setB] = ...` | Both extracted | Multiple signals | signal.test.ts:73 | Multiple signals |
| EXPR-005 | `const [obj, setObj] = createSignal({})` | Extracted | Object signal | signal.test.ts:90 | Object state |
| EXPR-006 | `const [arr, setArr] = createSignal([])` | Extracted | Array signal | signal.test.ts:105 | Array state |

### Memos

| ID | Input Pattern | Expected Output | Client JS | Test File:Line | Notes |
|----|---------------|-----------------|-----------|----------------|-------|
| EXPR-010 | `const d = createMemo(() => c() * 2)` | Extracted as memo | `const d = createMemo(() => c() * 2)` | compilation-flow.test.ts:306 | Basic memo |
| EXPR-011 | `const d = createMemo(() => { ... })` | Block body preserved | IIFE for block body | ir-to-marked-jsx.test.ts:562 | Memo with block body |
| EXPR-012 | `const a = createMemo(() => b())` (memo refs memo) | Both expanded | Nested memo expansion | ir-to-marked-jsx.test.ts:603 | Memo referencing memo |

### Dynamic Content

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS Effect | Test File:Line | Notes |
|----|---------------|------------------------------|------------------|----------------|-------|
| EXPR-020 | `<div>{count()}</div>` | `<div data-bf="0">{count}</div>` | `el.textContent = String(count())` | jsx-to-ir.test.ts:257, dynamic-content.test.ts:34 | Signal call |
| EXPR-021 | `<div>{a() + b()}</div>` | `<div data-bf="0">{expr}</div>` | Multiple signal deps | dynamic-content.test.ts:53 | Binary operation |
| EXPR-022 | `<div>{a ? b : c}</div>` | Ternary preserved | Conditional in effect | dynamic-content.test.ts:69 | Ternary expression |
| EXPR-023 | `<div>text {c()}</div>` | `<div data-bf="0">text {c}</div>` | Concatenated content | dynamic-content.test.ts:85 | Text + dynamic |
| EXPR-024 | `<div>{memo()}</div>` | `<div data-bf="0">{memo}</div>` | `el.textContent = String(memo())` | jsx-to-ir.test.ts:271 | Memo call |
| EXPR-025 | `<div>{prop}</div>` | `<div data-bf="0">{prop}</div>` | Dynamic prop display | jsx-to-ir.test.ts:282 | Prop reference |
| EXPR-026 | `<div>{children}</div>` | `<div data-bf="0">{...children}</div>` | `typeof children === 'function' ? children() : children` | jsx-to-ir.test.ts:293 | Children always dynamic |

### Local Variables & Constants

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EXPR-030 | `const GRID = 100` (module level) | Extracted if used | constants.test.ts:5 | Module constant |
| EXPR-031 | `const fn = () => {}` (module level) | Extracted if used | constants.test.ts:56 | Module function |
| EXPR-032 | `const cls = styles[x]` (in component) | Included in client JS | local-variables.test.ts:22 | Local variable |
| EXPR-033 | `const handler = (e) => {}` (in component) | Included in client JS | local-functions.test.ts:37 | Local function |
| EXPR-034 | Module constant used in child props | Included in output | constants.test.ts:141 | Constant in child props |

---

## CTRL: Control Flow

### Conditionals

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS | Test File:Line | Notes |
|----|---------------|------------------------------|-----------|----------------|-------|
| CTRL-001 | `{a ? "yes" : "no"}` | `{a ? "yes" : "no"}` | textContent update | conditional.test.ts:31 | Text ternary (static condition) |
| CTRL-002 | `{signal() ? "yes" : "no"}` | `{signal ? "yes" : "no"}` | `el.textContent = signal() ? "yes" : "no"` | conditional.test.ts:48 | Dynamic text ternary |
| CTRL-003 | `{a ? <A/> : <B/>}` | Elements with `data-bf-cond="0"` | DOM switching with templates | jsx-to-ir.test.ts:322, conditional.test.ts:165 | Element ternary |
| CTRL-004 | `{a && <A/>}` | `{a && <A data-bf-cond="0"/>}` | Same as `{a ? <A/> : null}` | jsx-to-ir.test.ts:336, conditional.test.ts:244 | Logical AND |
| CTRL-005 | `{a \|\| <A/>}` | `{!a && <A data-bf-cond="0"/>}` | Inverted condition | jsx-to-ir.test.ts:351 | Logical OR |
| CTRL-006 | `{a ? <A/> : null}` | Same as CTRL-003 | DOM remove/insert | conditional.test.ts:318 | Null branch |
| CTRL-007 | `{a ? <><b/><c/></> : <d/>}` | Fragment in conditional | Fragment handling | conditional.test.ts:373 | Fragment branch |
| CTRL-008 | `{a ? b ? <A/> : <B/> : <C/>}` | Nested conditionals | Nested DOM switching | conditional.test.ts:84 | Nested ternary |
| CTRL-009 | Static condition (`{true ? <A/> : <B/>}`) | No `data-bf-cond` marker | No client JS | jsx-to-ir.test.ts:364 | Static conditional |

### Lists

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS | Test File:Line | Notes |
|----|---------------|------------------------------|-----------|----------------|-------|
| CTRL-010 | `{items().map(i => <li>{i}</li>)}` | `{items.map((i, __index) => <li>...</li>)}` | `el.innerHTML = items().map(...).join('')` | jsx-to-ir.test.ts:491, list-rendering.test.ts:49 | Basic map |
| CTRL-011 | `{items().filter().map()}` | Chain preserved | Filter then map | list-rendering.test.ts:67 | Filter + map |
| CTRL-012 | `<li key={i.id}>` | `<li data-key={i.id}>` | Key used for diffing | key-attribute.test.ts:19 | Key attribute |
| CTRL-013 | `<li key={__index}>` | `<li data-key={__index}>` | Index-based key | key-attribute.test.ts:48 | Index key |
| CTRL-014 | `<li key={expr}>` | `<li data-key={expr}>` | Computed key | key-attribute.test.ts:70 | Computed key |
| CTRL-015 | `{a.map(x => <li>{x.map(y => ...)}</li>)}` | Nested maps | Nested innerHTML | nested-map.test.ts:17 | Nested map |
| CTRL-016 | `{a.map(x => <li>{show ? "y" : "n"}</li>)}` | Ternary in template | Inline conditional | list-rendering.test.ts:336 | Conditional in list |

---

## COMP: Components

### Basic Components

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| COMP-001 | `<Child />` (no props, no client JS) | `<Child />` | components.test.ts:37 | Static component |
| COMP-002 | `<Child prop="x" />` | `<Child prop="x" />` | jsx-to-ir.test.ts:388, components.test.ts:74 | Static props |
| COMP-003 | `<Child prop={expr} />` | `<Child prop={expr} />` | jsx-to-ir.test.ts:404 | Dynamic props (marked reactive) |
| COMP-004 | `<Child {...props} />` | `<Child {...props} />` | jsx-to-ir.test.ts:452, ir-to-marked-jsx.test.ts:257 | Spread props |
| COMP-005 | `<Child>content</Child>` | `<Child>content</Child>` | jsx-to-ir.test.ts:440, components.test.ts:111 | Children |
| COMP-006 | `<Child active />` | `<Child active={true} />` | issue-27-fixes.test.ts:17 | Boolean shorthand prop |

### Props System

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| COMP-010 | `function C({ p }: { p: string })` | Prop extracted with type | props-extraction.test.ts:35 | Typed props |
| COMP-011 | `function C({ p = "x" })` | Optional prop | props-extraction.test.ts:35 | Default value |
| COMP-012 | Dynamic prop `<C p={signal()} />` | `<C p={() => signal()} />` | issue-27-fixes.test.ts:143 | Wrapped in getter |
| COMP-013 | Callback prop `<C onClick={fn} />` | `<C onClick={fn} />` (not wrapped) | issue-27-fixes.test.ts:169 | Callback not wrapped |
| COMP-014 | Child uses prop: `{prop}` | `{prop()}` (getter call) | issue-27-fixes.test.ts:196 | Prop getter unwrapping |
| COMP-015 | Static prop `<C p="x" />` | `<C p="x" />` (not wrapped) | issue-27-fixes.test.ts:299 | Static props not wrapped |

### Children

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| COMP-020 | `<C>{signal()}</C>` | `<C children={() => signal()} />` | jsx-to-ir.test.ts:478, components.test.ts:524 | Lazy children (reactive) |
| COMP-021 | `<C>static</C>` | `<C>static</C>` | components.test.ts:580 | Static children not wrapped |
| COMP-022 | Child component with lazy children | `typeof children === 'function' ? children() : children` | components.test.ts:551 | Child handles lazy |

### Component Initialization

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| COMP-030 | Component with clientJs | `initComponentName(__instanceIndex, __parentScope)` | components.test.ts:145 | Init function generated |
| COMP-031 | Component without clientJs | Direct component code (no init wrapper) | components.test.ts:198 | No init if no client JS |
| COMP-032 | Parent with child init | Parent calls `initChildName(i, scope)` | components.test.ts:216 | Child init calling |
| COMP-033 | Auto-hydration | `document.querySelectorAll('[data-bf-scope="C"]')...` | components.test.ts:477 | Auto-hydration code |
| COMP-034 | Component hash | Output includes hash and filename | components.test.ts:427 | Hash generation |

### Inline Components (List Items)

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| COMP-040 | `{items.map(i => <Item i={i} />)}` | Template with inlined component | inline-components.test.ts:51 | Component inlining |
| COMP-041 | Inlined component with events | `data-event-id` on inlined elements | inline-components.test.ts:83 | Event delegation |
| COMP-042 | Inlined component with conditional | Conditional in template | inline-components.test.ts:130 | Conditional inlining |

---

## EVT: Events

### Basic Events

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS | Test File:Line | Notes |
|----|---------------|------------------------------|-----------|----------------|-------|
| EVT-001 | `<button onClick={fn}></button>` | `<button data-bf="0"></button>` | `el.onclick = fn` | event-handlers.test.ts:48 | Click handler |
| EVT-002 | Multiple onClick on same element | Both handlers attached | Separate event setup | event-handlers.test.ts:76 | Multiple same-type handlers |
| EVT-003 | `<input onChange={fn} />` | `<input data-bf="0" />` | `el.onchange = fn` | event-handlers.test.ts:101 | Change handler |
| EVT-004 | `<input onInput={fn} />` | `<input data-bf="0" />` | `el.oninput = fn` | event-handlers.test.ts:126 | Input handler |
| EVT-005 | `<form onSubmit={fn}>` | `<form data-bf="0">` | `el.onsubmit = fn` | event-handlers.test.ts:148 | Submit handler |
| EVT-006 | `<input onKeyDown={fn} />` | `<input data-bf="0" />` | `el.onkeydown = fn` | event-handlers.test.ts:175 | KeyDown handler |
| EVT-007 | `<input onBlur={fn} />` | `<input data-bf="0" />` | `addEventListener('blur', fn, true)` | form-inputs.test.ts:48 | Blur (capture phase) |
| EVT-008 | `<input onFocus={fn} />` | `<input data-bf="0" />` | `addEventListener('focus', fn, true)` | form-inputs.test.ts:67 | Focus (capture phase) |

### Event Delegation (Lists)

| ID | Input Pattern | Expected Output | Client JS | Test File:Line | Notes |
|----|---------------|-----------------|-----------|----------------|-------|
| EVT-010 | `{items.map(i => <li onClick={...}>)}` | `<li data-event-id="0" data-index="${__index}">` | Delegated: `el.addEventListener('click', ...)` | list-rendering.test.ts:89 | List click delegation |
| EVT-011 | Multiple events in list item | Multiple `data-event-id` values | Multiple delegated handlers | list-rendering.test.ts:114 | Multiple list events |
| EVT-012 | `onBlur` in list | Capture phase delegation | `addEventListener('blur', ..., true)` | list-rendering.test.ts:203 | Capture in list |

### Conditional Events

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EVT-020 | `onKeyDown={e => e.key === 'Enter' && fn()}` | Parsed as conditional | `if (condition) { action }` | list-rendering.test.ts:224 | Conditional handler |
| EVT-021 | Multiple conditions in handler | Complex conditional parsing | Multiple if checks | list-rendering.test.ts:245 | Complex conditional |

---

## REF: Refs

| ID | Input Pattern | Expected Output (Marked JSX) | Client JS | Test File:Line | Notes |
|----|---------------|------------------------------|-----------|----------------|-------|
| REF-001 | `<input ref={el => inputRef = el} />` | `<input data-bf="0" />` (ref excluded) | `if (el) callback(el)` | ref-attribute.test.ts:17 | Ref callback |
| REF-002 | `ref` attribute in output | Not output in server JSX | - | ref-attribute.test.ts:41 | Ref exclusion |
| REF-003 | Ref with event handler | Both work together | Element queried, both executed | ref-attribute.test.ts:61 | Ref + event |
| REF-004 | Ref with dynamic content | Both work together | Effect + ref callback | ref-attribute.test.ts:88 | Ref + dynamic |
| REF-005 | Multiple refs | Each executed | Multiple ref callbacks | ref-attribute.test.ts:109 | Multiple refs |

---

## EDGE: Edge Cases

### Whitespace

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EDGE-001 | Trailing whitespace before element | Preserved | edge-cases.test.ts:230 | Trailing space |
| EDGE-002 | Leading text after closing element | Preserved | edge-cases.test.ts:247 | Leading text |
| EDGE-003 | Indentation between block elements | Removed | edge-cases.test.ts:268 | Indentation removal |
| EDGE-004 | Explicit space expression `{" "}` | Preserved | edge-cases.test.ts:287 | Explicit space |
| EDGE-005 | Whitespace in list template | Preserved | edge-cases.test.ts:324 | List whitespace |

### Nesting

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EDGE-010 | 5 levels of nesting | Correctly processed | edge-cases.test.ts:15 | Deep nesting |
| EDGE-011 | Multiple dynamic values in nested | All tracked | edge-cases.test.ts:46 | Multiple dynamics |
| EDGE-012 | Events at different nesting levels | All attached | edge-cases.test.ts:80 | Nested events |
| EDGE-013 | Nested ternary in map | Correctly templated | edge-cases.test.ts:110 | Complex nesting |

### Special Cases

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EDGE-020 | Object destructuring in params | Correctly parsed | edge-cases.test.ts:138 | Destructured params |
| EDGE-021 | Special characters in conditions | Correctly escaped | edge-cases.test.ts:162 | Special chars |
| EDGE-022 | Multiple signal dependencies | All tracked | edge-cases.test.ts:205 | Multi-signal effect |
| EDGE-023 | CSS pseudo-classes in strings | Not affected by prop replacement | issue-27-fixes.test.ts:250 | Pseudo-class preservation |
| EDGE-024 | HTML attribute names | Not affected by prop replacement | issue-27-fixes.test.ts:277 | Attr name preservation |

### SVG

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EDGE-030 | `<svg>` root | `<svg xmlns="http://www.w3.org/2000/svg">` | svg-elements.test.ts:18 | Auto xmlns |
| EDGE-031 | SVG with viewBox | Preserved | svg-elements.test.ts:39 | CamelCase attrs |
| EDGE-032 | SVG with stroke attrs | Preserved | svg-elements.test.ts:58 | Stroke attrs |
| EDGE-033 | Dynamic SVG attrs | Effect-based updates | svg-elements.test.ts:83 | Dynamic SVG |
| EDGE-034 | SVG events | Event handlers work | svg-elements.test.ts:106 | SVG events |
| EDGE-035 | Nested SVG groups | Correctly rendered | svg-elements.test.ts:134 | Nested groups |

### Form Inputs

| ID | Input Pattern | Expected Output | Test File:Line | Notes |
|----|---------------|-----------------|----------------|-------|
| EDGE-040 | `<input value={signal()} />` | Dynamic value binding | form-inputs.test.ts:21 | Input value |
| EDGE-041 | `<input type="number" />` | Number input | form-inputs.test.ts:86 | Number input |
| EDGE-042 | `<textarea value={signal()} />` | Dynamic textarea | form-inputs.test.ts:108 | Textarea |
| EDGE-043 | `<select value={signal()}>` | Dynamic select | form-inputs.test.ts:133 | Select |
| EDGE-044 | `<input type="checkbox" checked={signal()} />` | Dynamic checkbox | form-inputs.test.ts:163 | Checkbox |
| EDGE-045 | `<input type="radio" checked={...} />` | Radio binding | form-inputs.test.ts:207 | Radio |
| EDGE-046 | Multiple controlled inputs | All tracked | form-inputs.test.ts:231 | Multiple inputs |
| EDGE-047 | Dynamic placeholder | Attribute effect | form-inputs.test.ts:264 | Placeholder |
| EDGE-048 | Dynamic disabled | Boolean property | form-inputs.test.ts:285 | Disabled state |

---

## OOS: Out of Scope

These features are intentionally NOT supported by BarefootJS:

| ID | Feature | Reason | Alternative |
|----|---------|--------|-------------|
| OOS-001 | `useEffect` hook | Not a React clone | Use `createEffect` |
| OOS-002 | `useState` hook | Not a React clone | Use `createSignal` |
| OOS-003 | React Context | Not a React clone | Pass props explicitly |
| OOS-004 | `dangerouslySetInnerHTML` | Security concern | Use innerHTML in client JS directly |
| OOS-005 | Class components | Function components only | Use function components |
| OOS-006 | `forwardRef` | Simplified ref model | Use ref callbacks |
| OOS-007 | Error boundaries | Not implemented | Handle errors in code |
| OOS-008 | Suspense/lazy loading | Not implemented | Manual code splitting |
| OOS-009 | Portal | Not implemented | Manual DOM manipulation |
| OOS-010 | `var` declarations | Only `const`/`let` | Use const/let |
| OOS-011 | Async components | Not supported | Use signals for async state |

---

## Directive Validation

| ID | Rule | Error Condition | Test File:Line |
|----|------|-----------------|----------------|
| DIR-001 | `"use client"` required for `@barefootjs/dom` imports | Import without directive | directive.test.ts:54 |
| DIR-002 | `"use client"` required for event handlers | Event handler without directive | directive.test.ts:95 |
| DIR-003 | Directive must be at file start | Directive after imports | directive.test.ts:25 |
| DIR-004 | Double or single quotes accepted | Both work | directive.test.ts:5, directive.test.ts:12 |
| DIR-005 | Comments before directive allowed | Still valid | directive.test.ts:43 |

---

## Element Path Calculation

The compiler calculates DOM traversal paths for efficient element access:

| ID | Scenario | Path Type | Test File:Line |
|----|----------|-----------|----------------|
| PATH-001 | Single element with ID | Direct path | element-paths.test.ts:11 |
| PATH-002 | Nested children | Chained path (`firstChild.nextSibling`) | element-paths.test.ts:31 |
| PATH-003 | Text node siblings | Text nodes skipped in path | element-paths.test.ts:80 |
| PATH-004 | Fragment children | Path calculated per child | element-paths.test.ts:134 |
| PATH-005 | After component sibling | `null` (fallback to querySelector) | element-paths.test.ts:271 |
| PATH-006 | Conditionals in path | Conditionals skipped | element-paths.test.ts:396 |

---

## Version

- Document Version: 1.0.0
- Last Updated: 2026-01-04
- Based on: Current implementation behavior (not aspirational)
