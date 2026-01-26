// Package bf provides runtime helper functions for BarefootJS Go templates.
// These functions mirror JavaScript behavior for consistent SSR output.
package bf

import (
	"encoding/json"
	"html/template"
	"reflect"
	"strconv"
	"strings"
)

// FuncMap returns a template.FuncMap with all BarefootJS helper functions.
// Usage:
//
//	tmpl := template.New("").Funcs(bf.FuncMap())
func FuncMap() template.FuncMap {
	return template.FuncMap{
		// Arithmetic
		"bf_add": Add,
		"bf_sub": Sub,
		"bf_mul": Mul,
		"bf_div": Div,
		"bf_mod": Mod,
		"bf_neg": Neg,

		// String
		"bf_lower":    Lower,
		"bf_upper":    Upper,
		"bf_trim":     Trim,
		"bf_contains": Contains,
		"bf_join":     Join,

		// Array/Slice
		"bf_len":      Len,
		"bf_at":       At,
		"bf_includes": Includes,
		"bf_first":    First,
		"bf_last":     Last,

		// Higher-order Array Methods
		"bf_every":  Every,
		"bf_some":   Some,
		"bf_filter": Filter,

		// Comment marker (for hydration)
		"bfComment": Comment,

		// Script collection
		"bfScripts": BfScripts,
	}
}

// =============================================================================
// Arithmetic Operations
// =============================================================================

// Add returns a + b. Supports int and float64.
func Add(a, b any) any {
	av, bv := toFloat64(a), toFloat64(b)
	result := av + bv
	// Return int if both inputs were int-like
	if isIntLike(a) && isIntLike(b) && result == float64(int(result)) {
		return int(result)
	}
	return result
}

// Sub returns a - b. Supports int and float64.
func Sub(a, b any) any {
	av, bv := toFloat64(a), toFloat64(b)
	result := av - bv
	if isIntLike(a) && isIntLike(b) && result == float64(int(result)) {
		return int(result)
	}
	return result
}

// Mul returns a * b. Supports int and float64.
func Mul(a, b any) any {
	av, bv := toFloat64(a), toFloat64(b)
	result := av * bv
	if isIntLike(a) && isIntLike(b) && result == float64(int(result)) {
		return int(result)
	}
	return result
}

// Div returns a / b. Returns float64 to match JavaScript behavior.
// Returns 0 if b is 0 (instead of panicking).
func Div(a, b any) any {
	av, bv := toFloat64(a), toFloat64(b)
	if bv == 0 {
		return 0
	}
	return av / bv
}

// Mod returns a % b (modulo). Supports int only.
func Mod(a, b any) int {
	av, bv := toInt(a), toInt(b)
	if bv == 0 {
		return 0
	}
	return av % bv
}

// Neg returns -a (negation).
func Neg(a any) any {
	if v, ok := a.(int); ok {
		return -v
	}
	return -toFloat64(a)
}

// =============================================================================
// String Operations
// =============================================================================

// Lower returns the lowercase version of s.
func Lower(s string) string {
	return strings.ToLower(s)
}

// Upper returns the uppercase version of s.
func Upper(s string) string {
	return strings.ToUpper(s)
}

// Trim returns s with leading and trailing whitespace removed.
func Trim(s string) string {
	return strings.TrimSpace(s)
}

// Contains returns true if s contains substr.
func Contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

// Join concatenates elements of a slice with sep.
func Join(items any, sep string) string {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice {
		return ""
	}

	parts := make([]string, v.Len())
	for i := 0; i < v.Len(); i++ {
		parts[i] = toString(v.Index(i).Interface())
	}
	return strings.Join(parts, sep)
}

// =============================================================================
// Array/Slice Operations
// =============================================================================

// Len returns the length of a slice, array, map, string, or channel.
// Returns 0 for nil or unsupported types.
func Len(v any) int {
	if v == nil {
		return 0
	}
	rv := reflect.ValueOf(v)
	switch rv.Kind() {
	case reflect.Slice, reflect.Array, reflect.Map, reflect.String, reflect.Chan:
		return rv.Len()
	default:
		return 0
	}
}

