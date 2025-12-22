# BarefootJS

A compiler that generates static HTML + client-side JS from JSX.

## Build Configuration

BarefootJS supports configuration-based builds using JSON configuration files. Instead of writing custom `build.ts` scripts, you can use `barefoot.config.json` to configure your build.

See [BUILD_CONFIG.md](./BUILD_CONFIG.md) for detailed documentation.

**Quick Example:**
```json
{
  "mode": "static",
  "entry": "index.tsx",
  "template": "template.html",
  "title": "My App"
}
```

Then build with:
```bash
bun jsx/build.cli.ts
```

## ARCHITECTURE

```
┌─────────────────┐
│  Counter.tsx    │  ← JSX Component
└────────┬────────┘
         │ compileJSX()
         ▼
┌─────────────────────────────────────┐
│         jsx/jsx-compiler.ts         │
│  - Extract signal declarations      │
│  - Detect dynamic content (__d0)    │
│  - Detect event handlers (__b0)     │
└────────┬───────────────────┬────────┘
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│ Counter.tsx     │  │ Counter.client  │
│ (Static HTML)   │  │ .js             │
│                 │  │                 │
│ - Add id attrs  │  │ - Init signals  │
│ - Markers for   │  │ - updateAll()   │
│   JS injection  │  │ - Set onclick   │
└─────────────────┘  └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ dom/runtime.js  │
                     │ - signal impl   │
                     └─────────────────┘
```

