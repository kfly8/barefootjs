---
title: MPA-style Development
description: Server-rendering by default, with client JavaScript only where you need it
---

# MPA-style Development

Add interactive components to server-rendered pages without changing your architecture.

Existing options require trade-offs:

- **jQuery / vanilla JS** — No component model. Hard to maintain at scale.
- **SPA framework** — Requires rewriting pages, a client-side router, and SSR hydration.
- **Islands (Astro, Fresh)** — Tied to a specific meta-framework and runtime.

BarefootJS renders every component to static HTML by default. `"use client"` marks the components that need interactivity — only those ship JavaScript:

```tsx
// ProductPage.tsx — server component
import { AddToCart } from './AddToCart'    // "use client"
import { ReviewStars } from './ReviewStars' // "use client"

export function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} />
      <ReviewStars rating={product.rating} />
      <AddToCart productId={product.id} />
    </div>
  )
}
```

`h1`, `p`, `img` produce zero JS. Only `ReviewStars` and `AddToCart` ship client JavaScript. HTML is visible before JS loads and works without it.