// At returns the element at index i from a slice.
// Supports negative indices (e.g., -1 for last element).
// Returns nil if index is out of bounds.
func At(items any, index int) any {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return nil
	}

	length := v.Len()
	if length == 0 {
		return nil
	}

	// Handle negative indices
	if index < 0 {
		index = length + index
	}

	if index < 0 || index >= length {
		return nil
	}

	return v.Index(index).Interface()
}

// Includes returns true if items contains elem.
// Uses reflect.DeepEqual for comparison.
func Includes(items any, elem any) bool {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return false
	}

	for i := 0; i < v.Len(); i++ {
		if reflect.DeepEqual(v.Index(i).Interface(), elem) {
			return true
		}
	}
	return false
}

// First returns the first element of a slice, or nil if empty.
func First(items any) any {
	return At(items, 0)
}

// Last returns the last element of a slice, or nil if empty.
func Last(items any) any {
	return At(items, -1)
}

// =============================================================================
// Higher-order Array Methods
// =============================================================================

// Every returns true if all items have the specified field set to true.
// Mirrors JavaScript's Array.prototype.every(item => item.field).
func Every(items any, field string) bool {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return false
	}

	capitalizedField := capitalize(field)
	for i := 0; i < v.Len(); i++ {
		item := v.Index(i)
		if item.Kind() == reflect.Interface {
			item = item.Elem()
		}
		if item.Kind() == reflect.Ptr {
			item = item.Elem()
		}
		if item.Kind() != reflect.Struct {
			continue
		}

		fieldVal := item.FieldByName(capitalizedField)
		if !fieldVal.IsValid() {
			return false
		}
		if fieldVal.Kind() == reflect.Bool && !fieldVal.Bool() {
			return false
		}
	}
	return true
}

// Some returns true if at least one item has the specified field set to true.
// Mirrors JavaScript's Array.prototype.some(item => item.field).
func Some(items any, field string) bool {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return false
	}

	capitalizedField := capitalize(field)
	for i := 0; i < v.Len(); i++ {
		item := v.Index(i)
		if item.Kind() == reflect.Interface {
			item = item.Elem()
		}
		if item.Kind() == reflect.Ptr {
			item = item.Elem()
		}
		if item.Kind() != reflect.Struct {
			continue
		}

		fieldVal := item.FieldByName(capitalizedField)
		if fieldVal.IsValid() && fieldVal.Kind() == reflect.Bool && fieldVal.Bool() {
			return true
		}
	}
	return false
}

// Filter returns items where item.field == value.
// Mirrors JavaScript's Array.prototype.filter(item => item.field === value).
// Returns []any to allow chaining with other bf_* functions.
func Filter(items any, field string, value any) []any {
	v := reflect.ValueOf(items)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return nil
	}

	capitalizedField := capitalize(field)
	var result []any

	for i := 0; i < v.Len(); i++ {
		item := v.Index(i)
		if item.Kind() == reflect.Interface {
			item = item.Elem()
		}
		if item.Kind() == reflect.Ptr {
			item = item.Elem()
		}
		if item.Kind() != reflect.Struct {
			continue
		}

		fieldVal := item.FieldByName(capitalizedField)
		if !fieldVal.IsValid() {
			continue
		}

		// Compare field value with target value
		if reflect.DeepEqual(fieldVal.Interface(), value) {
			result = append(result, v.Index(i).Interface())
		}
	}
	return result
}

