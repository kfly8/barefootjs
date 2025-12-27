/**
 * Card Component
 *
 * A flexible container component inspired by shadcn/ui.
 * Supports composable sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
 */

export interface CardProps {
  children?: any
  class?: string
}

export function Card({ children, class: className = '' }: CardProps) {
  return (
    <div class={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow ${className}`}>
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  children?: any
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
  children?: any
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
  children?: any
  class?: string
}

export function CardDescription({ children, class: className = '' }: CardDescriptionProps) {
  return (
    <p class={`text-sm text-zinc-500 ${className}`}>
      {children}
    </p>
  )
}

export interface CardContentProps {
  children?: any
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
  children?: any
  class?: string
}

export function CardFooter({ children, class: className = '' }: CardFooterProps) {
  return (
    <div class={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}
