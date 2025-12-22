# Build Configuration Guide

BarefootJS now supports configuration-based builds instead of requiring manual `build.ts` files for each example.

## Configuration File Format

We use **JSON** format for configuration files (`barefoot.config.json`).

JSON was chosen because:
- Native to JavaScript/TypeScript (no additional parsing libraries needed)
- Simple and familiar to JavaScript developers
- Sufficient for our configuration needs

## Configuration Schema

### Static Build Mode

For projects that generate a single static HTML file (like counter and todo examples):

```json
{
  "mode": "static",
  "entry": "index.tsx",
  "template": "template.html",
  "title": "Page Title",
  "dist": "dist"
}
```

**Fields:**
- `mode` (required): `"static"` - Indicates static HTML generation
- `entry` (required): Entry point TSX file
- `template` (required): HTML template file with placeholders: `{{title}}`, `{{content}}`, `{{scripts}}`
- `title` (required): Page title to insert into template
- `dist` (optional): Output directory (defaults to `"dist"`)

### Server Build Mode

For server-side rendering projects (like hono example):

```json
{
  "mode": "server",
  "components": ["Counter", "Toggle"],
  "dist": "dist"
}
```

**Fields:**
- `mode` (required): `"server"` - Indicates server-side component generation
- `components` (required): Array of component names (without `.tsx` extension)
- `dist` (optional): Output directory (defaults to `"dist"`)

## Usage

### Using the CLI Tool

From your project directory:

```bash
# Using default config file (barefoot.config.json)
bun ../../jsx/build.cli.ts

# Using a specific config file
bun ../../jsx/build.cli.ts path/to/config.json
```

### Using as a Library

```typescript
import { build } from 'barefootjs/jsx'

// Build with config file
await build('./barefoot.config.json')
```

### Using in package.json

Add a build script to your example's `package.json`:

```json
{
  "scripts": {
    "build": "bun ../../jsx/build.cli.ts"
  }
}
```

Then run:

```bash
bun run build
```

## Examples

### Counter Example

File: `examples/counter/barefoot.config.json`

```json
{
  "mode": "static",
  "entry": "index.tsx",
  "template": "template.html",
  "title": "BarefootJS Counter",
  "dist": "dist"
}
```

This configuration:
1. Compiles `index.tsx` and its components
2. Generates static HTML using `template.html`
3. Outputs to `dist/` directory:
   - `index.html` - Main HTML file
   - `Counter.client-{hash}.js` - Component JavaScript
   - `barefoot.js` - Runtime library

### Todo Example

File: `examples/todo/barefoot.config.json`

```json
{
  "mode": "static",
  "entry": "index.tsx",
  "template": "template.html",
  "title": "BarefootJS Todo",
  "dist": "dist"
}
```

Similar to counter, but compiles the Todo app components.

### Hono Example

File: `examples/hono/barefoot.config.json`

```json
{
  "mode": "server",
  "components": ["Counter", "Toggle"],
  "dist": "dist"
}
```

This configuration:
1. Compiles each component separately
2. Generates server components (`.tsx`) and client code (`.client-{hash}.js`)
3. Creates `manifest.json` for component mapping
4. Outputs to `dist/` directory:
   - `Counter.tsx`, `Toggle.tsx` - Server components
   - `Counter.client-{hash}.js`, `Toggle.client-{hash}.js` - Client JavaScript
   - `barefoot-{hash}.js` - Runtime library
   - `manifest.json` - Component manifest

## Migration from build.ts

If you have an existing `build.ts` file:

1. **Identify the build mode**: Does it generate static HTML or server components?

2. **Extract configuration values** from your `build.ts`:
   - Entry point(s)
   - Template file (for static mode)
   - Page title (for static mode)
   - Component names (for server mode)

3. **Create `barefoot.config.json`** with the appropriate schema

4. **Remove `build.ts`** (optional - you can keep it for custom builds)

5. **Update build commands** to use the new CLI tool

### Example Migration

**Before (build.ts):**
```typescript
const entryPath = resolve(ROOT_DIR, 'index.tsx')
const template = await Bun.file(resolve(ROOT_DIR, 'template.html')).text()
const html = template
  .replace('{{title}}', 'My App')
  // ... more build logic
```

**After (barefoot.config.json):**
```json
{
  "mode": "static",
  "entry": "index.tsx",
  "template": "template.html",
  "title": "My App",
  "dist": "dist"
}
```

## API Reference

### `build(configPath: string): Promise<void>`

Executes the build process using the specified configuration file.

**Parameters:**
- `configPath` - Path to the configuration file

**Throws:**
- Error if configuration is invalid
- Error if build fails

### `loadBuildConfig(configPath: string): Promise<ResolvedBuildConfig>`

Loads and validates a build configuration file.

**Parameters:**
- `configPath` - Path to the configuration file

**Returns:**
- Resolved configuration with computed paths

## TypeScript Types

```typescript
import type { 
  BuildConfig, 
  StaticBuildConfig, 
  ServerBuildConfig,
  ResolvedBuildConfig 
} from 'barefootjs/jsx'
```
