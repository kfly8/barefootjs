# BarefootJS

A compiler that generates static HTML + client-side JS from JSX.

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

