---
name: Refactoring Priority Plan
description: Three-phase plan to reduce compiler/runtime fragility and improve human maintainability
type: project
---

## Motivation

9 blocks implemented, 7 compiler/runtime bugs fixed. Bugs share 3 structural root causes:
1. Same concept implemented in multiple places (unsynchronized)
2. Implicit contracts between compiler output and runtime (not type-enforced)
3. Mixed responsibilities in large files (emit-init-sections.ts = 1,520 lines)

**Why:** The codebase is currently AI-editable but not human-maintainable.

**How to apply:** Use this as a checklist when planning refactoring work.

## Phase 1: Safety Guards (bug recurrence prevention)

1. **Element search helper** — `querySelector` + `matches` pattern in 1 function
   - Files: new helper in `packages/dom/src/`, used by `insert.ts`, `reconcile-elements.ts`, compiler codegen
   - Prevents: loop root event binding bug

2. **innerHTML helper** — wrapper that always applies `escapeAttrGt`
   - Files: `packages/dom/src/component.ts`, `insert.ts`
   - Prevents: UnoCSS `>` breaking HTML parsing

3. **Event name normalization unification** — single function for compiler + runtime
   - Files: `packages/jsx/src/ir-to-client-js/utils.ts`, `packages/dom/src/apply-rest-attrs.ts`
   - Prevents: camelCase event name mismatch

## Phase 2: Responsibility Separation (comprehensibility)

4. **Split `emit-init-sections.ts`** (1,520 lines → 3-4 files)
   - `emit-control-flow.ts` — conditionals + loops
   - `emit-reactive-updates.ts` — attributes, text, classes
   - `emit-events.ts` — event handlers, refs
   - Keep `emit-init-sections.ts` for shared helpers

5. **Scope search abstraction** — unify bf-s / comment / portal queries in `query.ts`
   - Extract ScopeResolver interface
   - Reduce `query.ts` from 657 lines

## Phase 3: Contract Enforcement (structural safety)

6. **Compiler-runtime contract tests**
   - Scope ID pattern validation
   - Event name lowercase assertion
   - Attribute constant consistency

7. **Magic string constants centralization**
   - `data-key`, `data-key-N` → `attrs.ts`
   - Compiler-side attribute constants → shared with runtime
