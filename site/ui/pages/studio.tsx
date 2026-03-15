/**
 * Studio Page — Interactive design system builder prototype
 *
 * Canvas-based layout inspired by whiteboard tools (Miro).
 * Full-viewport canvas with component groups as "islands",
 * floating token panel, zoom controls, and fixed export bar.
 *
 * Zoom in/out is implemented via CSS transform on the canvas.
 */

// ─── Preset Data ────────────────────────────────────────────

type TokenColors = Record<string, { light: string; dark: string }>

interface Preset {
  name: string
  colors: TokenColors
  radius: string
}

const presets: Preset[] = [
  {
    name: 'Default',
    colors: {
      background:              { light: 'oklch(1 0 0)',               dark: 'oklch(0.145 0 0)' },
      foreground:              { light: 'oklch(0.145 0 0)',           dark: 'oklch(0.985 0 0)' },
      card:                    { light: 'oklch(1 0 0)',               dark: 'oklch(0.205 0 0)' },
      'card-foreground':       { light: 'oklch(0.145 0 0)',           dark: 'oklch(0.985 0 0)' },
      primary:                 { light: 'oklch(0.205 0 0)',           dark: 'oklch(0.35 0 0)' },
      'primary-foreground':    { light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      secondary:               { light: 'oklch(0.97 0 0)',            dark: 'oklch(0.269 0 0)' },
      'secondary-foreground':  { light: 'oklch(0.205 0 0)',           dark: 'oklch(0.985 0 0)' },
      muted:                   { light: 'oklch(0.97 0 0)',            dark: 'oklch(0.269 0 0)' },
      'muted-foreground':      { light: 'oklch(0.556 0 0)',           dark: 'oklch(0.708 0 0)' },
      accent:                  { light: 'oklch(0.97 0 0)',            dark: 'oklch(0.269 0 0)' },
      'accent-foreground':     { light: 'oklch(0.205 0 0)',           dark: 'oklch(0.985 0 0)' },
      destructive:             { light: 'oklch(0.577 0.245 27.325)',  dark: 'oklch(0.704 0.191 22.216)' },
      'destructive-foreground':{ light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      border:                  { light: 'oklch(0.922 0 0)',           dark: 'oklch(1 0 0 / 10%)' },
      input:                   { light: 'oklch(0.922 0 0)',           dark: 'oklch(1 0 0 / 15%)' },
      ring:                    { light: 'oklch(0.708 0 0)',           dark: 'oklch(0.556 0 0)' },
    },
    radius: '0.625rem',
  },
  {
    name: 'Neutral',
    colors: {
      background:              { light: 'oklch(0.99 0.005 260)',      dark: 'oklch(0.155 0.01 260)' },
      foreground:              { light: 'oklch(0.17 0.015 260)',      dark: 'oklch(0.98 0.005 260)' },
      card:                    { light: 'oklch(0.99 0.005 260)',      dark: 'oklch(0.21 0.012 260)' },
      'card-foreground':       { light: 'oklch(0.17 0.015 260)',      dark: 'oklch(0.98 0.005 260)' },
      primary:                 { light: 'oklch(0.35 0.04 260)',       dark: 'oklch(0.65 0.06 260)' },
      'primary-foreground':    { light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      secondary:               { light: 'oklch(0.95 0.008 260)',      dark: 'oklch(0.28 0.015 260)' },
      'secondary-foreground':  { light: 'oklch(0.25 0.02 260)',       dark: 'oklch(0.95 0.005 260)' },
      muted:                   { light: 'oklch(0.95 0.008 260)',      dark: 'oklch(0.28 0.015 260)' },
      'muted-foreground':      { light: 'oklch(0.55 0.02 260)',       dark: 'oklch(0.7 0.02 260)' },
      accent:                  { light: 'oklch(0.94 0.01 260)',       dark: 'oklch(0.3 0.02 260)' },
      'accent-foreground':     { light: 'oklch(0.22 0.02 260)',       dark: 'oklch(0.95 0.005 260)' },
      destructive:             { light: 'oklch(0.577 0.245 27.325)',  dark: 'oklch(0.704 0.191 22.216)' },
      'destructive-foreground':{ light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      border:                  { light: 'oklch(0.91 0.01 260)',       dark: 'oklch(1 0 0 / 12%)' },
      input:                   { light: 'oklch(0.91 0.01 260)',       dark: 'oklch(1 0 0 / 15%)' },
      ring:                    { light: 'oklch(0.55 0.04 260)',       dark: 'oklch(0.65 0.06 260)' },
    },
    radius: '0.5rem',
  },
  {
    name: 'Warm',
    colors: {
      background:              { light: 'oklch(0.99 0.008 70)',       dark: 'oklch(0.16 0.015 60)' },
      foreground:              { light: 'oklch(0.18 0.02 60)',        dark: 'oklch(0.97 0.008 70)' },
      card:                    { light: 'oklch(0.99 0.008 70)',       dark: 'oklch(0.22 0.018 60)' },
      'card-foreground':       { light: 'oklch(0.18 0.02 60)',        dark: 'oklch(0.97 0.008 70)' },
      primary:                 { light: 'oklch(0.55 0.15 55)',        dark: 'oklch(0.7 0.14 60)' },
      'primary-foreground':    { light: 'oklch(0.985 0 0)',           dark: 'oklch(0.15 0.02 60)' },
      secondary:               { light: 'oklch(0.95 0.012 70)',       dark: 'oklch(0.29 0.02 60)' },
      'secondary-foreground':  { light: 'oklch(0.25 0.025 60)',       dark: 'oklch(0.95 0.008 70)' },
      muted:                   { light: 'oklch(0.95 0.012 70)',       dark: 'oklch(0.29 0.02 60)' },
      'muted-foreground':      { light: 'oklch(0.55 0.03 60)',        dark: 'oklch(0.7 0.03 70)' },
      accent:                  { light: 'oklch(0.94 0.02 75)',        dark: 'oklch(0.32 0.03 60)' },
      'accent-foreground':     { light: 'oklch(0.22 0.025 60)',       dark: 'oklch(0.95 0.008 70)' },
      destructive:             { light: 'oklch(0.577 0.245 27.325)',  dark: 'oklch(0.704 0.191 22.216)' },
      'destructive-foreground':{ light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      border:                  { light: 'oklch(0.91 0.015 70)',       dark: 'oklch(1 0 0 / 12%)' },
      input:                   { light: 'oklch(0.91 0.015 70)',       dark: 'oklch(1 0 0 / 15%)' },
      ring:                    { light: 'oklch(0.55 0.15 55)',        dark: 'oklch(0.7 0.14 60)' },
    },
    radius: '0.75rem',
  },
  {
    name: 'Ocean',
    colors: {
      background:              { light: 'oklch(0.99 0.006 240)',      dark: 'oklch(0.15 0.02 240)' },
      foreground:              { light: 'oklch(0.16 0.025 240)',      dark: 'oklch(0.97 0.006 240)' },
      card:                    { light: 'oklch(0.99 0.006 240)',      dark: 'oklch(0.21 0.022 240)' },
      'card-foreground':       { light: 'oklch(0.16 0.025 240)',      dark: 'oklch(0.97 0.006 240)' },
      primary:                 { light: 'oklch(0.5 0.18 240)',        dark: 'oklch(0.65 0.16 235)' },
      'primary-foreground':    { light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      secondary:               { light: 'oklch(0.95 0.01 235)',       dark: 'oklch(0.28 0.025 240)' },
      'secondary-foreground':  { light: 'oklch(0.23 0.03 240)',       dark: 'oklch(0.95 0.006 240)' },
      muted:                   { light: 'oklch(0.95 0.01 235)',       dark: 'oklch(0.28 0.025 240)' },
      'muted-foreground':      { light: 'oklch(0.55 0.03 240)',       dark: 'oklch(0.7 0.025 235)' },
      accent:                  { light: 'oklch(0.93 0.015 230)',      dark: 'oklch(0.3 0.03 240)' },
      'accent-foreground':     { light: 'oklch(0.2 0.03 240)',        dark: 'oklch(0.95 0.006 240)' },
      destructive:             { light: 'oklch(0.577 0.245 27.325)',  dark: 'oklch(0.704 0.191 22.216)' },
      'destructive-foreground':{ light: 'oklch(0.985 0 0)',           dark: 'oklch(0.985 0 0)' },
      border:                  { light: 'oklch(0.91 0.012 235)',      dark: 'oklch(1 0 0 / 12%)' },
      input:                   { light: 'oklch(0.91 0.012 235)',      dark: 'oklch(1 0 0 / 15%)' },
      ring:                    { light: 'oklch(0.5 0.18 240)',        dark: 'oklch(0.65 0.16 235)' },
    },
    radius: '0.375rem',
  },
]

// ─── Inline SVG icons ───────────────────────────────────────

function IconZoomIn() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}
function IconZoomOut() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}
function IconFitView() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconCopy() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
function IconCheck({ className, size }: { className?: string; size?: number }) {
  const s = size || 12
  return (
    <svg className={className || ''} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Token Panel (floating) ─────────────────────────────────

function ColorSwatch({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="w-3.5 h-3.5 rounded-sm border border-border" style={{ backgroundColor: `var(--${name})` }} />
      <span className="text-[11px] font-mono text-foreground">--{name}</span>
    </div>
  )
}

function TokenPanel() {
  return (
    <div className="w-60 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-1.5">
          <IconSettings />
          <span className="text-xs font-medium text-foreground">Tokens</span>
        </div>
      </div>

      <div className="p-3 space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {/* Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Preset</span>
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((preset, i) => (
              <button
                className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                  i === 0
                    ? 'border-ring bg-accent text-accent-foreground font-medium'
                    : 'border-border text-muted-foreground hover:border-ring'
                }`}
                data-studio-preset={preset.name}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Colors</span>
          <ColorSwatch name="primary" />
          <ColorSwatch name="secondary" />
          <ColorSwatch name="accent" />
          <ColorSwatch name="destructive" />
          <ColorSwatch name="background" />
          <ColorSwatch name="foreground" />
          <ColorSwatch name="muted" />
          <ColorSwatch name="border" />
        </div>

        {/* Radius */}
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Radius</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-foreground bg-muted" style={{ borderRadius: 'var(--radius)' }} />
            <span className="text-[11px] font-mono text-muted-foreground" data-studio-radius-label>0.625rem</span>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Font</span>
          <div className="text-[11px] font-mono text-muted-foreground">system-ui, sans-serif</div>
        </div>
      </div>
    </div>
  )
}

// ─── Component Preview Item ─────────────────────────────────

function PreviewItem({ name, children }: { name: string; children: any }) {
  return (
    <div className="group rounded-md px-2 pt-1 pb-2 min-w-0 overflow-hidden hover:bg-muted/50 transition-colors">
      {/* Label — clickable to open detail */}
      <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1 truncate block text-left" data-studio-detail={name}>
        {name}
      </button>
      {/* Preview */}
      <div className="flex items-center justify-center min-h-8">
        {children}
      </div>
    </div>
  )
}

// ─── Component Detail Panel (slide-in) ──────────────────────

function DetailPanel() {
  return (
    <div className="fixed top-14 right-0 bottom-0 w-96 bg-card border-l border-border shadow-xl z-30 hidden" data-studio-detail-panel>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground" data-studio-detail-title>Button</h2>
        <button className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-studio-detail-close title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Content — static mock showing patterns */}
      <div className="p-4 overflow-y-auto h-full space-y-4" data-studio-detail-content>
        {/* Patterns mock for Button */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Patterns</h3>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="text-xs font-medium text-foreground">Default</div>
            <div className="flex gap-1.5">
              <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">Primary</button>
              <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium">Outline</button>
              <button className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium">Secondary</button>
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="text-xs font-medium text-foreground">Sizes</div>
            <div className="flex items-end gap-1.5">
              <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-2 py-1 text-[10px] font-medium">Small</button>
              <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">Default</button>
              <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Large</button>
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="text-xs font-medium text-foreground">With Icon</div>
            <div className="flex gap-1.5">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                Continue
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-input bg-background p-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="text-xs font-medium text-foreground">Loading</div>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium opacity-70" disabled>
              <div className="h-3 w-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Please wait
            </button>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <div className="text-xs font-medium text-foreground">Destructive</div>
            <button className="inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium">Delete</button>
          </div>
        </div>

        {/* Link to full docs */}
        <a href="/components/button" target="_blank" rel="noopener" className="text-[11px] text-muted-foreground hover:text-foreground no-underline hover:underline transition-colors">
          View full documentation &rarr;
        </a>
      </div>
    </div>
  )
}

// ─── Component Group Island ─────────────────────────────────

function GroupIsland({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-3">
      <h2 className="text-xs font-semibold text-foreground mb-2">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {children}
      </div>
    </div>
  )
}

// ─── Canvas content ─────────────────────────────────────────

function CanvasContent() {
  return (
    <div className="space-y-4 p-4 lg:pl-68">
      {/* Input & Form Controls */}
      <GroupIsland title="Input & Form Controls">
        <PreviewItem name="Button">
          <div className="flex gap-1">
            <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-2 py-1 text-[11px] font-medium">Primary</button>
            <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium">Outline</button>
            <button className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground px-2 py-1 text-[11px] font-medium">Secondary</button>
          </div>
        </PreviewItem>

        <PreviewItem name="Input">
          <input type="text" placeholder="name@example.com" className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px]" />
        </PreviewItem>

        <PreviewItem name="Textarea">
          <textarea placeholder="Write a message..." className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] h-10 resize-none" />
        </PreviewItem>

        <PreviewItem name="Checkbox">
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm border border-primary bg-primary flex items-center justify-center">
              <IconCheck size={10} className="text-primary-foreground" />
            </div>
            <span className="text-[11px] text-foreground">Accept terms</span>
          </div>
        </PreviewItem>

        <PreviewItem name="Switch">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-7 rounded-full bg-primary p-0.5">
              <div className="h-3 w-3 rounded-full bg-primary-foreground translate-x-3" />
            </div>
            <span className="text-[11px] text-foreground">Active</span>
          </div>
        </PreviewItem>

        <PreviewItem name="Select">
          <div className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Select...</span>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </PreviewItem>

        <PreviewItem name="Radio Group">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-primary flex items-center justify-center"><div className="h-1 w-1 rounded-full bg-primary" /></div>
              <span className="text-[11px] text-foreground">Option A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-input" />
              <span className="text-[11px] text-foreground">Option B</span>
            </div>
          </div>
        </PreviewItem>

        <PreviewItem name="Slider">
          <div className="w-full h-1 bg-muted rounded-full relative">
            <div className="h-full bg-primary rounded-full" style={{ width: '40%' }} />
            <div className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-primary bg-background" style={{ left: '40%', transform: 'translate(-50%, -50%)' }} />
          </div>
        </PreviewItem>

        <PreviewItem name="Toggle">
          <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
          </button>
        </PreviewItem>

        <PreviewItem name="Label">
          <span className="text-[11px] font-medium text-foreground">Email address</span>
        </PreviewItem>

        <PreviewItem name="Calendar">
          <div className="text-[11px] text-muted-foreground">March 2026</div>
        </PreviewItem>

        <PreviewItem name="Date Picker">
          <div className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground">
            Pick a date
          </div>
        </PreviewItem>

        <PreviewItem name="Combobox">
          <div className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground">
            Search...
          </div>
        </PreviewItem>

        <PreviewItem name="Input OTP">
          <div className="flex gap-1">
            <div className="w-6 h-7 rounded border border-input bg-background flex items-center justify-center text-[11px] font-mono">1</div>
            <div className="w-6 h-7 rounded border border-input bg-background flex items-center justify-center text-[11px] font-mono">2</div>
            <div className="w-6 h-7 rounded border border-input bg-background flex items-center justify-center text-[11px] font-mono text-muted-foreground">_</div>
            <div className="w-6 h-7 rounded border border-input bg-background" />
          </div>
        </PreviewItem>

        <PreviewItem name="Toggle Group">
          <div className="flex">
            <button className="rounded-l-md border border-input bg-muted px-2 py-1 text-[11px]">B</button>
            <button className="border-y border-input px-2 py-1 text-[11px]">I</button>
            <button className="rounded-r-md border border-input px-2 py-1 text-[11px]">U</button>
          </div>
        </PreviewItem>
      </GroupIsland>

      {/* Display & Data */}
      <GroupIsland title="Display & Data">
        <PreviewItem name="Card">
          <div className="w-full rounded border border-border p-2 space-y-0.5">
            <div className="text-[11px] font-semibold text-card-foreground">Settings</div>
            <div className="text-[10px] text-muted-foreground">Manage preferences.</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Badge">
          <div className="flex gap-1">
            <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-semibold">Default</span>
            <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-1.5 py-0.5 text-[9px] font-semibold">Secondary</span>
            <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold">Outline</span>
          </div>
        </PreviewItem>

        <PreviewItem name="Avatar">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">AB</div>
        </PreviewItem>

        <PreviewItem name="Table">
          <div className="w-full text-[10px]">
            <div className="flex border-b border-border py-0.5 font-medium text-muted-foreground"><span className="flex-1">Name</span><span className="w-12 text-right">Status</span></div>
            <div className="flex py-0.5 text-foreground"><span className="flex-1">Proj A</span><span className="w-12 text-right">Active</span></div>
            <div className="flex py-0.5 text-foreground"><span className="flex-1">Proj B</span><span className="w-12 text-right">Draft</span></div>
          </div>
        </PreviewItem>

        <PreviewItem name="Separator">
          <div className="w-full space-y-1.5">
            <div className="text-[10px] text-muted-foreground">Section A</div>
            <div className="h-px bg-border w-full" />
            <div className="text-[10px] text-muted-foreground">Section B</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Aspect Ratio">
          <div className="w-14 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">16:9</div>
        </PreviewItem>

        <PreviewItem name="Data Table">
          <div className="text-[10px] text-muted-foreground italic">Sortable table</div>
        </PreviewItem>

        <PreviewItem name="Carousel">
          <div className="text-[10px] text-muted-foreground italic">Content slider</div>
        </PreviewItem>

        <PreviewItem name="Skeleton">
          <div className="w-full space-y-1">
            <div className="h-2 bg-muted rounded w-full animate-pulse" />
            <div className="h-2 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </PreviewItem>
      </GroupIsland>

      {/* Feedback */}
      <GroupIsland title="Feedback">
        <PreviewItem name="Alert">
          <div className="w-full rounded border border-border p-2">
            <div className="text-[11px] font-medium text-foreground">Heads up!</div>
            <div className="text-[10px] text-muted-foreground">Something to know.</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Alert Dialog">
          <div className="text-[10px] text-muted-foreground italic">Confirmation modal</div>
        </PreviewItem>

        <PreviewItem name="Dialog">
          <div className="text-[10px] text-muted-foreground italic">Modal overlay</div>
        </PreviewItem>

        <PreviewItem name="Toast">
          <div className="w-full rounded border border-border bg-background p-2 shadow-sm">
            <div className="text-[11px] font-medium text-foreground">Saved</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Progress">
          <div className="w-full h-1 bg-muted rounded-full">
            <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
          </div>
        </PreviewItem>

        <PreviewItem name="Spinner">
          <div className="h-4 w-4 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </PreviewItem>
      </GroupIsland>

      {/* Navigation */}
      <GroupIsland title="Navigation">
        <PreviewItem name="Tabs">
          <div className="w-full">
            <div className="flex border-b border-border">
              <div className="px-2 py-1 text-[11px] font-medium border-b-2 border-primary text-foreground">Account</div>
              <div className="px-2 py-1 text-[11px] text-muted-foreground">Password</div>
            </div>
          </div>
        </PreviewItem>

        <PreviewItem name="Breadcrumb">
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-muted-foreground">Home</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Button</span>
          </div>
        </PreviewItem>

        <PreviewItem name="Dropdown Menu">
          <div className="text-[10px] text-muted-foreground italic">Action menu</div>
        </PreviewItem>

        <PreviewItem name="Context Menu">
          <div className="text-[10px] text-muted-foreground italic">Right-click menu</div>
        </PreviewItem>

        <PreviewItem name="Command">
          <div className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground">
            Search...
          </div>
        </PreviewItem>

        <PreviewItem name="Pagination">
          <div className="flex items-center gap-0.5">
            <div className="px-1.5 py-0.5 text-[10px] rounded border border-input text-muted-foreground">&lt;</div>
            <div className="px-1.5 py-0.5 text-[10px] rounded bg-primary text-primary-foreground">1</div>
            <div className="px-1.5 py-0.5 text-[10px] rounded border border-input text-muted-foreground">2</div>
            <div className="px-1.5 py-0.5 text-[10px] rounded border border-input text-muted-foreground">3</div>
            <div className="px-1.5 py-0.5 text-[10px] rounded border border-input text-muted-foreground">&gt;</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Menubar">
          <div className="flex gap-1 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">File</span>
            <span className="px-1.5 py-0.5 text-muted-foreground">Edit</span>
            <span className="px-1.5 py-0.5 text-muted-foreground">View</span>
          </div>
        </PreviewItem>

        <PreviewItem name="Navigation Menu">
          <div className="text-[10px] text-muted-foreground italic">Hover nav</div>
        </PreviewItem>
      </GroupIsland>

      {/* Layout & Overlay */}
      <GroupIsland title="Layout & Overlay">
        <PreviewItem name="Accordion">
          <div className="w-full">
            <div className="flex items-center justify-between py-1 text-[11px] font-medium text-foreground border-b border-border">
              <span>Is it accessible?</span>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div className="text-[10px] text-muted-foreground py-1">Yes, WAI-ARIA.</div>
          </div>
        </PreviewItem>

        <PreviewItem name="Collapsible">
          <div className="text-[10px] text-muted-foreground italic">Expandable</div>
        </PreviewItem>

        <PreviewItem name="Sheet">
          <div className="text-[10px] text-muted-foreground italic">Side panel</div>
        </PreviewItem>

        <PreviewItem name="Drawer">
          <div className="text-[10px] text-muted-foreground italic">Slide-out</div>
        </PreviewItem>

        <PreviewItem name="Popover">
          <div className="text-[10px] text-muted-foreground italic">Floating</div>
        </PreviewItem>

        <PreviewItem name="Tooltip">
          <div className="px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">Tooltip</div>
        </PreviewItem>

        <PreviewItem name="Hover Card">
          <div className="text-[10px] text-muted-foreground italic">Preview</div>
        </PreviewItem>

        <PreviewItem name="Scroll Area">
          <div className="text-[10px] text-muted-foreground italic">Scrollbar</div>
        </PreviewItem>

        <PreviewItem name="Resizable">
          <div className="text-[10px] text-muted-foreground italic">Resize</div>
        </PreviewItem>

        <PreviewItem name="Portal">
          <div className="text-[10px] text-muted-foreground italic">Outside DOM</div>
        </PreviewItem>
      </GroupIsland>
    </div>
  )
}

// ─── Zoom Controls ──────────────────────────────────────────

function ZoomControls() {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card shadow-md p-1">
      <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-studio-zoom="out" title="Zoom out">
        <IconZoomOut />
      </button>
      <span className="px-2 text-xs font-mono text-muted-foreground min-w-10 text-center" data-studio-zoom-label>100%</span>
      <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-studio-zoom="in" title="Zoom in">
        <IconZoomIn />
      </button>
      <div className="w-px h-4 bg-border mx-0.5" />
      <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-studio-zoom="fit" title="Fit to view">
        <IconFitView />
      </button>
    </div>
  )
}

// ─── Export Bar (fixed bottom) ──────────────────────────────

function ExportBar() {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 bg-card border-t border-border">
      <code className="rounded-md bg-muted border border-border px-3 py-1.5 font-mono text-[11px] text-foreground max-w-xl truncate">
        barefoot init --from "https://ui.barefootjs.dev/studio?c=eJx..."
      </code>
      <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0">
        <IconCopy />
        Copy
      </button>
    </div>
  )
}

// ─── Detail Panel Script ────────────────────────────────────

const detailScript = `
(function() {
  var panel = document.querySelector('[data-studio-detail-panel]');
  var titleEl = document.querySelector('[data-studio-detail-title]');
  var closeBtn = document.querySelector('[data-studio-detail-close]');

  // Open detail panel
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-studio-detail]');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    var name = trigger.getAttribute('data-studio-detail');
    titleEl.textContent = name;
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
  });

  // Close
  closeBtn.addEventListener('click', function() {
    panel.style.display = 'none';
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && panel.style.display !== 'none') {
      panel.style.display = 'none';
    }
  });
})();
`

// ─── Zoom Script ────────────────────────────────────────────

const zoomScript = `
(function() {
  var scale = 1;
  var panX = 0;
  var panY = 0;
  var MIN_SCALE = 0.25;
  var MAX_SCALE = 2;
  var steps = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
  var canvas = document.querySelector('[data-studio-canvas]');
  var viewport = document.querySelector('[data-studio-viewport]');
  var label = document.querySelector('[data-studio-zoom-label]');

  function applyTransform(animate) {
    canvas.style.transition = animate ? 'transform 0.2s ease' : 'none';
    canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
    canvas.style.transformOrigin = 'top center';
    label.textContent = Math.round(scale * 100) + '%';
  }

  function snapToStep(s) {
    return steps.reduce(function(prev, curr) {
      return Math.abs(curr - s) < Math.abs(prev - s) ? curr : prev;
    });
  }

  function stepZoom(direction) {
    var snapped = snapToStep(scale);
    var idx = steps.indexOf(snapped);
    if (direction > 0 && idx < steps.length - 1) scale = steps[idx + 1];
    else if (direction < 0 && idx > 0) scale = steps[idx - 1];
    applyTransform(true);
  }

  // Button zoom
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-studio-zoom]');
    if (!btn) return;
    var action = btn.getAttribute('data-studio-zoom');
    if (action === 'in') stepZoom(1);
    else if (action === 'out') stepZoom(-1);
    else if (action === 'fit') { scale = 1; panX = 0; panY = 0; applyTransform(true); }
  });

  // Cmd/Ctrl + wheel zoom — accumulate delta, trigger on threshold
  var wheelAccum = 0;
  var WHEEL_THRESHOLD = 40;
  var wheelTimer = null;
  viewport.addEventListener('wheel', function(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    wheelAccum += e.deltaY;
    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
      stepZoom(wheelAccum < 0 ? 1 : -1);
      wheelAccum = 0;
    }
    // Reset accumulator after idle
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function() { wheelAccum = 0; }, 300);
  }, { passive: false });

  // Click-drag panning
  var isPanning = false;
  var startX = 0;
  var startY = 0;
  var startPanX = 0;
  var startPanY = 0;

  viewport.addEventListener('mousedown', function(e) {
    // Don't pan when clicking on interactive elements
    if (e.target.closest('button, input, textarea, select, a, label, [data-studio-zoom]')) return;
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isPanning) return;
    panX = startPanX + (e.clientX - startX);
    panY = startPanY + (e.clientY - startY);
    applyTransform(false);
  });

  document.addEventListener('mouseup', function() {
    if (!isPanning) return;
    isPanning = false;
    viewport.style.cursor = '';
  });

  // Set default cursor on viewport
  viewport.style.cursor = 'grab';
})();
`

// ─── Preset Script ──────────────────────────────────────────

// Serialize preset data for the client script
const presetsJson = JSON.stringify(
  presets.map(p => ({ name: p.name, colors: p.colors, radius: p.radius }))
)

const presetScript = `
(function() {
  var presets = ${presetsJson};
  var activePreset = 'Default';

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function applyPreset(name, animate) {
    var preset = presets.find(function(p) { return p.name === name; });
    if (!preset) return;

    activePreset = name;
    var root = document.documentElement;
    var mode = isDark() ? 'dark' : 'light';

    if (name === 'Default') {
      // Remove overrides to restore stylesheet values
      var allTokens = Object.keys(presets[0].colors);
      allTokens.forEach(function(token) {
        root.style.removeProperty('--' + token);
      });
      root.style.removeProperty('--radius');
    } else {
      Object.keys(preset.colors).forEach(function(token) {
        root.style.setProperty('--' + token, preset.colors[token][mode]);
      });
      root.style.setProperty('--radius', preset.radius);
    }

    // Update radius label
    var radiusLabel = document.querySelector('[data-studio-radius-label]');
    if (radiusLabel) radiusLabel.textContent = preset.radius;

    // Update active button styles
    var buttons = document.querySelectorAll('[data-studio-preset]');
    buttons.forEach(function(btn) {
      var isActive = btn.getAttribute('data-studio-preset') === name;
      if (isActive) {
        btn.className = btn.className
          .replace('border-border text-muted-foreground hover:border-ring', '')
          .replace('border-ring bg-accent text-accent-foreground font-medium', '')
          .trim() + ' border-ring bg-accent text-accent-foreground font-medium';
      } else {
        btn.className = btn.className
          .replace('border-ring bg-accent text-accent-foreground font-medium', '')
          .replace('border-border text-muted-foreground hover:border-ring', '')
          .trim() + ' border-border text-muted-foreground hover:border-ring';
      }
    });
  }

  // Click handler for preset buttons
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-studio-preset]');
    if (!btn) return;
    var name = btn.getAttribute('data-studio-preset');
    applyPreset(name, true);
  });

  // Re-apply on dark mode toggle (MutationObserver)
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && activePreset !== 'Default') {
        applyPreset(activePreset, false);
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
`

// ─── Page Root ──────────────────────────────────────────────

export function StudioPage() {
  return (
    <div className="studio-canvas" style={{ margin: '-5rem -0.3rem 0', paddingTop: '3.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Viewport — scrollable, full width */}
      <div className="relative flex-1 overflow-auto" data-studio-viewport>
        {/* Floating Token Panel — top left */}
        <div className="fixed top-16 left-4 z-10 hidden lg:block">
          <TokenPanel />
        </div>

        {/* Zoom Controls — top right */}
        <div className="fixed top-16 right-4 z-10">
          <ZoomControls />
        </div>

        {/* Component Canvas — zoomable */}
        <div className="relative z-0" data-studio-canvas>
          <CanvasContent />
        </div>
      </div>

      {/* Detail panel — right side slide-in */}
      <DetailPanel />

      {/* Export bar — fixed at bottom */}
      <div className="sticky bottom-0 z-20">
        <ExportBar />
      </div>

      {/* Behavior scripts */}
      <script dangerouslySetInnerHTML={{ __html: zoomScript }} />
      <script dangerouslySetInnerHTML={{ __html: detailScript }} />
      <script dangerouslySetInnerHTML={{ __html: presetScript }} />
    </div>
  )
}
