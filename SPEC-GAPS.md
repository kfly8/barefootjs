# BarefootJS Specification Coverage Gaps

This document identifies gaps between the SPEC.md specifications and test coverage.

## Summary

| Category | Specified | Tested | Coverage |
|----------|-----------|--------|----------|
| JSX (JSX-XXX) | 13 | 13 | 100% |
| Attributes (ATTR-XXX) | 23 | 20 | 87% |
| Expressions (EXPR-XXX) | 34 | 30 | 88% |
| Control Flow (CTRL-XXX) | 16 | 16 | 100% |
| Components (COMP-XXX) | 42 | 38 | 90% |
| Events (EVT-XXX) | 21 | 18 | 86% |
| Refs (REF-XXX) | 5 | 5 | 100% |
| Edge Cases (EDGE-XXX) | 48 | 45 | 94% |
| Directives (DIR-XXX) | 5 | 5 | 100% |
| Paths (PATH-XXX) | 6 | 6 | 100% |

---

## Gap Analysis

### 1. Implemented Features Without Direct Tests

These features are implemented but lack dedicated test cases (tested indirectly through integration tests):

| Spec ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| ATTR-012 | Style string (`style="..."`) | ⚠️ Indirect | Tested in ir-to-client-js.test.ts:188 but no compilation test |
| ATTR-017 | Generic dynamic attr with undefined check | ⚠️ Indirect | Tested in ir-to-client-js but no end-to-end test |
| EXPR-011 | Memo with block body (IIFE generation) | ⚠️ Indirect | Tested in ir-to-marked-jsx but no compilation test |
| EXPR-012 | Memo referencing memo | ⚠️ Indirect | Tested in ir-to-marked-jsx but no compilation test |
| COMP-034 | Component hash generation | ⚠️ Indirect | Tested in components.test.ts:427 |
| EVT-007 | Blur event (capture phase) | ⚠️ Indirect | Tested in form-inputs.test.ts but no explicit capture verification |
| EVT-008 | Focus event (capture phase) | ⚠️ Indirect | Tested in form-inputs.test.ts but no explicit capture verification |

### 2. Tests Without Spec IDs (Implicit Specifications)

These tests exist but weren't explicitly called out in the initial specification:

| Test File | Test Name | Suggested Spec ID | Notes |
|-----------|-----------|-------------------|-------|
| compilation-flow.test.ts:13 | compiles a simple counter component | COMP-100 | Integration test - full compilation flow |
| compilation-flow.test.ts:51 | compiles a static component without client JS | COMP-101 | Static component output |
| compilation-flow.test.ts:426 | files without directive are not included | DIR-100 | Directive requirement validation |
| edge-cases.test.ts:15 | handles 5 levels of nesting | EDGE-100 | Deep nesting stress test |
| edge-cases.test.ts:138 | object destructuring in params | EDGE-101 | Destructured arrow params |

### 3. Missing Test Coverage

These specification items need dedicated tests:

#### High Priority (Core Features)

| Spec ID | Feature | Risk | Recommendation |
|---------|---------|------|----------------|
| ATTR-018 | Complex class expression with ternary | Medium | Add E2E test for class switching |
| EXPR-030 | Module constant extraction | Medium | Add test verifying constant is included in output |
| EXPR-031 | Module function extraction | Medium | Add test verifying function is included in output |
| COMP-022 | Child lazy children handling | High | Add test for nested lazy children |

#### Medium Priority (Edge Cases)

| Spec ID | Feature | Risk | Recommendation |
|---------|---------|------|----------------|
| CTRL-014 | Computed key expression | Low | Add test with complex key computation |
| EDGE-022 | Multiple signal dependencies | Medium | Add test with 3+ signals in one effect |
| EVT-012 | Capture phase in list event delegation | Low | Verify addEventListener third argument |

#### Low Priority (Already Working)

| Spec ID | Feature | Risk | Recommendation |
|---------|---------|------|----------------|
| OOS-001 to OOS-011 | Out of scope features | N/A | Document-only, no tests needed |

