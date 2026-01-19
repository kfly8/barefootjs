"use client"

/**
 * Card Components
 *
 * A flexible container component with composable sub-components.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic card with header and content
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here.</p>
 *   </CardContent>
 * </Card>
 * ```
 *
 * @example Card with footer
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Confirm Action</CardTitle>
 *   </CardHeader>
 *   <CardContent>Are you sure?</CardContent>
 *   <CardFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Confirm</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */

import type { Child } from '../../types'

// Card classes (has-data-[slot=card-image] removes top padding when image is present)
const cardClasses = 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm has-data-[slot=card-image]:pt-0 has-data-[slot=card-image]:overflow-hidden'

// CardImage classes
const cardImageClasses = 'w-full object-cover'

// CardHeader classes (Grid for CardAction support)
const cardHeaderClasses = '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6'

// CardTitle classes
const cardTitleClasses = 'font-semibold leading-none tracking-tight'

// CardDescription classes
const cardDescriptionClasses = 'text-sm text-muted-foreground'

// CardContent classes
const cardContentClasses = 'px-6'

// CardAction classes
const cardActionClasses = 'col-start-2 row-span-2 row-start-1 self-start justify-self-end'

// CardFooter classes
const cardFooterClasses = 'flex items-center px-6 [.border-t]:pt-6'

/**
 * Props for Card component.
 */
interface CardProps {
  /** Card content (typically CardHeader, CardContent, CardFooter) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card container component.
 *
 * @param props.children - Card sub-components
 * @param props.class - Additional CSS classes
 */
function Card({ children, class: className = '' }: CardProps) {
  return (
    <div data-slot="card" class={`${cardClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for CardHeader component.
 */
interface CardHeaderProps {
  /** Header content (typically CardTitle and CardDescription) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card header section.
 *
 * @param props.children - Header content
 */
function CardHeader({ children, class: className = '' }: CardHeaderProps) {
  return (
    <div data-slot="card-header" class={`${cardHeaderClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for CardTitle component.
 */
interface CardTitleProps {
  /** Title text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card title text.
 *
 * @param props.children - Title content
 */
function CardTitle({ children, class: className = '' }: CardTitleProps) {
  return (
    <h3 data-slot="card-title" class={`${cardTitleClasses} ${className}`}>
      {children}
    </h3>
  )
}

/**
 * Props for CardDescription component.
 */
interface CardDescriptionProps {
  /** Description text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card description text.
 *
 * @param props.children - Description content
 */
function CardDescription({ children, class: className = '' }: CardDescriptionProps) {
  return (
    <p data-slot="card-description" class={`${cardDescriptionClasses} ${className}`}>
      {children}
    </p>
  )
}

/**
 * Props for CardContent component.
 */
interface CardContentProps {
  /** Main content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card main content area.
 *
 * @param props.children - Main content
 */
function CardContent({ children, class: className = '' }: CardContentProps) {
  return (
    <div data-slot="card-content" class={`${cardContentClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for CardImage component.
 */
interface CardImageProps {
  /** Image source URL */
  src: string
  /** Alternative text for the image */
  alt: string
  /** Image width */
  width?: number
  /** Image height */
  height?: number
  /** Additional CSS classes */
  class?: string
}

/**
 * Card image displayed at the top of the card.
 *
 * @param props.src - Image source URL
 * @param props.alt - Alternative text
 * @param props.width - Image width
 * @param props.height - Image height
 */
function CardImage({
  src,
  alt,
  width,
  height,
  class: className = '',
}: CardImageProps) {
  return (
    <img
      data-slot="card-image"
      src={src}
      alt={alt}
      width={width}
      height={height}
      class={`${cardImageClasses} ${className}`}
    />
  )
}

/**
 * Props for CardAction component.
 */
interface CardActionProps {
  /** Action content (typically buttons) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card action button area in the header.
 *
 * @param props.children - Action content
 */
function CardAction({ children, class: className = '' }: CardActionProps) {
  return (
    <div data-slot="card-action" class={`${cardActionClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for CardFooter component.
 */
interface CardFooterProps {
  /** Footer content (typically action buttons) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Card footer section.
 *
 * @param props.children - Footer content
 */
function CardFooter({ children, class: className = '' }: CardFooterProps) {
  return (
    <div data-slot="card-footer" class={`${cardFooterClasses} ${className}`}>
      {children}
    </div>
  )
}

export { Card, CardImage, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter }
export type { CardProps, CardImageProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardActionProps, CardFooterProps }
