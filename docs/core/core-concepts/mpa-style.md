---
title: MPA-style Development
description: Server-rendering by default, with client JavaScript only where you need it
---

# MPA-style Development

You have a server-rendered app that works. You need interactive UI — a search box, a date picker, a collapsible sidebar. Your options today:

- **jQuery / vanilla JS** — No component model, hard to maintain at scale.
- **SPA framework (React, Vue, Svelte)** — Powerful, but requires rewriting pages, adopting a client-side router, and setting up SSR hydration.
- **Islands (Astro, Fresh)** — Better, but still tied to a specific meta-framework and runtime.

BarefootJS is a different approach: **add interactive components to existing pages without changing your architecture.** Routing, data fetching, and templates stay as they are. Only the components that need interactivity ship JavaScript.

## Server-First, Client Where Marked

Every component is a **server component** by default — rendered to HTML, zero JavaScript. Add `"use client"` only to the components that need interactivity:

```tsx
// ProductPage.tsx — server component
import { AddToCart } from './AddToCart'    // "use client"
import { ReviewStars } from './ReviewStars' // "use client"

export function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>            {/* Static HTML */}
      <p>{product.description}</p>        {/* Static HTML */}
      <img src={product.image} />         {/* Static HTML */}
      <ReviewStars rating={product.rating} />  {/* Interactive */}
      <AddToCart productId={product.id} />     {/* Interactive */}
    </div>
  )
}
```

The product name, description, and image are server-rendered with no JS cost. Only `ReviewStars` and `AddToCart` ship client JavaScript. HTML is visible before JS loads, and content works even if JavaScript fails.
