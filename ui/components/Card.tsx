/**
 * Card Component
 *
 * A flexible container component inspired by shadcn/ui.
 * Supports composable sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
 * Uses CSS variables for theming support.
 */

import type { Child } from '../types'

export interface CardProps {
  children?: Child
  class?: string
}

export function Card({ children, class: className = '' }: CardProps) {
  return (
    <div class={`rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  children?: Child
  class?: string
}

export function CardHeader({ children, class: className = '' }: CardHeaderProps) {
  return (
    <div class={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  )
}

export interface CardTitleProps {
  children?: Child
  class?: string
}

export function CardTitle({ children, class: className = '' }: CardTitleProps) {
  return (
    <h3 class={`font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  )
}

export interface CardDescriptionProps {
  children?: Child
  class?: string
}

export function CardDescription({ children, class: className = '' }: CardDescriptionProps) {
  return (
    <p class={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  )
}

export interface CardContentProps {
  children?: Child
  class?: string
}

export function CardContent({ children, class: className = '' }: CardContentProps) {
  return (
    <div class={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

export interface CardFooterProps {
  children?: Child
  class?: string
}

export function CardFooter({ children, class: className = '' }: CardFooterProps) {
  return (
    <div class={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}