---

## Test ID Coverage Map

### Tests with Spec IDs (Updated)

| Test File | Tests Updated | Coverage |
|-----------|---------------|----------|
| jsx-to-ir.test.ts | 40/40 | ✅ 100% |
| signal.test.ts | 6/6 | ✅ 100% |
| event-handlers.test.ts | 6/6 | ✅ 100% |
| attributes.test.ts | 4/4 | ✅ 100% |
| fragment.test.ts | 7/7 | ✅ 100% |

### Tests Pending Spec ID Updates

These test files have not yet been updated with spec IDs:

| Test File | Test Count | Priority |
|-----------|------------|----------|
| ir-to-marked-jsx.test.ts | 25 | High |
| ir-to-client-js.test.ts | 35 | High |
| compilation-flow.test.ts | 15 | High |
| components.test.ts | 18 | High |
| list-rendering.test.ts | 14 | Medium |
| conditional.test.ts | 13 | Medium |
| dynamic-attributes.test.ts | 12 | Medium |
| form-inputs.test.ts | 13 | Medium |
| counter.test.ts | 5 | Low |
| list.test.ts | 5 | Low |
| template-generator.test.ts | 18 | Low |
| element-paths.test.ts | 14 | Low |

---

## Recommended Actions

### Immediate (Before Next Release)

1. **Add missing E2E tests for ATTR-018, COMP-022**
   - These affect core rendering behavior

2. **Update remaining high-priority test files with spec IDs**
   - ir-to-marked-jsx.test.ts
   - ir-to-client-js.test.ts
   - compilation-flow.test.ts
   - components.test.ts

### Short Term (Next Sprint)

3. **Add capture phase verification for EVT-007, EVT-008**
   - Ensure blur/focus events use `{ capture: true }`

4. **Add constants/local functions extraction tests**
   - EXPR-030, EXPR-031, EXPR-032, EXPR-033

### Long Term (Technical Debt)

5. **Update all remaining test files with spec IDs**
   - Enable automatic traceability

6. **Create spec ID validation script**
   - Verify all spec IDs in SPEC.md have corresponding tests
   - Verify all tests with spec IDs reference valid spec entries

---

## Potential Issues Found

### Possible Bugs (Needs Investigation)

| Location | Issue | Severity |
|----------|-------|----------|
| ATTR-002 | Boolean shorthand `disabled` outputs as empty string `""` instead of `true` | Low - works functionally |
| CTRL-005 | Logical OR inverts condition with `!(loading)` - verify behavior matches expectation | Low - intentional design |

### Documentation Gaps

| Location | Issue | Action |
|----------|-------|--------|
| SPEC.md | Some "Expected Output" columns incomplete | Add full output examples |
| SPEC.md | OOS section could include rationale | Add reasoning for exclusions |

---

## Test Health Metrics

```
Total Test Files: 35
Total Test Cases: ~547

By Type:
- Unit Tests (extractors, transformers): ~150
- Integration Tests (compilation-flow): ~15
- E2E Tests (counter, list, conditional): ~50
- Helper Tests (effect-helpers, element-paths): ~80

Coverage Estimate:
- Core Transformations: 95%
- Edge Cases: 85%
- Error Handling: 70%
- Performance: 10%
```

---

## Appendix: Spec ID Quick Reference

```
JSX-XXX   : Basic JSX syntax (elements, fragments, text)
ATTR-XXX  : Attributes (static, dynamic, spread)
EXPR-XXX  : Expressions (signals, memos, dynamic content)
CTRL-XXX  : Control flow (conditionals, lists)
COMP-XXX  : Components (props, children, composition)
EVT-XXX   : Event handlers
REF-XXX   : Ref callbacks
EDGE-XXX  : Edge cases
OOS-XXX   : Out of scope (intentionally not supported)
DIR-XXX   : Directive validation
PATH-XXX  : Element path calculation
```

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-04 | 1.0.0 | Initial gap analysis |
