package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"reflect"
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
        <li><a href="/todos">Todo (SSR + API)</a></li>
    </ul>
</body>
</html>
`)
}

func counterHandler(c echo.Context) error {
	props := NewCounterProps(CounterInput{Initial: 0})

	// Wrap the component in a full HTML page
	return c.HTML(http.StatusOK, renderPage("Counter", props))
}

func renderPage(componentName string, props interface{}) string {
	return renderPageWithScripts(componentName, props, "", nil)
}

// renderPageWithScripts renders a component in a full HTML page with hydration scripts.
// childPropsScripts contains additional props script tags for child components.
// childComponents lists component names that need their client scripts loaded before the parent.
func renderPageWithScripts(componentName string, props interface{}, childPropsScripts string, childComponents []string) string {
	t := loadTemplates()

	// Get ScopeID from props using reflection
	scopeID := getField(props, "ScopeID")

	// Serialize props to JSON for client hydration
	propsJSON := "{}"
	if jsonBytes, err := json.Marshal(props); err == nil {
		propsJSON = string(jsonBytes)
	}

	var buf strings.Builder

	// Write page header
	buf.WriteString(`
<!DOCTYPE html>
<html>
<head>
    <title>`)
	buf.WriteString(componentName)
	buf.WriteString(` - BarefootJS + Echo</title>
    <link rel="stylesheet" href="/shared/styles/components.css">
    <link rel="stylesheet" href="/shared/styles/todo-app.css">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>
</head>
<body>
    <h1>`)
	buf.WriteString(componentName)
	buf.WriteString(` Component</h1>
    <div id="app">`)

	// Render the component template
	t.ExecuteTemplate(&buf, componentName, props)

	// Add props JSON for client hydration
	if scopeID != "" {
		buf.WriteString(`<script type="application/json" data-bf-props="`)
		buf.WriteString(scopeID)
		buf.WriteString(`">`)
		buf.WriteString(propsJSON)
		buf.WriteString(`</script>`)
	}

	// Add child component props scripts if provided
	buf.WriteString(childPropsScripts)

	buf.WriteString(`</div>
    <p><a href="/">← Back to index</a></p>
`)

	// Add child component scripts first (they need to be registered before parent)
	for _, child := range childComponents {
		buf.WriteString(`    <script type="module" src="/static/client/`)
		buf.WriteString(child)
		buf.WriteString(`.client.js"></script>
`)
	}

	// Add main component script
	buf.WriteString(`    <script type="module" src="/static/client/`)
	buf.WriteString(componentName)
	buf.WriteString(`.client.js"></script>
</body>
</html>`)

	return buf.String()
}

// getField extracts a string field from a struct using reflection
func getField(v interface{}, field string) string {
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return ""
	}
	f := val.FieldByName(field)
	if !f.IsValid() {
		return ""
	}
	if f.Kind() == reflect.String {
		return f.String()
	}
	return ""
}

func toggleHandler(c echo.Context) error {
	props := NewToggleProps(ToggleInput{
		ToggleItems: []ToggleItemInput{
			{Label: "Setting 1", DefaultOn: true},
			{Label: "Setting 2", DefaultOn: false},
			{Label: "Setting 3", DefaultOn: false},
		},
	})

	childPropsScripts := buildChildPropsScripts(props.ToggleItems)

	return c.HTML(http.StatusOK, renderPageWithScripts("Toggle", props, childPropsScripts, []string{"Toggle"}))
}

// buildChildPropsScripts generates props script tags for a slice of child components.
// Each element must have ScopeID field for client hydration.
func buildChildPropsScripts[T any](items []T) string {
	var buf strings.Builder
	for _, item := range items {
		scopeID := getField(item, "ScopeID")
		if scopeID == "" {
			continue
		}
		jsonBytes, err := json.Marshal(item)
		if err != nil {
			continue
		}
		buf.WriteString(`<script type="application/json" data-bf-props="`)
		buf.WriteString(scopeID)
		buf.WriteString(`">`)
		buf.Write(jsonBytes)
		buf.WriteString(`</script>`)
	}
	return buf.String()
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

	return c.HTML(http.StatusOK, renderTodoAppPage(props))
}

// renderTodoAppPage renders TodoApp without the component heading (follows TodoMVC styling)
func renderTodoAppPage(props TodoAppProps) string {
	t := loadTemplates()

	scopeID := props.ScopeID
	propsJSON := "{}"
	if jsonBytes, err := json.Marshal(props); err == nil {
		propsJSON = string(jsonBytes)
	}

	var buf strings.Builder

	buf.WriteString(`
<!DOCTYPE html>
<html>
<head>
    <title>TodoMVC - BarefootJS</title>
    <link rel="stylesheet" href="/shared/styles/components.css">
    <link rel="stylesheet" href="/shared/styles/todo-app.css">
</head>
<body>
    <div id="app">`)

	t.ExecuteTemplate(&buf, "TodoApp", props)

	if scopeID != "" {
		buf.WriteString(`<script type="application/json" data-bf-props="`)
		buf.WriteString(scopeID)
		buf.WriteString(`">`)
		buf.WriteString(propsJSON)
		buf.WriteString(`</script>`)
	}

	buf.WriteString(`</div>
    <p><a href="/">← Back</a></p>
    <script type="module" src="/static/client/TodoItem.client.js"></script>
    <script type="module" src="/static/client/TodoApp.client.js"></script>
</body>
</html>`)

	return buf.String()
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
