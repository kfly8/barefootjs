/**
 * Shared Documentation Components (Dark Mode)
 *
 * Reusable components for documentation pages.
 * Uses CSS variables for theming support.
 */

import { TableOfContents, type TocItem } from '@/components/TableOfContents'
import { PageNavigation, getNavLinks } from './PageNavigation'
import { highlight } from './highlighter'

// Re-export TocItem for convenience
export type { TocItem }

// Documentation page wrapper with TOC sidebar and footer navigation
export interface DocPageProps {
  slug: string
  toc: TocItem[]
  children: any
}

export function DocPage({ slug, toc, children }: DocPageProps) {
  const navLinks = getNavLinks(slug)

  return (
    <div class="flex gap-10">
      <div class="flex-1 min-w-0">
        {children}
        <PageNavigation {...navLinks} />
      </div>
      <TableOfContents items={toc} />
    </div>
  )
}

// Page header with title and description
export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tighter text-foreground">{title}</h1>
      <p class="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </div>
  )
}

// Preview component wrapper with subtle dot pattern background
export function Preview({ children }: { children: any }) {
  return (
    <div class="flex flex-wrap items-center justify-center gap-4 p-8 border border-border rounded-lg bg-card relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
      <div class="relative z-10 flex flex-wrap items-center justify-center gap-4">
        {children}
      </div>
    </div>
  )
}

// Copy button for code blocks (client-side component)
function CopyButton() {
  return (
    <button
      type="button"
      class="absolute top-2 right-2 p-2 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Copy code"
      data-copy-button
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="copy-icon"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="check-icon hidden"
      >
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    </button>
  )
}

// Code block component with syntax highlighting, line numbers, and copy button
export function CodeBlock({
  code,
  lang = 'tsx',
  showLineNumbers = false,
}: {
  code: string
  lang?: string
  showLineNumbers?: boolean
}) {
  const highlightedCode = highlight(code, lang)
  const lines = highlightedCode.split('\n')
  // Remove trailing empty line if present
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  return (
    <div class="relative group">
      <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono border border-border">
        <code data-code-content class="block">
          {showLineNumbers ? (
            lines.map((line, i) => (
              <span key={i} class="table-row">
                <span class="table-cell pr-4 text-right select-none text-muted-foreground/50 w-8">
                  {i + 1}
                </span>
                <span class="table-cell" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
              </span>
            ))
          ) : (
            <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </code>
      </pre>
      <CopyButton />
    </div>
  )
}

// Section component with scroll margin for anchor links
export function Section({ id, title, children }: { id?: string; title: string; children: any }) {
  return (
    <section id={id} class="space-y-4 scroll-mt-16">
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
