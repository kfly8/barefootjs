# BarefootJS JSX Compiler Specification

This document defines the transformation rules for the BarefootJS JSX compiler.

## Specification Data

📊 **[View Full Specification (TSV)](spec/spec.tsv)**

The TSV contains all transformation rules with:
- **id**: Unique specification ID (e.g., JSX-001, ATTR-010)
- **category**: Feature category
- **input_pattern**: Input JSX pattern
- **expected_output**: Expected transformation result
- **status**: Implementation status (✅ Implemented, ⚠️ Partial, ❌ OOS)
- **test_file**: Corresponding test file and line number
- **notes**: Additional notes

## Categories

| Prefix | Category | Description |
|--------|----------|-------------|
| JSX-XXX | Basic JSX | Elements, text, fragments |
| ATTR-XXX | Attributes | Static, dynamic, spread |
| EXPR-XXX | Expressions | Signals, memos, dynamic content |
| CTRL-XXX | Control Flow | Conditionals, lists |
| COMP-XXX | Components | Props, children, composition |
| EVT-XXX | Events | Event handlers, delegation |
| REF-XXX | Refs | Ref callbacks |
| EDGE-XXX | Edge Cases | Whitespace, SVG, forms |
| DIR-XXX | Directives | "use client" validation |
| PATH-XXX | Element Paths | DOM traversal optimization |
| OOS-XXX | Out of Scope | Intentionally not supported |

## Quick Reference

### Compilation Flow

```
JSX Source → IR (Intermediate Representation) → Marked JSX + Client JS
```

### Output Types

1. **Marked JSX**: Server-side JSX with hydration markers
   - `data-bf-scope="ComponentName"` - Component root
   - `data-bf="id"` - Interactive element
   - `data-bf-cond="id"` - Conditional element

2. **Client JS**: Minimal JavaScript for reactivity
   - Uses `createEffect` for reactive updates
   - Event delegation for lists
   - DOM switching for conditionals

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Implemented | Feature is implemented and tested |
| ⚠️ Partial | Feature is partially implemented |
| ❌ OOS | Out of Scope - intentionally not supported |
| 🚧 Planned | Planned for future implementation |

## Related Documents

- [Gap Analysis](SPEC-GAPS.md) - Coverage gaps and recommendations
- [CLAUDE.md](CLAUDE.md) - Development workflow

---

## Version

- Document Version: 2.0.0
- Last Updated: 2026-01-04
- Format: TSV-based specification
