"use client"

/**
 * Breadcrumb Components
 *
 * A composable breadcrumb navigation component.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>Current Page</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 *
 * @example With asChild link
 * ```tsx
 * <BreadcrumbLink asChild>
 *   <a href="/docs">Documentation</a>
 * </BreadcrumbLink>
 * ```
 */

import type { Child } from '../../types'
import { Slot } from './slot'
import { ChevronRightIcon, EllipsisIcon } from './icon'

// BreadcrumbList classes
const breadcrumbListClasses = 'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words'

// BreadcrumbItem classes
const breadcrumbItemClasses = 'inline-flex items-center gap-1'

// BreadcrumbLink classes
const breadcrumbLinkClasses = 'hover:text-foreground transition-colors'

// BreadcrumbPage classes
const breadcrumbPageClasses = 'text-foreground font-normal'

// BreadcrumbSeparator classes
const breadcrumbSeparatorClasses = '[&>svg]:size-3.5'

// BreadcrumbEllipsis classes
const breadcrumbEllipsisClasses = 'flex size-5 items-center justify-center [&>svg]:size-4'

/**
 * Props for Breadcrumb component.
 */
interface BreadcrumbProps {
  /** Breadcrumb content (typically BreadcrumbList) */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Breadcrumb navigation wrapper.
 */
function Breadcrumb({ children, className = '' }: BreadcrumbProps) {
  return (
    <nav data-slot="breadcrumb" aria-label="breadcrumb" className={className || undefined}>
      {children}
    </nav>
  )
}

/**
 * Props for BreadcrumbList component.
 */
interface BreadcrumbListProps {
  /** List items */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Ordered list wrapper for breadcrumb items.
 */
function BreadcrumbList({ children, className = '' }: BreadcrumbListProps) {
  return (
    <ol data-slot="breadcrumb-list" className={`${breadcrumbListClasses} ${className}`}>
      {children}
    </ol>
  )
}

/**
 * Props for BreadcrumbItem component.
 */
interface BreadcrumbItemProps {
  /** Item content */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Individual breadcrumb item.
 */
function BreadcrumbItem({ children, className = '' }: BreadcrumbItemProps) {
  return (
    <li data-slot="breadcrumb-item" className={`${breadcrumbItemClasses} ${className}`}>
      {children}
    </li>
  )
}

/**
 * Props for BreadcrumbLink component.
 */
interface BreadcrumbLinkProps {
  /** Link URL */
  href?: string
  /** When true, renders child element with link styling instead of `<a>`. */
  asChild?: boolean
  /** Link content */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Breadcrumb link element.
 */
function BreadcrumbLink({ className = '', asChild = false, children, ...props }: BreadcrumbLinkProps) {
  const classes = `${breadcrumbLinkClasses} ${className}`

  if (asChild) {
    return <Slot className={classes} {...props}>{children}</Slot>
  }
  return <a data-slot="breadcrumb-link" className={classes} {...props}>{children}</a>
}

/**
 * Props for BreadcrumbPage component.
 */
interface BreadcrumbPageProps {
  /** Page title */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Current page indicator in breadcrumb.
 */
function BreadcrumbPage({ children, className = '' }: BreadcrumbPageProps) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={`${breadcrumbPageClasses} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Props for BreadcrumbSeparator component.
 */
interface BreadcrumbSeparatorProps {
  /** Custom separator content. Defaults to ChevronRightIcon. */
  children?: Child
  /** Additional CSS classes */
  className?: string
}

/**
 * Separator between breadcrumb items.
 */
function BreadcrumbSeparator({ children, className = '' }: BreadcrumbSeparatorProps) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={`${breadcrumbSeparatorClasses} ${className}`}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

/**
 * Props for BreadcrumbEllipsis component.
 */
interface BreadcrumbEllipsisProps {
  /** Additional CSS classes */
  className?: string
}

/**
 * Ellipsis indicator for truncated breadcrumb paths.
 */
function BreadcrumbEllipsis({ className = '' }: BreadcrumbEllipsisProps) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={`${breadcrumbEllipsisClasses} ${className}`}
    >
      <EllipsisIcon />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
export type {
  BreadcrumbProps,
  BreadcrumbListProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbSeparatorProps,
  BreadcrumbEllipsisProps,
}
