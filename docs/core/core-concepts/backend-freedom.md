---
title: Backend Freedom
description: How adapters let the same JSX run on any server — Hono, Go, and beyond
---

# Backend Freedom

Most UI component libraries assume Node.js on the server. If your backend is Go, Python, or Ruby, you're either maintaining a separate Node.js service for rendering or hand-writing UI without a component system.

BarefootJS removes this constraint. **Write components once in JSX. The compiler generates native templates for your backend** — no Node.js runtime needed at serving time.

## One Source, Any Backend

The compiler transforms JSX into a backend-agnostic **Intermediate Representation** (IR). An **adapter** converts the IR into the template format your server needs:

```
JSX Source
    ↓
  Compiler → IR (backend-agnostic)
    ↓
  Adapter → Template for your backend
```

| Adapter | Output | Backend |
|---------|--------|---------|
| `HonoAdapter` | `.hono.tsx` | Hono / JSX-based servers |
| `GoTemplateAdapter` | `.tmpl` + `_types.go` | Go `html/template` |

The same component works unchanged across all supported backends. The IR contract is stable, so you can also [write adapters for any backend](../adapters/custom-adapter.md).
