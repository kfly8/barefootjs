# UI Specification

## Sidebar Menu

Left sidebar navigation for the BarefootJS documentation site.

### Structure

```
Sidebar Menu
├── Get Started (defaultOpen: true)
│   └── Introduction
├── Components
│   ├── Accordion
│   ├── Badge
│   ├── Button
│   └── ...
├── Forms
│   ├── Controlled Input
│   ├── Field Arrays
│   └── ...
├── Blocks
│   └── (empty)
└── Charts
    └── (empty)
```

### Behavior

#### Accordion Categories

- Categories use native `<details>/<summary>` HTML elements
- Multiple categories can be open simultaneously
- Clicking a category header toggles its open/closed state
- Chevron icon rotates 90 degrees when category is open

#### Empty Categories

- Empty categories (Blocks, Charts) are displayed and expandable
- No "Coming Soon" label or disabled state
- Simply shows an empty content area when expanded

#### Auto-Expand Logic (Initial State)

| Condition | Behavior |
|-----------|----------|
| Active item exists in menu | Only the category containing the active item is open |
| No active item (e.g., unknown page) | Categories with `defaultOpen: true` are open |

Example:
- On `/components/button`: Only "Components" is open, "Get Started" is closed
- On `/`: "Get Started" is open (contains `/`), others are closed

#### Accordion State Persistence (Planned)

- **Scope**: Session only (sessionStorage)
- User's manual open/close actions are remembered during the browser session
- State resets when the browser is closed or a new session starts
- Initial auto-expand logic applies only on first page load of the session

> **Note**: Session persistence requires compiler support for module-level helper functions.
> Currently not implemented. See [compiler issue #152](https://github.com/kfly8/barefootjs/issues/152).

#### Active Item Highlighting

**URL Matching Strategy**: Exact match (current) / Prefix match (planned)

| URL | Active Item (current) | Active Item (planned) |
|-----|----------------------|----------------------|
| `/components/button` | Button | Button |
| `/components/button#variants` | None | Button |
| `/components/button/advanced` | None | Button |
| `/unknown/path` | None | None |

- Active item styling: `bg-accent text-foreground font-medium`
- Inactive item styling: `text-muted-foreground` with hover effects

> **Note**: Prefix matching requires compiler support for module-level helper functions.
> Currently using exact match. See [compiler issue #152](https://github.com/kfly8/barefootjs/issues/152).

### Layout

- Position: Fixed, left edge (`left-0`)
- Width: `w-56` (224px)
- Height: Full viewport minus header (`h-[calc(100vh-56px)]`)
- Top offset: Below header (`top-14` = 56px)
- Visibility: Hidden on small screens, visible on `xl:` breakpoint
- Border: Right border (`border-r border-border`)
- Overflow: Scrollable (`overflow-y-auto`)

### Preview on Hover (Phase 3)

- **Scope**: All categories (Components, Forms, Blocks, Charts)
- **Content**: Uniform format across all items (screenshot or description)
- **Position**: Right side of menu, overlaying main content
- **Trigger**: Mouse hover on menu item
- **Delay**: TBD (consider debounce to prevent flicker)

### Mobile Navigation (Phase 4)

- Hamburger menu icon in header
- Full-screen overlay menu
- No preview functionality on mobile
- Touch-friendly tap targets

### Future Enhancements

- [ ] Preview on hover (Phase 3)
- [ ] Mobile hamburger menu (Phase 4)
- [ ] Keyboard navigation (arrow keys, Enter to select)
- [ ] Focus management for accessibility
