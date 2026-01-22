// Package bf provides runtime helper functions for BarefootJS Go templates.
// These functions mirror JavaScript behavior for consistent SSR output.
package bf

import (
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

		// Comment marker (for hydration)
		"bfComment": Comment,
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
// HTML/Template Helpers
// =============================================================================

// Comment returns an HTML comment string for hydration markers.
// The "bf-" prefix is automatically added.
func Comment(content string) template.HTML {
	return template.HTML("<!--bf-" + content + "-->")
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
