/**
 * Shared Documentation Components (Dark Mode)
 *
 * Reusable components for documentation pages.
 */

// Page header with title and description
export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight text-zinc-50">{title}</h1>
      <p class="text-zinc-400 text-lg">{description}</p>
    </div>
  )
}

// Preview component wrapper
export function Preview({ children }: { children: any }) {
  return (
    <div class="flex flex-wrap items-center gap-4 p-6 border border-zinc-800 rounded-lg bg-zinc-900">
      {children}
    </div>
  )
}

// Code block component
export function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  return (
    <div class="relative">
      <pre class="p-4 bg-zinc-950 text-zinc-300 rounded-lg overflow-x-auto text-sm font-mono border border-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Section component
export function Section({ id, title, children }: { id?: string; title: string; children: any }) {
  return (
    <section id={id} class="space-y-4">
      <h2 class="text-xl font-semibold tracking-tight text-zinc-50">{title}</h2>
      {children}
    </section>
  )
}

// Subsection component
export function Subsection({ title, children }: { title: string; children: any }) {
  return (
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-zinc-100">{title}</h3>
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
    <tr class="border-b border-zinc-800 last:border-b-0">
      <td class="py-3 px-4 font-mono text-sm text-zinc-100">{name}</td>
      <td class="py-3 px-4 font-mono text-sm text-zinc-400">{type}</td>
      <td class="py-3 px-4 font-mono text-sm text-zinc-400">{defaultValue || '-'}</td>
      <td class="py-3 px-4 text-sm text-zinc-300">{description}</td>
    </tr>
  )
}

// Props table component
export function PropsTable({ props }: { props: PropDefinition[] }) {
  return (
    <div class="border border-zinc-800 rounded-lg overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-zinc-900">
          <tr class="border-b border-zinc-800">
            <th class="py-3 px-4 text-sm font-medium text-zinc-100">Prop</th>
            <th class="py-3 px-4 text-sm font-medium text-zinc-100">Type</th>
            <th class="py-3 px-4 text-sm font-medium text-zinc-100">Default</th>
            <th class="py-3 px-4 text-sm font-medium text-zinc-100">Description</th>
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
      {title && <h3 class="text-lg font-medium text-zinc-100">{title}</h3>}
      <Preview>{children}</Preview>
      <CodeBlock code={code} />
    </div>
  )
}