// capitalize uppercases the first character of a string.
func capitalize(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

// =============================================================================
// HTML/Template Helpers
// =============================================================================

// Comment returns an HTML comment string for hydration markers.
// The "bf-" prefix is automatically added.
func Comment(content string) template.HTML {
	return template.HTML("<!--bf-" + content + "-->")
}

// =============================================================================
// Script Collection
// =============================================================================

// ScriptCollector collects client scripts with deduplication.
// It preserves insertion order for deterministic output.
type ScriptCollector struct {
	scripts map[string]bool
	order   []string
}

// NewScriptCollector creates a new ScriptCollector.
func NewScriptCollector() *ScriptCollector {
	return &ScriptCollector{
		scripts: make(map[string]bool),
		order:   []string{},
	}
}

// Register adds a script source to the collection.
// Duplicate scripts are ignored (only first registration counts).
func (sc *ScriptCollector) Register(src string) string {
	if sc.scripts[src] {
		return "" // Already registered
	}
	sc.scripts[src] = true
	sc.order = append(sc.order, src)
	return "" // Return empty string for template use
}

// Scripts returns all registered scripts in insertion order.
func (sc *ScriptCollector) Scripts() []string {
	return sc.order
}

// BfScripts generates script tags for all registered scripts.
// Returns HTML safe for embedding in templates.
func BfScripts(collector *ScriptCollector) template.HTML {
	if collector == nil {
		return ""
	}
	var result strings.Builder
	for _, src := range collector.Scripts() {
		result.WriteString(`<script type="module" src="`)
		result.WriteString(src)
		result.WriteString(`"></script>`)
		result.WriteString("\n")
	}
	return template.HTML(result.String())
}

// =============================================================================
// Component Renderer
// =============================================================================

// RenderContext contains all data needed to render a component page.
// The layout function receives this context to build the final HTML.
type RenderContext struct {
	// ComponentName is the template name being rendered
	ComponentName string

	// Props is the component props (for layout to access if needed)
	Props interface{}

	// ComponentHTML is the rendered component template output
	ComponentHTML template.HTML

	// PropsScripts contains JSON script tags for hydration (main + children)
	PropsScripts template.HTML

	// Scripts contains the collected JS script tags
	Scripts template.HTML

	// Title is the page title (defaults to "{ComponentName} - BarefootJS")
	Title string

	// Heading is the page heading. Empty string means no heading.
	Heading string

	// Extra holds additional user-defined data for the layout
	Extra map[string]interface{}
}

// LayoutFunc renders the final HTML page given the render context.
type LayoutFunc func(ctx *RenderContext) string

// Renderer renders BarefootJS components with a customizable layout.
type Renderer struct {
	templates *template.Template
	layout    LayoutFunc
}

// NewRenderer creates a Renderer with the given templates and layout function.
//
// Example usage:
//
//	renderer := bf.NewRenderer(templates, func(ctx *bf.RenderContext) string {
//	    return fmt.Sprintf(`<!DOCTYPE html>
//	<html>
//	<head><title>%s</title></head>
//	<body>%s%s%s</body>
//	</html>`, ctx.Title, ctx.ComponentHTML, ctx.PropsScripts, ctx.Scripts)
//	})
func NewRenderer(tmpl *template.Template, layout LayoutFunc) *Renderer {
	return &Renderer{
		templates: tmpl,
		layout:    layout,
	}
}

// RenderOptions configures a single render call.
type RenderOptions struct {
	// ComponentName is the template name to render (required)
	ComponentName string

	// Props is the component props (must be a pointer to struct with Scripts field)
	Props interface{}

	// Title is the page title. If empty, defaults to "{ComponentName} - BarefootJS"
	Title string

	// Heading is the page heading. If empty, no heading is shown.
	Heading string

	// Extra holds additional data to pass to the layout
	Extra map[string]interface{}
}

// Render renders a component to a full HTML page using the configured layout.
// Child component props are automatically detected (any slice field with ScopeID/Scripts).
func (r *Renderer) Render(opts RenderOptions) string {
	// Create script collector and inject into props
	collector := NewScriptCollector()
	setScriptsField(opts.Props, collector)

	// Auto-detect and process child component props
	childSlices := findChildComponentSlices(opts.Props)
	for _, slice := range childSlices {
		setScriptsOnSlice(slice, collector)
	}

	// Render the component template
	var componentBuf strings.Builder
	r.templates.ExecuteTemplate(&componentBuf, opts.ComponentName, opts.Props)

	// Build props scripts (main + children)
	var propsScriptsBuf strings.Builder
	scopeID := getStringField(opts.Props, "ScopeID")
	if scopeID != "" {
		propsJSON, _ := json.Marshal(opts.Props)
		propsScriptsBuf.WriteString(`<script type="application/json" data-bf-props="`)
		propsScriptsBuf.WriteString(scopeID)
		propsScriptsBuf.WriteString(`">`)
		propsScriptsBuf.Write(propsJSON)
		propsScriptsBuf.WriteString(`</script>`)
	}
	for _, slice := range childSlices {
		propsScriptsBuf.WriteString(buildChildPropsScripts(slice))
	}

	// Determine title (default: "{ComponentName} - BarefootJS")
	title := opts.Title
	if title == "" {
		title = opts.ComponentName + " - BarefootJS"
	}

	// Heading (empty means no heading)
	heading := opts.Heading

	// Build render context
	ctx := &RenderContext{
		ComponentName: opts.ComponentName,
		Props:         opts.Props,
		ComponentHTML: template.HTML(componentBuf.String()),
		PropsScripts:  template.HTML(propsScriptsBuf.String()),
		Scripts:       BfScripts(collector),
		Title:         title,
		Heading:       heading,
		Extra:         opts.Extra,
	}

	return r.layout(ctx)
}

// setScriptsField sets the Scripts field on a struct using reflection.
func setScriptsField(v interface{}, collector *ScriptCollector) {
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return
	}
	field := val.FieldByName("Scripts")
	if field.IsValid() && field.CanSet() {
		field.Set(reflect.ValueOf(collector))
	}
}

