/**
 * Dropdown Menu Documentation Page
 */

import { DropdownMenuProfileDemo, DropdownMenuAsChildDemo } from '@/components/dropdown-menu-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  getHighlightedCommands,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'profile-menu', title: 'Profile Menu', branch: 'start' },
  { id: 'as-child', title: 'As Child' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const profileMenuCode = `"use client"

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
} from '@/components/ui/dropdown-menu'
import { SettingsIcon, GlobeIcon, LogOutIcon, CircleHelpIcon } from '@/components/ui/icon'

function ProfileMenu() {
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          KK
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => console.log('settings')}>
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
  )
}`

const asChildCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { SettingsIcon, GlobeIcon, LogOutIcon } from '@/components/ui/icon'

function AsChildMenu() {
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <SettingsIcon size="sm" />
          <span>Actions</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => console.log('settings')}>
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
  )
}`

// Props definitions
const dropdownMenuProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the dropdown menu is open.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Callback when open state should change.',
  },
]

const dropdownMenuTriggerProps: PropDefinition[] = [
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the trigger is disabled.',
  },
  {
    name: 'asChild',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Render child element as trigger instead of built-in button.',
  },
]

const dropdownMenuContentProps: PropDefinition[] = [
  {
    name: 'align',
    type: "'start' | 'end'",
    defaultValue: "'start'",
    description: 'Alignment relative to the trigger element.',
  },
]

const dropdownMenuItemProps: PropDefinition[] = [
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the item is disabled.',
  },
  {
    name: 'onSelect',
    type: '() => void',
    description: 'Callback when the item is selected. Menu auto-closes after selection.',
  },
]

const dropdownMenuLabelProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'The label text to display.',
  },
]

const dropdownMenuShortcutProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'The keyboard shortcut text (e.g., "⇧⌘,").',
  },
]

export function DropdownMenuPage() {
  const installCommands = getHighlightedCommands('barefoot add dropdown-menu')

  return (
    <DocPage slug="dropdown-menu" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Dropdown Menu"
          description="A menu of actions triggered by a button."
          {...getNavLinks('dropdown-menu')}
        />

        {/* Preview */}
        <Example title="" code={`<DropdownMenu open={open()} onOpenChange={setOpen}><DropdownMenuTrigger>...</DropdownMenuTrigger><DropdownMenuContent>...</DropdownMenuContent></DropdownMenu>`}>
          <div className="flex gap-4">
            <DropdownMenuProfileDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add dropdown-menu" highlightedCommands={installCommands} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Props-based state</strong> - Parent controls open state with signals</li>
            <li><strong className="text-foreground">Flexible trigger</strong> - Use any element as the trigger (button, avatar, icon)</li>
            <li><strong className="text-foreground">ESC key to close</strong> - Press Escape to close the menu</li>
            <li><strong className="text-foreground">Arrow key navigation</strong> - Navigate items with keyboard</li>
            <li><strong className="text-foreground">Accessibility</strong> - role="menu", role="menuitem", aria-expanded, aria-haspopup</li>
            <li><strong className="text-foreground">Composable</strong> - Label, Separator, Shortcut, Group sub-components</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Profile Menu" code={profileMenuCode}>
              <DropdownMenuProfileDemo />
            </Example>
            <Example title="As Child" code={asChildCode}>
              <DropdownMenuAsChildDemo />
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Keyboard Navigation</strong> - Arrow Up/Down to navigate, Home/End to jump, Enter/Space to select</li>
            <li><strong className="text-foreground">Focus Return</strong> - Focus returns to trigger after action</li>
            <li><strong className="text-foreground">ESC to Close</strong> - Press Escape to close the menu</li>
            <li><strong className="text-foreground">ARIA</strong> - role="menu" on content, role="menuitem" on items</li>
            <li><strong className="text-foreground">State Attributes</strong> - aria-expanded, aria-haspopup="menu", aria-disabled</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenu</h3>
              <PropsTable props={dropdownMenuProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenuTrigger</h3>
              <PropsTable props={dropdownMenuTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenuContent</h3>
              <PropsTable props={dropdownMenuContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenuItem</h3>
              <PropsTable props={dropdownMenuItemProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenuLabel</h3>
              <PropsTable props={dropdownMenuLabelProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DropdownMenuShortcut</h3>
              <PropsTable props={dropdownMenuShortcutProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
