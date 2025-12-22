# BarefootJS Examples

This directory contains example projects demonstrating how to use BarefootJS.

## Examples

### Counter (`examples/counter`)
A simple counter application demonstrating:
- Signal-based reactivity
- Event handlers
- Static HTML generation

### Todo (`examples/todo`)
A todo list application demonstrating:
- Multiple components
- Form handling
- Local state management
- Static HTML generation

### Hono (`examples/hono`)
Server-side rendering with Hono demonstrating:
- Server components
- Multiple independent components
- SSR with Hono web framework

## Building Examples

Each example can be built using the configuration-based build system:

```bash
# Navigate to an example directory
cd examples/counter

# Build using the configuration
bun run build

# Or use the legacy build.ts directly
bun run build:legacy
```

### Configuration Files

Each example includes a `barefoot.config.json` file that defines:
- Build mode (static or server)
- Entry points and templates
- Output configuration

See [BUILD_CONFIG.md](../BUILD_CONFIG.md) for detailed documentation on the configuration format.

## Development Workflow

1. **Make changes** to your TSX components
2. **Build** the project: `bun run build`
3. **Preview** the result:
   - For static examples: `bun run serve` (starts a local server)
   - For Hono example: `bun run dev` (starts development server with hot reload)

## Project Structure

Each example typically contains:
- `*.tsx` - Component files
- `barefoot.config.json` - Build configuration
- `build.ts` - Legacy build script (optional, for reference)
- `template.html` - HTML template (static examples only)
- `package.json` - Dependencies and scripts
- `dist/` - Build output (generated)

## Migrating from build.ts

If you have an existing example with `build.ts`:

1. Extract configuration values into `barefoot.config.json`
2. Update `package.json` build script to use `../../jsx/build.cli.ts`
3. Test the new build process
4. Optionally keep `build.ts` as `build:legacy` for reference
