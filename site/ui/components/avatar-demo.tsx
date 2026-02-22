"use client"

/**
 * Avatar Demo Components
 *
 * Demos for the Avatar component documentation page.
 */

import { Avatar, AvatarImage, AvatarFallback } from '@ui/components/ui/avatar'

/**
 * Basic avatar with image and fallback.
 */
export function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/kfly8.png" alt="@kfly8" />
      <AvatarFallback>KF</AvatarFallback>
    </Avatar>
  )
}

/**
 * Avatar with fallback only (no image).
 */
export function AvatarFallbackDemo() {
  return (
    <Avatar>
      <AvatarFallback>BF</AvatarFallback>
    </Avatar>
  )
}

/**
 * Multiple avatars displayed as a team member list.
 */
export function AvatarGroupDemo() {
  return (
    <div className="flex -space-x-3">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/kfly8.png" alt="@kfly8" />
        <AvatarFallback>KF</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  )
}
