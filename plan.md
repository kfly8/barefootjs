# Implementation Plan: Unit Tests for Core Compiler Modules

## Overview

This plan outlines the implementation of unit tests for core compiler modules in `packages/jsx/src` as described in Issue #49.

## Current State

- `ir-to-server-jsx.ts` has 1 test file with basic coverage
- `jsx-to-ir.ts` has NO dedicated test file
- `ir-to-client-js.ts` has NO dedicated test file
- `template-generator.ts` has NO dedicated test file

## Test Strategy

Following the existing test patterns in the codebase (`bun:test`, `describe/it/expect`).

---

## Phase 1: Core Module Unit Tests

### Task 1: Add tests for `jsx-to-ir.ts`

**File:** `packages/jsx/__tests__/transformers/jsx-to-ir.test.ts`

**Test cases:**
1. **Text node conversion**
   - Plain text → IRText node
   - Whitespace handling (indentation removal, inline space preservation)

2. **JSX element conversion**
   - Simple element → IRElement with staticAttrs
   - Element with dynamic attributes → IRElement with dynamicAttrs
   - Element with events → IRElement with events
   - Element with children → nested IRNodes

3. **Self-closing element conversion**
   - `<input />`, `<br />` → IRElement with empty children

4. **Fragment conversion**
   - `<>...</>` → IRFragment with children

5. **Expression conversion**
   - Static expression → IRExpression with isDynamic: false
   - Signal call expression → IRExpression with isDynamic: true
   - Memo call expression → IRExpression with isDynamic: true

6. **Conditional conversion**
   - Ternary operator → IRConditional
   - Logical AND (`{flag && <Component />}`) → IRConditional
   - Logical OR (`{loading || <Component />}`) → IRConditional

7. **Component conversion**
   - Component with props → IRComponent
   - Component with children → IRComponent with children array

8. **List (map) processing**
   - `.map()` expression → IRElement with listInfo

9. **Integration with findAndConvertJsxReturn**
   - Find component function and convert JSX return

---

### Task 2: Add tests for `ir-to-client-js.ts`

**File:** `packages/jsx/__tests__/transformers/ir-to-client-js.test.ts`

**Test cases:**
1. **Helper function tests**
   - `extractArrowBody()` - arrow function body extraction
   - `extractArrowParams()` - arrow function parameter extraction
   - `needsCapturePhase()` - blur, focus event detection
   - `isBooleanAttribute()` - disabled, checked, etc.
   - `generateAttributeUpdate()` - class, style, boolean, value attribute handling

2. **collectClientJsInfo tests**
   - Element with events → interactiveElements collection
   - Element with dynamic content → dynamicElements collection
   - Element with listInfo → listElements collection
   - Element with dynamic attributes → dynamicAttributes collection
   - Element with ref → refElements collection
   - Conditional with ID → conditionalElements collection
   - Component with childInits → childInits collection
   - Fragment → recursive child processing

3. **collectAllChildComponentNames tests**
   - Nested components → all component names collected
   - Components inside lists → included in collection

4. **HTML template generation tests**
   - `irToHtmlTemplate()` - conditional branch template generation
   - Text, expression, element, fragment handling
   - Null/undefined handling with comment markers

---

### Task 3: Expand tests for `ir-to-server-jsx.ts`

**File:** `packages/jsx/__tests__/transformers/ir-to-server-jsx.test.ts` (existing)

**Additional test cases:**
1. **Fragment handling**
   - Fragment with multiple children
   - Empty fragment

2. **Component node handling**
   - Component with props
   - Component with spread props
   - Component with children

3. **Nested structures**
   - Element inside conditional
   - Conditional inside element
   - List with nested elements

4. **Edge cases**
   - Empty element
   - Element with spread attributes
   - Element with ref

---

### Task 4: Add tests for `template-generator.ts`

**File:** `packages/jsx/__tests__/compiler/template-generator.test.ts`

**Test cases:**
1. **Basic template generation**
   - Simple element → template string
   - Element with static attributes
   - Element with dynamic expressions (${...})

2. **Event handling**
   - Element with onClick → data-event-id, events array
   - Multiple events on same element
   - Event with different handler patterns

3. **Nested elements**
   - Parent with children
   - Self-closing elements inside

4. **Component inlining**
   - Component reference → inlined HTML

---

## Phase 2: Integration Tests

### Task 5: Full compilation flow integration tests

**File:** `packages/jsx/__tests__/integration/compilation-flow.test.ts`

**Test cases:**
1. Simple counter component → verify serverJsx + clientJs output
2. Component with conditionals → verify conditional markers
3. Component with lists → verify list templates
4. Nested components → verify child component handling

---

## Implementation Order

1. **jsx-to-ir.test.ts** - Foundation for all other tests (IR is the central data structure)
2. **ir-to-client-js.test.ts** - Client-side generation from IR
3. **ir-to-server-jsx.test.ts** (expand) - Server-side generation from IR
4. **template-generator.test.ts** - Template string generation for lists
5. **compilation-flow.test.ts** - End-to-end integration

---

## Test Utilities

Create a helper module for common test setup:

**File:** `packages/jsx/__tests__/transformers/test-utils.ts`

```typescript
// Helper to create TypeScript AST from JSX string
export function parseJsx(source: string): ts.SourceFile

// Helper to create JsxToIRContext
export function createContext(options?: Partial<JsxToIRContext>): JsxToIRContext

// Common test fixtures (signals, memos, components)
export const fixtures = { ... }
```

---

## Success Criteria

- All new tests pass (`bun test packages/jsx`)
- No regressions in existing tests
- E2E tests still pass (`cd examples/hono && bun run test:e2e`)
- Coverage significantly improved for the 4 target modules
