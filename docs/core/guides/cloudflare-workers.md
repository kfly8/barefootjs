# Deploying to Cloudflare Workers

This guide covers deploying a BarefootJS application with Hono to Cloudflare Workers. This is the same setup used by [ui.barefootjs.dev](https://ui.barefootjs.dev).

## Overview

```
BarefootJS JSX → [Hono Adapter] → Hono/JSX components + client JS
                                        ↓
                    Cloudflare Workers → SSR at the edge → HTML
                    Cloudflare CDN → serves client JS, CSS
```

## Prerequisites

- A Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)
- `@barefootjs/jsx`, `@barefootjs/hono`, and `hono` packages

---

## Project Setup

### 1. Initialize Project

```bash
mkdir my-app && cd my-app
npm init -y
```

<!-- tabs:pm -->
<!-- tab:npm -->
```bash
npm install hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
npm install -D wrangler
```
<!-- tab:bun -->
```bash
bun add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
bun add -D wrangler
```
<!-- tab:pnpm -->
```bash
pnpm add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
pnpm add -D wrangler
```
<!-- tab:yarn -->
```bash
yarn add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
yarn add -D wrangler
```
<!-- /tabs -->

### 2. Configure Wrangler

```toml
# wrangler.toml
name = "my-app"
main = "worker.ts"
compatibility_date = "2024-01-01"

[assets]
directory = "dist/static"
```

### 3. Directory Structure

```
my-app/
├── components/          # Source components (JSX)
│   ├── Counter.tsx
│   └── Header.tsx
├── dist/                # Build output
│   ├── components/      # Compiled Hono/JSX + client JS
│   └── static/          # Static assets served by CDN
│       ├── components/  # Client JS files
│       └── styles.css
├── worker.ts            # Cloudflare Workers entry point
├── build.ts             # Build script
├── wrangler.toml        # Wrangler configuration
└── package.json
```

---

## Build Script

```typescript
// build.ts
import { compileJSX } from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono'
import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'

const adapter = new HonoAdapter({
  injectScriptCollection: true,
  clientJsBasePath: '/static/components',
  barefootJsPath: '/static/components/barefoot.js',
})

async function build() {
  const srcDir = './components'
  const outDir = './dist/components'
  const staticDir = './dist/static/components'

  await mkdir(outDir, { recursive: true })
  await mkdir(staticDir, { recursive: true })

  const files = (await readdir(srcDir)).filter(f => f.endsWith('.tsx'))

  for (const file of files) {
    const result = await compileJSX(
      join(srcDir, file),
      (path) => readFile(path, 'utf-8'),
      { adapter }
    )

    // Write server component (Hono JSX)
    await writeFile(join(outDir, result.templateFile), result.template)

    // Write client JS (served statically)
    if (result.clientJs) {
      await writeFile(join(staticDir, result.clientJsFile), result.clientJs)
    }
  }

  // Copy runtime
  const runtimeSrc = require.resolve('@barefootjs/dom/dist/barefoot.js')
  await writeFile(join(staticDir, 'barefoot.js'), await readFile(runtimeSrc))
}

build()
```

---

## Worker Entry Point

```typescript
// worker.ts
import { Hono } from 'hono'
import { renderer } from './renderer'

// Import compiled components
import { Counter } from './dist/components/Counter'
import { Header } from './dist/components/Header'

const app = new Hono()

app.use('*', renderer)

app.get('/', (c) => {
  return c.render(
    <div>
      <Header title="My App" />
      <Counter initial={0} label="Clicks" />
    </div>
  )
})

export default app
```

## Renderer

```tsx
// renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
})
```

---

## Script Collection

The Hono Adapter collects client JS scripts during rendering and injects them at the end of the page. This ensures:
- Scripts are loaded after HTML is rendered
- Only scripts for components on the current page are included
- No duplicate script tags

The adapter uses `useRequestContext()` from Hono to collect scripts per-request:

```tsx
// In the compiled component (automatic)
const scripts = useRequestContext().get('scripts') ?? []
scripts.push('/static/components/Counter-abc123.js')
```

Include the collected scripts in your layout:

```tsx
// renderer.tsx
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  const scripts = useRequestContext().get('scripts') ?? []

  return (
    <html>
      <head>...</head>
      <body>
        {children}
        <script type="module" src="/static/components/barefoot.js"></script>
        {scripts.map(src => <script type="module" src={src}></script>)}
      </body>
    </html>
  )
})
```

---

## Development

### Local Development Server

```json
{
  "scripts": {
    "build": "tsx build.ts",
    "dev": "npm run build && wrangler dev",
    "deploy": "npm run build && wrangler deploy"
  }
}
```

```bash
npm run dev
# Opens http://localhost:8787
```

Wrangler's dev server simulates the Workers environment locally with hot reloading for the worker code. For component changes, re-run the build script.

### Watch Mode

For faster iteration, add a file watcher:

```json
{
  "scripts": {
    "build:watch": "tsx watch build.ts",
    "dev": "concurrently \"npm run build:watch\" \"wrangler dev\""
  }
}
```

---

## Deployment

### First Deploy

```bash
# Login to Cloudflare
wrangler login

# Deploy
npm run deploy
```

Wrangler uploads:
- The worker script (SSR logic)
- Static assets from `dist/static/` (client JS, CSS)

### Custom Domain

Add a route in `wrangler.toml`:

```toml
routes = [
  { pattern = "app.example.com", custom_domain = true }
]
```

Or configure in the Cloudflare dashboard under Workers > your worker > Triggers.

---

## Performance on the Edge

Cloudflare Workers run at 300+ locations worldwide. Combined with BarefootJS's minimal client JS:

1. **First byte** — HTML rendered at the edge, closest to the user
2. **First paint** — Full HTML in the initial response (no loading spinners)
3. **Interactive** — Tiny client JS hydrates only interactive elements
4. **Cached assets** — Client JS and CSS served from Cloudflare CDN with long cache headers

### Caching Strategy

```toml
# wrangler.toml
[assets]
directory = "dist/static"

# Client JS files are content-hashed (Counter-abc123.js)
# Safe to cache indefinitely
```

Content-hashed filenames (`Counter-abc123.js`) enable aggressive caching — when a component changes, it gets a new hash and a new URL.

---

## Environment Variables

Use Cloudflare Workers secrets for configuration:

```bash
wrangler secret put API_KEY
```

Access in your worker:

```typescript
app.get('/api/data', async (c) => {
  const apiKey = c.env.API_KEY
  // ...
})
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Static files not loading | Check `[assets]` directory in `wrangler.toml` |
| Component not hydrating | Verify client JS is included in script collection |
| Build errors | Run `npm run build` separately to see compiler output |
| Wrangler types | Add `@cloudflare/workers-types` to devDependencies |
