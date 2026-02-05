package bf

import (
	"html/template"
	"testing"
)

func TestAdd(t *testing.T) {
	tests := []struct {
		a, b any
		want any
	}{
		{1, 2, 3},
		{10, -5, 5},
		{1.5, 2.5, 4.0},
		{1, 2.5, 3.5},
	}

	for _, tt := range tests {
		got := Add(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Add(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestSub(t *testing.T) {
	tests := []struct {
		a, b any
		want any
	}{
		{5, 3, 2},
		{10, -5, 15},
		{5.5, 2.5, 3.0},
	}

	for _, tt := range tests {
		got := Sub(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Sub(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestMul(t *testing.T) {
	tests := []struct {
		a, b any
		want any
	}{
		{3, 4, 12},
		{-2, 5, -10},
		{2.5, 4.0, 10.0},
	}

	for _, tt := range tests {
		got := Mul(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Mul(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestDiv(t *testing.T) {
	tests := []struct {
		a, b any
		want any
	}{
		{10, 2, 5.0},
		{7, 2, 3.5},
		{10, 0, 0}, // Division by zero returns 0
	}

	for _, tt := range tests {
		got := Div(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Div(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestMod(t *testing.T) {
	tests := []struct {
		a, b any
		want int
	}{
		{10, 3, 1},
		{10, 5, 0},
		{10, 0, 0}, // Mod by zero returns 0
	}

	for _, tt := range tests {
		got := Mod(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("Mod(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestNeg(t *testing.T) {
	tests := []struct {
		a    any
		want any
	}{
		{5, -5},
		{-3, 3},
		{2.5, -2.5},
	}

	for _, tt := range tests {
		got := Neg(tt.a)
		if got != tt.want {
			t.Errorf("Neg(%v) = %v, want %v", tt.a, got, tt.want)
		}
	}
}

func TestLower(t *testing.T) {
	if got := Lower("HELLO"); got != "hello" {
		t.Errorf("Lower(HELLO) = %v, want hello", got)
	}
}

func TestUpper(t *testing.T) {
	if got := Upper("hello"); got != "HELLO" {
		t.Errorf("Upper(hello) = %v, want HELLO", got)
	}
}

func TestTrim(t *testing.T) {
	if got := Trim("  hello  "); got != "hello" {
		t.Errorf("Trim(  hello  ) = %v, want hello", got)
	}
}

func TestContains(t *testing.T) {
	if !Contains("hello world", "world") {
		t.Error("Contains(hello world, world) should be true")
	}
	if Contains("hello world", "foo") {
		t.Error("Contains(hello world, foo) should be false")
	}
}

func TestJoin(t *testing.T) {
	items := []string{"a", "b", "c"}
	if got := Join(items, ", "); got != "a, b, c" {
		t.Errorf("Join(%v, ', ') = %v, want 'a, b, c'", items, got)
	}
}

func TestLen(t *testing.T) {
	tests := []struct {
		v    any
		want int
	}{
		{[]int{1, 2, 3}, 3},
		{[]string{}, 0},
		{"hello", 5},
		{nil, 0},
		{map[string]int{"a": 1, "b": 2}, 2},
	}

	for _, tt := range tests {
		got := Len(tt.v)
		if got != tt.want {
			t.Errorf("Len(%v) = %v, want %v", tt.v, got, tt.want)
		}
	}
}

func TestAt(t *testing.T) {
	items := []string{"a", "b", "c", "d"}

	tests := []struct {
		index int
		want  any
	}{
		{0, "a"},
		{1, "b"},
		{-1, "d"},  // Last element
		{-2, "c"},  // Second to last
		{10, nil},  // Out of bounds
		{-10, nil}, // Out of bounds
	}

	for _, tt := range tests {
		got := At(items, tt.index)
		if got != tt.want {
			t.Errorf("At(items, %v) = %v, want %v", tt.index, got, tt.want)
		}
	}
}

func TestIncludes(t *testing.T) {
	items := []int{1, 2, 3, 4, 5}

	if !Includes(items, 3) {
		t.Error("Includes(items, 3) should be true")
	}
	if Includes(items, 10) {
		t.Error("Includes(items, 10) should be false")
	}
}

func TestFirst(t *testing.T) {
	items := []string{"a", "b", "c"}
	if got := First(items); got != "a" {
		t.Errorf("First(items) = %v, want 'a'", got)
	}

	empty := []string{}
	if got := First(empty); got != nil {
		t.Errorf("First(empty) = %v, want nil", got)
	}
}

func TestLast(t *testing.T) {
	items := []string{"a", "b", "c"}
	if got := Last(items); got != "c" {
		t.Errorf("Last(items) = %v, want 'c'", got)
	}

	empty := []string{}
	if got := Last(empty); got != nil {
		t.Errorf("Last(empty) = %v, want nil", got)
	}
}

func TestComment(t *testing.T) {
	got := Comment("cond-start:slot_0")
	want := "<!--bf-cond-start:slot_0-->"
	if string(got) != want {
		t.Errorf("Comment(cond-start:slot_0) = %v, want %v", got, want)
	}
}

func TestFuncMap(t *testing.T) {
	fm := FuncMap()

	// Check that all expected functions are present
	expectedFuncs := []string{
		"bf_add", "bf_sub", "bf_mul", "bf_div", "bf_mod", "bf_neg",
		"bf_lower", "bf_upper", "bf_trim", "bf_contains", "bf_join",
		"bf_len", "bf_at", "bf_includes", "bf_first", "bf_last",
		"bfComment", "bfPortalHTML",
	}

	for _, name := range expectedFuncs {
		if _, ok := fm[name]; !ok {
			t.Errorf("FuncMap missing function: %s", name)
		}
	}
}

// =============================================================================
// Portal HTML Rendering Tests
// =============================================================================

func TestPortalHTML_Static(t *testing.T) {
	result := PortalHTML(nil, "<div>Hello</div>")
	expected := template.HTML("<div>Hello</div>")
	if result != expected {
		t.Errorf("PortalHTML static = %q, want %q", result, expected)
	}
}

func TestPortalHTML_Dynamic(t *testing.T) {
	data := struct {
		Name string
	}{Name: "World"}

	result := PortalHTML(data, "<div>Hello {{.Name}}</div>")
	expected := template.HTML("<div>Hello World</div>")
	if result != expected {
		t.Errorf("PortalHTML dynamic = %q, want %q", result, expected)
	}
}

func TestPortalHTML_Conditional(t *testing.T) {
	data := struct {
		Open bool
	}{Open: true}

	result := PortalHTML(data, `<div data-state="{{if .Open}}open{{else}}closed{{end}}"></div>`)
	expected := template.HTML(`<div data-state="open"></div>`)
	if result != expected {
		t.Errorf("PortalHTML conditional = %q, want %q", result, expected)
	}

	// Test with Open = false
	data.Open = false
	result = PortalHTML(data, `<div data-state="{{if .Open}}open{{else}}closed{{end}}"></div>`)
	expected = template.HTML(`<div data-state="closed"></div>`)
	if result != expected {
		t.Errorf("PortalHTML conditional (false) = %q, want %q", result, expected)
	}
}

func TestPortalHTML_InvalidTemplate(t *testing.T) {
	result := PortalHTML(nil, "{{.Unclosed")
	// Should return error comment instead of panicking
	if !contains(string(result), "bfPortalHTML error") {
		t.Errorf("PortalHTML invalid template should return error comment, got %q", result)
	}
}

// =============================================================================
// Portal Collection Tests
// =============================================================================

func TestNewPortalCollector(t *testing.T) {
	pc := NewPortalCollector()
	if pc == nil {
		t.Error("NewPortalCollector() returned nil")
	}
	if len(pc.portals) != 0 {
		t.Errorf("NewPortalCollector() should have empty portals, got %d", len(pc.portals))
	}
	if pc.counter != 0 {
		t.Errorf("NewPortalCollector() counter should be 0, got %d", pc.counter)
	}
}

func TestPortalCollector_Add(t *testing.T) {
	pc := NewPortalCollector()

	// Add first portal
	result := pc.Add("scope-1", "<div>Content 1</div>")
	if result != "" {
		t.Errorf("Add() should return empty string, got %q", result)
	}
	if len(pc.portals) != 1 {
		t.Errorf("After first Add(), portals count should be 1, got %d", len(pc.portals))
	}
	if pc.portals[0].ID != "bf-portal-1" {
		t.Errorf("First portal ID should be 'bf-portal-1', got %q", pc.portals[0].ID)
	}
	if pc.portals[0].OwnerID != "scope-1" {
		t.Errorf("First portal OwnerID should be 'scope-1', got %q", pc.portals[0].OwnerID)
	}

	// Add second portal
	pc.Add("scope-2", "<div>Content 2</div>")
	if len(pc.portals) != 2 {
		t.Errorf("After second Add(), portals count should be 2, got %d", len(pc.portals))
	}
	if pc.portals[1].ID != "bf-portal-2" {
		t.Errorf("Second portal ID should be 'bf-portal-2', got %q", pc.portals[1].ID)
	}
}

func TestPortalCollector_Render_Empty(t *testing.T) {
	pc := NewPortalCollector()
	result := pc.Render()
	if result != "" {
		t.Errorf("Render() on empty collector should return empty string, got %q", result)
	}
}

func TestPortalCollector_Render_Nil(t *testing.T) {
	var pc *PortalCollector
	result := pc.Render()
	if result != "" {
		t.Errorf("Render() on nil collector should return empty string, got %q", result)
	}
}

func TestPortalCollector_Render_Single(t *testing.T) {
	pc := NewPortalCollector()
	pc.Add("scope-abc", "<div>Portal Content</div>")

	result := string(pc.Render())
	expected := `<div data-bf-portal-id="bf-portal-1" data-bf-portal-owner="scope-abc"><div>Portal Content</div></div>` + "\n"
	if result != expected {
		t.Errorf("Render() = %q, want %q", result, expected)
	}
}

func TestPortalCollector_Render_Multiple(t *testing.T) {
	pc := NewPortalCollector()
	pc.Add("scope-1", "<div>Content 1</div>")
	pc.Add("scope-2", "<span>Content 2</span>")

	result := string(pc.Render())

	// Check that both portals are rendered
	if !contains(result, `data-bf-portal-id="bf-portal-1"`) {
		t.Error("Render() should contain first portal ID")
	}
	if !contains(result, `data-bf-portal-id="bf-portal-2"`) {
		t.Error("Render() should contain second portal ID")
	}
	if !contains(result, `data-bf-portal-owner="scope-1"`) {
		t.Error("Render() should contain first portal owner")
	}
	if !contains(result, `data-bf-portal-owner="scope-2"`) {
		t.Error("Render() should contain second portal owner")
	}
	if !contains(result, "<div>Content 1</div>") {
		t.Error("Render() should contain first portal content")
	}
	if !contains(result, "<span>Content 2</span>") {
		t.Error("Render() should contain second portal content")
	}
}

// helper function for string contains check
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
