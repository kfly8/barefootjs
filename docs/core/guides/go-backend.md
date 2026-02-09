# Using with Go Backend

This guide covers using BarefootJS with a Go backend using the `html/template` package. The Go Template Adapter generates `.tmpl` files that integrate directly with Go's standard library.

## Overview

```
BarefootJS JSX → [Go Template Adapter] → .tmpl files + client JS
                                              ↓
                          Go http server → html/template → HTML response
                                              ↓
                          Browser → hydrates client JS → interactive
```

## Prerequisites

- Go 1.21+
- Node.js 18+ (for the BarefootJS compiler)
- `@barefootjs/jsx` and `@barefootjs/go-template` packages

<!-- tabs:pm -->
<!-- tab:npm -->
```bash
npm install @barefootjs/jsx @barefootjs/go-template
```
<!-- tab:bun -->
```bash
bun add @barefootjs/jsx @barefootjs/go-template
```
<!-- tab:pnpm -->
```bash
pnpm add @barefootjs/jsx @barefootjs/go-template
```
<!-- tab:yarn -->
```bash
yarn add @barefootjs/jsx @barefootjs/go-template
```
<!-- /tabs -->

---

## Project Structure

```
my-app/
├── components/          # BarefootJS JSX source
│   ├── Counter.tsx
│   └── TodoList.tsx
├── templates/           # Generated Go templates (output)
│   ├── Counter.tmpl
│   └── TodoList.tmpl
├── static/              # Generated client JS (output)
│   ├── Counter-abc123.js
│   └── barefoot.js
├── main.go              # Go HTTP server
├── compile.ts           # Build script
└── package.json
```

---

## Build Script

Create a compile script that uses the Go Template Adapter:

```typescript
// compile.ts
import { compileJSX } from '@barefootjs/jsx'
import { GoTemplateAdapter } from '@barefootjs/go-template'
import { readFile, writeFile, mkdir } from 'fs/promises'

const adapter = new GoTemplateAdapter({
  packageName: 'main',
  templateDir: './templates',
  staticDir: './static',
})

const components = ['Counter.tsx', 'TodoList.tsx']

for (const file of components) {
  const result = await compileJSX(`./components/${file}`,
    (path) => readFile(path, 'utf-8'),
    { adapter }
  )

  await mkdir('./templates', { recursive: true })
  await mkdir('./static', { recursive: true })

  await writeFile(`./templates/${result.templateFile}`, result.template)

  if (result.clientJs) {
    await writeFile(`./static/${result.clientJsFile}`, result.clientJs)
  }
}
```

---

## Writing Components

Components are written in JSX and compiled to Go templates:

```tsx
// components/Counter.tsx
"use client"
import { createSignal } from '@barefootjs/dom'

interface CounterProps {
  initial: number
  label: string
}

export function Counter(props: CounterProps) {
  const [count, setCount] = createSignal(props.initial)

  return (
    <div>
      <span>{props.label}: {count()}</span>
      <button onClick={() => setCount(n => n + 1)}>+</button>
      <button onClick={() => setCount(n => n - 1)}>-</button>
    </div>
  )
}
```

### Compiled Output

**Go Template** (`templates/Counter.tmpl`):

```go-template
{{define "Counter"}}
<div data-bf-scope="Counter">
  <span data-bf="0">{{.Label}}: {{.Initial}}</span>
  <button data-bf="1">+</button>
  <button data-bf="2">-</button>
</div>
{{end}}
```

**Client JS** (`static/Counter-abc123.js`):

```javascript
import { createSignal, createEffect, find, findScope, registerComponent } from './barefoot.js'

registerComponent('Counter', (scope, props) => {
  const _0 = find(scope, '[data-bf="0"]')
  const _1 = find(scope, '[data-bf="1"]')
  const _2 = find(scope, '[data-bf="2"]')

  const [count, setCount] = createSignal(props.initial)

  createEffect(() => {
    _0.textContent = `${props.label}: ${count()}`
  })

  _1.addEventListener('click', () => setCount(n => n + 1))
  _2.addEventListener('click', () => setCount(n => n - 1))
})
```

