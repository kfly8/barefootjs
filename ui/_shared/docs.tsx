/**
 * Shared Documentation Components (Dark Mode)
 *
 * Reusable components for documentation pages.
 * Uses CSS variables for theming support.
 */

import { TableOfContents, type TocItem } from '@/components/docs/table-of-contents'
import { CopyButton } from '@/components/docs/copy-button'
// Re-export PackageManagerTabs from compiled component
export { PackageManagerTabs } from '@/components/docs/package-manager-tabs'
import { PageNavigation, getNavLinks } from './PageNavigation'
import { highlight } from './highlighter'

// Re-export TocItem for convenience
export type { TocItem }

// Type for pre-highlighted commands (matches PackageManagerTabs prop)
export interface HighlightedCommands {
  pnpm: string
  npm: string
  yarn: string
  bun: string
}

/**
 * Generate pre-highlighted HTML for package manager commands.
 * Use this on server-side pages to pass to PackageManagerTabs.
 */
export function getHighlightedCommands(command: string): HighlightedCommands {
  return {
    pnpm: highlight(`pnpm dlx ${command}`, 'bash'),
    npm: highlight(`npx ${command}`, 'bash'),
    yarn: highlight(`npx ${command}`, 'bash'),
    bun: highlight(`bunx --bun ${command}`, 'bash'),
  }
}

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

// Code block component with syntax highlighting, line numbers, and copy button
export function CodeBlock({
  code,
  lang = 'tsx',
  showLineNumbers = true,
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
      <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
        <code class="block">
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
      <CopyButton code={code} />
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

// Convert title to kebab-case id
function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-')
}

// Example component with preview and code in a unified container
export function Example({ title, code, children }: { title?: string; code: string; children: any }) {
  // Highlight code and split into lines for line number display
  const highlightedCode = highlight(code, 'tsx')
  const lines = highlightedCode.split('\n')
  // Remove trailing empty line if present
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  const id = title ? toKebabCase(title) : undefined

  return (
    <div class="space-y-4">
      {title && <h3 id={id} class="text-lg font-medium text-foreground scroll-mt-20">{title}</h3>}
      <div class="border border-solid border-border rounded-lg overflow-hidden">
        {/* Preview section */}
        <div class="flex flex-wrap items-center justify-center gap-4 px-8 py-32 bg-card relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
          <div class="relative z-10 flex flex-wrap items-center justify-center gap-4">
            {children}
          </div>
        </div>
        {/* Code section with line numbers */}
        <div class="relative group">
          <pre class="m-0 p-4 pr-12 bg-muted overflow-x-auto text-sm font-mono">
            <code class="block">
              {lines.map((line, i) => (
                <span key={i} class="table-row">
                  <span class="table-cell pr-4 text-right select-none text-muted-foreground/50 w-8">
                    {i + 1}
                  </span>
                  <span class="table-cell" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                </span>
              ))}
            </code>
          </pre>
          <CopyButton code={code} />
        </div>
      </div>
    </div>
  )
}

