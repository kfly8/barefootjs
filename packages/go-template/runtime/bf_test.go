package bf

import (
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
		"bfComment",
	}

	for _, name := range expectedFuncs {
		if _, ok := fm[name]; !ok {
			t.Errorf("FuncMap missing function: %s", name)
		}
	}
}
