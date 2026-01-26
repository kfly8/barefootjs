package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"

	bf "github.com/barefootjs/runtime/bf"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// loadTemplates loads all templates with BarefootJS functions registered
func loadTemplates() *template.Template {
	return template.Must(
		template.New("").Funcs(bf.FuncMap()).ParseGlob("dist/templates/*.tmpl"),
	)
}

// renderer is the global component renderer with the default layout
var renderer = bf.NewRenderer(loadTemplates(), defaultLayout)

// defaultLayout renders the standard HTML page structure
func defaultLayout(ctx *bf.RenderContext) string {
	var buf strings.Builder

	buf.WriteString(`
<!DOCTYPE html>
<html>
<head>
    <title>`)
	buf.WriteString(ctx.Title)
	buf.WriteString(`</title>
    <link rel="stylesheet" href="/shared/styles/components.css">
    <link rel="stylesheet" href="/shared/styles/todo-app.css">`)

	if ctx.Heading != "" {
		buf.WriteString(`
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>`)
	}

	buf.WriteString(`
</head>
<body>`)

	if ctx.Heading != "" {
		buf.WriteString(`
    <h1>`)
		buf.WriteString(ctx.Heading)
		buf.WriteString(`</h1>`)
	}

	buf.WriteString(`
    <div id="app">`)
	buf.WriteString(string(ctx.ComponentHTML))
	buf.WriteString(string(ctx.PropsScripts))
	buf.WriteString(`</div>
    <p><a href="/">← Back</a></p>
    `)
	buf.WriteString(string(ctx.Scripts))
	buf.WriteString(`
</body>
</html>`)

	return buf.String()
}

// In-memory todo storage
var (
	todoMutex  sync.RWMutex
	todoNextID = 4
	todos      = []Todo{
		{ID: 1, Text: "Setup project", Done: false, Editing: false},
		{ID: 2, Text: "Create components", Done: false, Editing: false},
		{ID: 3, Text: "Write tests", Done: true, Editing: false},
	}
)

// Reset todos to initial state (for testing)
func resetTodos() {
	todoMutex.Lock()
	defer todoMutex.Unlock()
	todoNextID = 4
	todos = []Todo{
		{ID: 1, Text: "Setup project", Done: false, Editing: false},
		{ID: 2, Text: "Create components", Done: false, Editing: false},
		{ID: 3, Text: "Write tests", Done: true, Editing: false},
	}
}

// Template renderer for Echo
type TemplateRenderer struct {
	templates *template.Template
}

func (t *TemplateRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Load templates with BarefootJS functions
	t := &TemplateRenderer{
		templates: loadTemplates(),
	}
	e.Renderer = t

	// Routes
	e.GET("/", indexHandler)
	e.GET("/counter", counterHandler)
	e.GET("/toggle", toggleHandler)
	e.GET("/todos", todosHandler)
	e.GET("/todos-ssr", todosSSRHandler)

	// Todo API endpoints
	e.GET("/api/todos", getTodosAPI)
	e.POST("/api/todos", createTodoAPI)
	e.PUT("/api/todos/:id", updateTodoAPI)
	e.DELETE("/api/todos/:id", deleteTodoAPI)
	e.POST("/api/todos/reset", resetTodosAPI)

	// Static files (for client JS)
	e.Static("/static", "dist")

	// Shared styles
	e.Static("/shared", "../shared")

	e.Logger.Fatal(e.Start(":8080"))
}

func indexHandler(c echo.Context) error {
	return c.HTML(http.StatusOK, `
<!DOCTYPE html>
<html>
<head>
    <title>BarefootJS + Echo Example</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        h1 { color: #333; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <h1>BarefootJS + Echo Example</h1>
    <p>This example demonstrates server-side rendering with Go Echo and BarefootJS.</p>
    <ul>
        <li><a href="/counter">Counter</a></li>
        <li><a href="/toggle">Toggle</a></li>
        <li><a href="/todos">Todo (@client)</a></li>
        <li><a href="/todos-ssr">Todo (no @client markers)</a></li>
    </ul>
</body>
</html>
`)
}

func counterHandler(c echo.Context) error {
	props := NewCounterProps(CounterInput{Initial: 0})
	return c.HTML(http.StatusOK, renderer.Render(bf.RenderOptions{
		ComponentName: "Counter",
		Props:         &props,
		Title:         "Counter - BarefootJS",
		Heading:       "Counter Component",
	}))
}