// getStringField extracts a string field from a struct using reflection.
func getStringField(v interface{}, fieldName string) string {
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return ""
	}
	field := val.FieldByName(fieldName)
	if !field.IsValid() || field.Kind() != reflect.String {
		return ""
	}
	return field.String()
}

// findChildComponentSlices finds slice fields containing child component props.
// Child props are identified by having ScopeID and Scripts fields.
func findChildComponentSlices(props interface{}) []interface{} {
	var result []interface{}

	val := reflect.ValueOf(props)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return result
	}

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		if field.Kind() != reflect.Slice || field.Len() == 0 {
			continue
		}

		elem := field.Index(0)
		if elem.Kind() == reflect.Ptr {
			elem = elem.Elem()
		}
		if elem.Kind() != reflect.Struct {
			continue
		}

		hasScopeID := elem.FieldByName("ScopeID").IsValid()
		hasScripts := elem.FieldByName("Scripts").IsValid()

		if hasScopeID && hasScripts {
			result = append(result, field.Interface())
		}
	}

	return result
}

// setScriptsOnSlice sets Scripts on all items in a slice.
func setScriptsOnSlice(slice interface{}, collector *ScriptCollector) {
	val := reflect.ValueOf(slice)
	if val.Kind() != reflect.Slice {
		return
	}
	for i := 0; i < val.Len(); i++ {
		item := val.Index(i)
		if item.Kind() == reflect.Ptr {
			item = item.Elem()
		}
		if item.Kind() == reflect.Struct {
			field := item.FieldByName("Scripts")
			if field.IsValid() && field.CanSet() {
				field.Set(reflect.ValueOf(collector))
			}
		}
	}
}

// buildChildPropsScripts generates JSON script tags for child component props.
func buildChildPropsScripts(slice interface{}) string {
	val := reflect.ValueOf(slice)
	if val.Kind() != reflect.Slice {
		return ""
	}

	var buf strings.Builder
	for i := 0; i < val.Len(); i++ {
		item := val.Index(i).Interface()
		scopeID := getStringField(item, "ScopeID")
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

// =============================================================================
// Internal Helpers
// =============================================================================

func toFloat64(v any) float64 {
	switch n := v.(type) {
	case int:
		return float64(n)
	case int8:
		return float64(n)
	case int16:
		return float64(n)
	case int32:
		return float64(n)
	case int64:
		return float64(n)
	case uint:
		return float64(n)
	case uint8:
		return float64(n)
	case uint16:
		return float64(n)
	case uint32:
		return float64(n)
	case uint64:
		return float64(n)
	case float32:
		return float64(n)
	case float64:
		return n
	default:
		return 0
	}
}

func toInt(v any) int {
	switch n := v.(type) {
	case int:
		return n
	case int8:
		return int(n)
	case int16:
		return int(n)
	case int32:
		return int(n)
	case int64:
		return int(n)
	case uint:
		return int(n)
	case uint8:
		return int(n)
	case uint16:
		return int(n)
	case uint32:
		return int(n)
	case uint64:
		return int(n)
	case float32:
		return int(n)
	case float64:
		return int(n)
	default:
		return 0
	}
}

func isIntLike(v any) bool {
	switch v.(type) {
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return true
	default:
		return false
	}
}

func toString(v any) string {
	switch s := v.(type) {
	case string:
		return s
	case int:
		return strconv.Itoa(s)
	case int64:
		return strconv.FormatInt(s, 10)
	case float64:
		return strconv.FormatFloat(s, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(s)
	default:
		return ""
	}
}
