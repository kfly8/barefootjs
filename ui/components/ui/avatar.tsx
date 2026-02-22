"use client"

/**
 * Avatar Component
 *
 * Displays a user profile image with a fallback for when the image is unavailable.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Avatar>
 *   <AvatarImage src="/avatar.png" alt="User" />
 *   <AvatarFallback>CN</AvatarFallback>
 * </Avatar>
 * ```
 */

import type { HTMLBaseAttributes, ImgHTMLAttributes } from '@barefootjs/jsx'
import type { Child } from '../../types'

// Base classes for each sub-component
const avatarClasses = 'relative flex size-8 shrink-0 overflow-hidden rounded-full'
const avatarImageClasses = 'aspect-square size-full'
const avatarFallbackClasses = 'flex size-full items-center justify-center rounded-full bg-muted'

/**
 * Props for the Avatar container component.
 */
interface AvatarProps extends HTMLBaseAttributes {
  /** Children to render (typically AvatarImage and AvatarFallback). */
  children?: Child
}

/**
 * Avatar container component.
 * Wraps AvatarImage and AvatarFallback in a circular container.
 */
function Avatar({ className = '', children, ...props }: AvatarProps) {
  const classes = `${avatarClasses} ${className}`
  return (
    <span data-slot="avatar" className={classes} {...props}>
      {children}
    </span>
  )
}

/**
 * Props for the AvatarImage component.
 */
interface AvatarImageProps extends ImgHTMLAttributes {}

/**
 * Avatar image component.
 * Renders the user's profile image inside the avatar container.
 */
function AvatarImage({ className = '', ...props }: AvatarImageProps) {
  const classes = `${avatarImageClasses} ${className}`
  return (
    <img data-slot="avatar-image" className={classes} {...props} />
  )
}

/**
 * Props for the AvatarFallback component.
 */
interface AvatarFallbackProps extends HTMLBaseAttributes {
  /** Fallback content (typically user initials). */
  children?: Child
}

/**
 * Avatar fallback component.
 * Displays initials or an icon when the avatar image is unavailable.
 * Positioned behind the image using CSS stacking.
 */
function AvatarFallback({ className = '', children, ...props }: AvatarFallbackProps) {
  const classes = `${avatarFallbackClasses} ${className}`
  return (
    <span data-slot="avatar-fallback" className={classes} {...props}>
      {children}
    </span>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps }
