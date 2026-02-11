/**
 * Shared PageNav Component
 *
 * Compact inline prev/next navigation links with chevron icons.
 * Server component — no "use client" directive.
 * Uses inline SVGs to avoid dependency on UI icon library.
 */

export interface PageNavLink {
  href: string
  title: string
}

export interface PageNavProps {
  prev?: PageNavLink
  next?: PageNavLink
}

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function PageNav({ prev, next }: PageNavProps) {
  if (!prev && !next) return null

  return (
    <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="Quick navigation">
      {prev ? (
        <a
          href={prev.href}
          className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors no-underline"
          title={`Previous: ${prev.title}`}
        >
          <ChevronLeft />
          <span className="max-w-24 truncate">{prev.title}</span>
        </a>
      ) : (
        <div className="w-20" />
      )}
      <span className="text-border">|</span>
      {next ? (
        <a
          href={next.href}
          className="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors no-underline"
          title={`Next: ${next.title}`}
        >
          <span className="max-w-24 truncate">{next.title}</span>
          <ChevronRight />
        </a>
      ) : (
        <div className="w-20" />
      )}
    </nav>
  )
}
