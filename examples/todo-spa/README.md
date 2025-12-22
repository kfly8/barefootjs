# BarefootJS Todo SPA Example

This example demonstrates a Todo application that uses a Hono API backend with BarefootJS on the frontend.

## Features

- **Server API**: REST API endpoints (GET, POST, PUT, DELETE) for managing todos
- **Client Interactivity**: Fetches data from the API on mount using `fetch`
- **Real-time Updates**: All CRUD operations sync with the server via fetch API
- **SSR**: Server-side rendering with Hono
- **Client-side Reactivity**: Uses BarefootJS signals for reactive UI updates

## Architecture

```
TodoApp (client)
    ├── Initial fetch: GET /api/todos on mount
    ├── AddTodoForm: POST /api/todos
    └── TodoItem: PUT/DELETE /api/todos/:id

Server (Hono)
    ├── GET    /api/todos      - List all todos
    ├── POST   /api/todos      - Create new todo
    ├── PUT    /api/todos/:id  - Update todo
    └── DELETE /api/todos/:id  - Delete todo
```

## Implementation Note

The issue requested using `createEffect` to call the API. While `createEffect` is demonstrated in the source code (`TodoApp.tsx`), the current BarefootJS compiler only extracts `createEffect` calls that are directly tied to reactive JSX expressions for DOM updates.

For the initial data fetch, the build script (`build.ts`) injects the fetch logic directly into the compiled client bundle. This ensures the data is loaded when the page initializes while maintaining the reactive patterns for subsequent updates.

## Running

### Build

```bash
bun run build
```

This compiles the JSX components into:
- Server components (for SSR)
- Client JavaScript (for interactivity)
- Injects initialization code for data fetching

### Development

```bash
bun run dev
```

Starts the server on http://localhost:3000 with hot reload.

## Key Differences from examples/todo

- **examples/todo**: Client-only, state stored in memory
- **examples/todo-spa**: Client-server architecture, state synced with API

## Files

- `server.tsx`: Hono server with REST API endpoints
- `TodoApp.tsx`: Main component with data fetching logic
- `TodoItem.tsx`: Individual todo item component
- `AddTodoForm.tsx`: Form for adding new todos
- `build.ts`: Build script to compile components and inject initialization code
- `renderer.tsx`: Page layout and script injection
