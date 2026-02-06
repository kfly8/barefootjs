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
 * Profile menu demo - avatar trigger with account actions
 */
export function DropdownMenuProfileDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="relative inline-block">
      <DropdownMenuTrigger open={open()} onClick={() => setOpen(!open())}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
          aria-label="Profile menu"
        >
          KK
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent open={open()} onClose={() => setOpen(false)} align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setOpen(false)}>
            <SettingsIcon size="sm" />
            <span>Settings</span>
            <DropdownMenuShortcut>⇧⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(false)}>
            <GlobeIcon size="sm" />
            <span>Language</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(false)}>
            <CircleHelpIcon size="sm" />
            <span>Help</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setOpen(false)}>
          <LogOutIcon size="sm" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </div>
  )
}
