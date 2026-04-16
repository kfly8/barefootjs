---
title: Backend Freedom
description: How adapters let the same JSX run on any server — Hono, Go, and beyond
---

# Backend Freedom

The compiler generates native server templates from JSX — no Node.js runtime required.

Most UI component libraries assume Node.js. If your backend is Go or another language, you either run a separate Node.js service for rendering or hand-write UI without a component system. BarefootJS compiles JSX into a backend-agnostic IR, then an adapter converts it to your server's template format:

```
JSX → IR (backend-agnostic) → Adapter → Template
```

| Adapter | Output | Backend |
|---------|--------|---------|
| `HonoAdapter` | `.hono.tsx` | Hono / JSX-based servers |
| `GoTemplateAdapter` | `.tmpl` + `_types.go` | Go `html/template` |

The IR contract is stable. You can [write adapters for any backend](../adapters/custom-adapter.md).
