# Plan: Unify Client JS Effect Generation Helpers

## Issue #51

Refactor: Unify client JS effect generation helpers

## Summary

Multiple effect generation functions in `jsx-compiler.ts` share structural patterns but implement them separately. This creates maintenance overhead and inconsistency risk. We'll create unified helpers to abstract the common patterns.

## Current State Analysis

### Location
All four functions are in `/packages/jsx/src/jsx-compiler.ts`:
- `generateDynamicElementEffects` (lines 419-462)
- `generateListElementEffects` (lines 467-492)
- `generateAttributeEffects` (lines 497-513)
- `generateConditionalEffects` (lines 518-638)

### Common Patterns Identified

1. **Element Finding Strategy**:
   - Path-based: `__scope?.${path}` when path is known
   - Scoped finder: `__findInScope('[data-bf="${id}"]')` when path is null

2. **Effect Wrapping Patterns**:
   - Pattern A (pre-effect check): `if (el) { createEffect(() => { ... }) }`
   - Pattern B (in-effect check): `createEffect(() => { const el = ...; if (el) { ... } })`

3. **Variable Naming**: All use `ctx.varName(id)` → `_${id}`

## Proposed Solution

Create `/packages/jsx/src/compiler/effect-helpers.ts` with unified helper functions.

### Helper Functions

#### 1. `generateScopedElementFinder`
Generates code to find an element using path or scoped finder.

```typescript
export function generateScopedElementFinder(options: {
  varName: string
  elementId: string
  path: string | null | undefined
}): string
```

**Usage:**
```typescript
generateScopedElementFinder({ varName: '_el1', elementId: 'el1', path: 'firstChild' })
// → `const _el1 = __scope?.firstChild`

generateScopedElementFinder({ varName: '_el1', elementId: 'el1', path: null })
// → `const _el1 = __findInScope('[data-bf="el1"]')`
```

#### 2. `generateEffectWithPreCheck`
Wraps effect body with existence check BEFORE createEffect (Pattern A).

```typescript
export function generateEffectWithPreCheck(options: {
  varName: string
  effectBody: string
}): string[]
```

**Output:**
```typescript
if (_el1) {
  createEffect(() => {
    // effectBody
  })
}
```

#### 3. `generateEffectWithInnerFinder`
Generates createEffect that finds element inside and checks existence (Pattern B).

```typescript
export function generateEffectWithInnerFinder(options: {
  varName: string
  elementId: string
  path: string | null | undefined
  effectBody: string
  evaluateFirst?: string
}): string[]
```

**Output:**
```typescript
createEffect(() => {
  const _el1 = __scope?.path
  const __textValue = expression  // if evaluateFirst
  if (_el1) {
    _el1.textContent = String(__textValue)
  }
})
```

## Implementation Steps

### Step 1: Create `effect-helpers.ts`
Create new file with:
- `generateScopedElementFinder()`
- `generateEffectWithPreCheck()`
- `generateEffectWithInnerFinder()`

### Step 2: Refactor `generateAttributeEffects`
Simplest function - uses Pattern A (pre-effect check).

**Before:**
```typescript
for (const da of dynamicAttributes) {
  const v = ctx.varName(da.id)
  lines.push(`if (${v}) {`)
  lines.push(`  createEffect(() => {`)
  lines.push(`    ${generateAttributeUpdateWithVar(da, v)}`)
  lines.push(`  })`)
  lines.push(`}`)
}
```

**After:**
```typescript
for (const da of dynamicAttributes) {
  const v = ctx.varName(da.id)
  const effectBody = generateAttributeUpdateWithVar(da, v)
  lines.push(...generateEffectWithPreCheck({ varName: v, effectBody }))
}
```

### Step 3: Refactor `generateListElementEffects`
Uses Pattern A with more complex body.

**After:**
```typescript
for (const el of listElements) {
  const v = ctx.varName(el.id)
  const effectBody = el.keyExpression
    ? `reconcileList(${v}, ${el.arrayExpression}, ${renderFn}, ${getKeyFn})`
    : `${v}.innerHTML = ${el.mapExpression}`
  lines.push(...generateEffectWithPreCheck({ varName: v, effectBody }))
}
```

### Step 4: Refactor `generateDynamicElementEffects`
Uses Pattern B (in-effect finder with pre-evaluation).

**After:**
```typescript
for (const el of dynamicElements) {
  const v = ctx.varName(el.id)
  const path = ctx.elementPaths.get(el.id)

  if (el.expression === 'children' || el.fullContent === 'children') {
    lines.push(...generateEffectWithInnerFinder({
      varName: v,
      elementId: el.id,
      path,
      effectBody: `if (${v} && __childrenResult !== undefined) {\n  ${v}.textContent = String(__childrenResult)\n}`,
      evaluateFirst: `const __childrenResult = children !== undefined ? (typeof children === 'function' ? children() : children) : undefined`
    }))
  } else {
    lines.push(...generateEffectWithInnerFinder({
      varName: v,
      elementId: el.id,
      path,
      effectBody: `${v}.textContent = String(__textValue)`,
      evaluateFirst: `const __textValue = ${el.fullContent}`
    }))
  }
}
```

### Step 5: Refactor `generateConditionalEffects`
Most complex - partial refactoring for element finding in nested handlers.

**Refactor:**
```typescript
// For re-attaching event handlers
const elVar = `__cond_el_${el.id}`
lines.push(`  const ${elVar} = __findInScope('[data-bf="${el.id}"]')`)
```

**Can use:**
```typescript
lines.push(`  ${generateScopedElementFinder({ varName: elVar, elementId: el.id, path: null })}`)
```

Note: The main conditional effect structure is unique and complex, so we'll keep it mostly as-is but use the element finder helper where applicable.

### Step 6: Add Tests
Create `/packages/jsx/src/compiler/effect-helpers.test.ts`:
- Test `generateScopedElementFinder` with path and null cases
- Test `generateEffectWithPreCheck` output format
- Test `generateEffectWithInnerFinder` with/without evaluateFirst

### Step 7: Run Tests and Verify
1. Run unit tests: `bun test packages/jsx`
2. Rebuild packages: `cd packages/jsx && bun run build`
3. Rebuild examples: `cd examples/hono && bun run build`
4. Run E2E tests: `cd examples/hono && bun run test:e2e`

## Files to Modify

| File | Action |
|------|--------|
| `packages/jsx/src/compiler/effect-helpers.ts` | Create (new) |
| `packages/jsx/src/compiler/effect-helpers.test.ts` | Create (new) |
| `packages/jsx/src/jsx-compiler.ts` | Modify (refactor 4 functions) |

## Expected Benefits

1. **Reduced duplication**: Element finding and effect wrapping logic centralized
2. **Consistency**: All effect generation follows the same patterns
3. **Maintainability**: Changes to effect patterns only need updating in one place
4. **Testability**: Helper functions can be unit tested independently

## Risk Assessment

- **Low risk**: Refactoring is behavior-preserving
- **Verification**: E2E tests will confirm client-side behavior is unchanged
- **Rollback**: Simple revert if issues arise
