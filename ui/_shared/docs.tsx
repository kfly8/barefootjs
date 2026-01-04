/**
 * Shared Documentation Components (Dark Mode)
 *
 * Reusable components for documentation pages.
 * Uses CSS variables for theming support.
 */

// Page header with title and description
export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p class="text-muted-foreground text-lg">{description}</p>
    </div>
  )
}

// Preview component wrapper
export function Preview({ children }: { children: any }) {
  return (
    <div class="flex flex-wrap items-center gap-4 p-6 border border-border rounded-lg bg-card">
      {children}
    </div>
  )
}

// Code block component
export function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  return (
    <div class="relative">
      <pre class="p-4 bg-muted text-muted-foreground rounded-lg overflow-x-auto text-sm font-mono border border-border">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Section component
export function Section({ id, title, children }: { id?: string; title: string; children: any }) {
  return (
    <section id={id} class="space-y-4">
      <h2 class="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  )
}

// Subsection component
export function Subsection({ title, children }: { title: string; children: any }) {
  return (
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-foreground">{title}</h3>
      {children}
    </div>
  )
}

// Props table types
export interface PropDefinition {
  name: string
  type: string
  defaultValue?: string
  description: string
}

// Props table row
function PropRow({ name, type, defaultValue, description }: PropDefinition) {
  return (
    <tr class="border-b border-border last:border-b-0">
      <td class="py-3 px-4 font-mono text-sm text-foreground">{name}</td>
      <td class="py-3 px-4 font-mono text-sm text-muted-foreground">{type}</td>
      <td class="py-3 px-4 font-mono text-sm text-muted-foreground">{defaultValue || '-'}</td>
      <td class="py-3 px-4 text-sm text-muted-foreground">{description}</td>
    </tr>
  )
}

// Props table component
export function PropsTable({ props }: { props: PropDefinition[] }) {
  return (
    <div class="border border-border rounded-lg overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-muted">
          <tr class="border-b border-border">
            <th class="py-3 px-4 text-sm font-medium text-foreground">Prop</th>
            <th class="py-3 px-4 text-sm font-medium text-foreground">Type</th>
            <th class="py-3 px-4 text-sm font-medium text-foreground">Default</th>
            <th class="py-3 px-4 text-sm font-medium text-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map(prop => (
            <PropRow key={prop.name} {...prop} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Example component with preview and code
export function Example({ title, code, children }: { title?: string; code: string; children: any }) {
  return (
    <div class="space-y-4">
      {title && <h3 class="text-lg font-medium text-foreground">{title}</h3>}
      <Preview>{children}</Preview>
      <CodeBlock code={code} />
    </div>
  )
}
