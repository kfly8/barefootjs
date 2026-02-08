"use client"
/**
 * DropdownMenuDemo Components
 *
 * Interactive demos for DropdownMenu component.
 * Used in dropdown-menu documentation page.
 *
 * Note: Due to BarefootJS compiler limitations, we explicitly write out each
 * item instead of using .map() over a local array. Local variables
 * are not preserved during compilation.
 */

import { createSignal } from '@barefootjs/dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@ui/components/ui/dropdown-menu'
import { SettingsIcon, GlobeIcon, LogOutIcon, CircleHelpIcon } from '@ui/components/ui/icon'

/**
 * asChild demo - custom button element as trigger via asChild prop
 */
export function DropdownMenuAsChildDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DropdownMenu open={open()} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            aria-label="Actions"
          >
            <SettingsIcon size="sm" />
            <span>Actions</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <SettingsIcon size="sm" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <GlobeIcon size="sm" />
            <span>Language</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOutIcon size="sm" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/**
 * Profile menu demo - avatar trigger with account actions
 */
export function DropdownMenuProfileDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DropdownMenu open={open()} onOpenChange={setOpen}>
        <DropdownMenuTrigger class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
            aria-label="Profile menu"
          >
            KK
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <SettingsIcon size="sm" />
              <span>Settings</span>
              <DropdownMenuShortcut>⇧⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GlobeIcon size="sm" />
              <span>Language</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CircleHelpIcon size="sm" />
              <span>Help</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOutIcon size="sm" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