---

## Go Server

### Basic HTTP Server

```go
package main

import (
    "html/template"
    "net/http"
)

var tmpl *template.Template

func init() {
    tmpl = template.Must(template.ParseGlob("templates/*.tmpl"))
}

func main() {
    // Serve static files (client JS)
    http.Handle("/static/", http.StripPrefix("/static/",
        http.FileServer(http.Dir("static"))))

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        data := map[string]interface{}{
            "Initial": 0,
            "Label":   "Count",
        }
        tmpl.ExecuteTemplate(w, "page", data)
    })

    http.ListenAndServe(":8080", nil)
}
```

### Page Template

```go-template
{{define "page"}}
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
</head>
<body>
    {{template "Counter" .}}

    <script type="module" src="/static/barefoot.js"></script>
    <script type="module" src="/static/Counter-abc123.js"></script>
</body>
</html>
{{end}}
```

---

## Type Mapping

The Go Template Adapter maps TypeScript types to Go conventions:

| TypeScript | Go Template | Notes |
|-----------|-------------|-------|
| `string` | `{{.Field}}` | Direct output |
| `number` | `{{.Field}}` | Direct output |
| `boolean` | `{{if .Field}}` | Conditional |
| `T[]` | `{{range .Field}}` | Iteration |
| `props.field` | `{{.Field}}` | PascalCase conversion |

### Property Name Conversion

Go templates use PascalCase. The adapter converts automatically:

| TypeScript Prop | Go Template |
|----------------|-------------|
| `props.userName` | `{{.UserName}}` |
| `props.isActive` | `{{.IsActive}}` |
| `props.items` | `{{.Items}}` |

---

## Loops and Conditionals

### Lists

```tsx
// JSX
{items().map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

```go-template
{{/* Generated Go Template */}}
{{range .Items}}
<li data-bf="0">{{.Name}}</li>
{{end}}
```

### Conditionals

```tsx
// JSX
{isAdmin() && <button>Delete</button>}
```

```go-template
{{/* Generated Go Template */}}
{{if .IsAdmin}}
<button data-bf="0">Delete</button>
{{end}}
```

### Filter + Sort (SSR)

Simple filter and sort patterns compile to Go template logic:

```tsx
{todos().filter(t => t.active).sort((a, b) => a.priority - b.priority).map(t => (
  <li key={t.id}>{t.name}</li>
))}
```

Complex patterns require `/* @client */` — they'll be evaluated in the browser instead.

---

## Passing Data from Go

### Struct-Based Data

```go
type PageData struct {
    Counter CounterProps
    Todos   []Todo
}

type CounterProps struct {
    Initial int
    Label   string
}

type Todo struct {
    ID     string
    Name   string
    Done   bool
}

func handler(w http.ResponseWriter, r *http.Request) {
    data := PageData{
        Counter: CounterProps{Initial: 0, Label: "Items"},
        Todos:   fetchTodos(),
    }
    tmpl.ExecuteTemplate(w, "page", data)
}
```

### Type Generation

The Go Template Adapter can generate Go struct definitions from TypeScript interfaces:

```typescript
const adapter = new GoTemplateAdapter({
  packageName: 'main',
  generateTypes: true,  // Outputs Go structs
})
```

This generates a `.go` file with struct definitions matching your component props.

---

## Development Workflow

1. **Write components** in JSX (`components/*.tsx`)
2. **Compile** with `bun compile.ts` (or `npx tsx compile.ts`)
3. **Run** Go server: `go run main.go`
4. **Iterate**: edit JSX → recompile → refresh browser

For faster iteration, use a file watcher:

```json
{
  "scripts": {
    "compile": "tsx compile.ts",
    "watch": "tsx watch compile.ts"
  }
}
```

---

## Tips

- **Keep Go templates simple** — complex logic belongs in Go handler functions, not templates
- **Use `/* @client */`** for expressions that can't compile to Go template syntax
- **Test both phases** — verify the Go template renders correctly, then check client JS hydrates
- **PascalCase awareness** — props are auto-converted, but be mindful of naming when debugging template output