func toggleHandler(c echo.Context) error {
	props := NewToggleProps(ToggleInput{
		ToggleItems: []ToggleItemInput{
			{Label: "Setting 1", DefaultOn: true},
			{Label: "Setting 2", DefaultOn: false},
			{Label: "Setting 3", DefaultOn: false},
		},
	})

	return c.HTML(http.StatusOK, renderer.Render(bf.RenderOptions{
		ComponentName: "Toggle",
		Props:         &props,
		Title:         "Toggle - BarefootJS",
		Heading:       "Toggle Component",
	}))
}

func todosHandler(c echo.Context) error {
	todoMutex.RLock()
	currentTodos := make([]Todo, len(todos))
	copy(currentTodos, todos)
	todoMutex.RUnlock()

	// Count done todos
	doneCount := 0
	for _, t := range currentTodos {
		if t.Done {
			doneCount++
		}
	}

	// Build TodoItemProps array with ScopeID for each item
	todoItems := make([]TodoItemProps, len(currentTodos))
	for i, t := range currentTodos {
		todoItems[i] = TodoItemProps{
			ScopeID: fmt.Sprintf("TodoItem_%d", t.ID),
			Todo:    t,
		}
	}

	props := NewTodoAppProps(TodoAppInput{
		InitialTodos: currentTodos,
	})
	// Manual fields not generated by NewTodoAppProps
	props.Todos = currentTodos  // For client hydration (JSON)
	props.TodoItems = todoItems // For Go template (not in JSON)
	props.DoneCount = doneCount

	return c.HTML(http.StatusOK, renderer.Render(bf.RenderOptions{
		ComponentName: "TodoApp",
		Props:         &props,
		Title:         "TodoMVC - BarefootJS",
		Heading:       "", // TodoMVC header inside component
	}))
}

func todosSSRHandler(c echo.Context) error {
	todoMutex.RLock()
	currentTodos := make([]Todo, len(todos))
	copy(currentTodos, todos)
	todoMutex.RUnlock()

	// Count done todos
	doneCount := 0
	for _, t := range currentTodos {
		if t.Done {
			doneCount++
		}
	}

	// Build TodoItemProps array with ScopeID for each item
	todoItems := make([]TodoItemProps, len(currentTodos))
	for i, t := range currentTodos {
		todoItems[i] = TodoItemProps{
			ScopeID: fmt.Sprintf("TodoItem_%d", t.ID),
			Todo:    t,
		}
	}

	props := NewTodoAppSSRProps(TodoAppSSRInput{
		InitialTodos: currentTodos,
	})
	// Manual fields not generated by NewTodoAppSSRProps
	props.Todos = currentTodos  // For client hydration (JSON)
	props.TodoItems = todoItems // For Go template (not in JSON)
	props.DoneCount = doneCount

	return c.HTML(http.StatusOK, renderer.Render(bf.RenderOptions{
		ComponentName: "TodoAppSSR",
		Props:         &props,
		Title:         "TodoMVC SSR - BarefootJS",
		Heading:       "",
	}))
}

// Todo API handlers
func getTodosAPI(c echo.Context) error {
	todoMutex.RLock()
	defer todoMutex.RUnlock()
	return c.JSON(http.StatusOK, todos)
}

func createTodoAPI(c echo.Context) error {
	var input struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	todoMutex.Lock()
	newTodo := Todo{
		ID:   todoNextID,
		Text: input.Text,
		Done: false,
	}
	todoNextID++
	todos = append(todos, newTodo)
	todoMutex.Unlock()

	return c.JSON(http.StatusCreated, newTodo)
}

func updateTodoAPI(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	var input struct {
		Text *string `json:"text"`
		Done *bool   `json:"done"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid input"})
	}

	todoMutex.Lock()
	defer todoMutex.Unlock()

	for i, todo := range todos {
		if todo.ID == id {
			if input.Text != nil {
				todos[i].Text = *input.Text
			}
			if input.Done != nil {
				todos[i].Done = *input.Done
			}
			return c.JSON(http.StatusOK, todos[i])
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
}

func deleteTodoAPI(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	todoMutex.Lock()
	defer todoMutex.Unlock()

	for i, todo := range todos {
		if todo.ID == id {
			todos = append(todos[:i], todos[i+1:]...)
			return c.NoContent(http.StatusNoContent)
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
}

func resetTodosAPI(c echo.Context) error {
	resetTodos()
	return c.NoContent(http.StatusOK)
}
