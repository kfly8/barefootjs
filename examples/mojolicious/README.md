# BarefootJS + Mojolicious (Perl) Demo

This example demonstrates **Marked Templates** - a language-agnostic approach
to using BarefootJS with any server-side language.

## Concept

```
┌─────────────────────────────────────────────────────────────┐
│  Traditional BarefootJS                                     │
├─────────────────────────────────────────────────────────────┤
│  JSX → Compiler → Marked JSX (Hono) + Client JS            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Marked Templates (this demo)                               │
├─────────────────────────────────────────────────────────────┤
│  Any Template Engine → Marked HTML + Client JS             │
│  (EP, ERB, Jinja2, Blade, etc.)                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Insight

The Client JS only needs:
1. `data-bf-scope` - to find the component root
2. `data-bf` - to find elements within the component
3. `data-bf-props` - to hydrate with initial props

These are just HTML attributes - **any template engine can output them**.

## Files

```
examples/mojolicious/
├── app.pl                      # Mojolicious Lite app
├── templates/
│   ├── layouts/
│   │   └── default.html.ep     # Base layout
│   ├── index.html.ep           # Main page
│   └── counter.html.ep         # Counter Marked Template
└── public/
    └── js/
        ├── barefoot.js         # Minimal runtime
        └── counter.js          # Counter Client JS
```

## Running

```bash
# Install Mojolicious
cpanm Mojolicious

# Run the app
cd examples/mojolicious
morbo app.pl

# Open browser
open http://localhost:3000
```

## Counter Marked Template (EP)

```html
<div data-bf-scope="<%= $instance_id %>">
  <button data-bf="2">-</button>
  <span data-bf="0"><%= $count %></span>
  <button data-bf="1">+</button>
</div>

<script type="application/json" data-bf-props="<%= $instance_id %>">
{"count": <%= $count %>}
</script>
```

## Same Pattern in Other Languages

### Ruby (ERB)
```erb
<div data-bf-scope="<%= @instance_id %>">
  <span data-bf="0"><%= @count %></span>
</div>
```

### Python (Jinja2)
```jinja2
<div data-bf-scope="{{ instance_id }}">
  <span data-bf="0">{{ count }}</span>
</div>
```

### PHP (Blade)
```blade
<div data-bf-scope="{{ $instanceId }}">
  <span data-bf="0">{{ $count }}</span>
</div>
```

### Go
```go
<div data-bf-scope="{{.InstanceID}}">
  <span data-bf="0">{{.Count}}</span>
</div>
```

## Why This Matters

- **Use your existing server-side stack** (Rails, Django, Laravel, etc.)
- **Add SolidJS-style reactivity** without rewriting everything
- **No build step required** for the templates
- **Client JS is the same** regardless of server language
