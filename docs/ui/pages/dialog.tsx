/**
 * Dialog Documentation Page
 */

import { DialogBasicDemo, DialogFormDemo, DialogLongContentDemo } from '@/components/dialog-demo'
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
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'with-form', title: 'With Form' },
  { id: 'long-content', title: 'Long Content', branch: 'end' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

function CreateTaskDialog() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Create Task
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="dialog-title"
        ariaDescribedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Create New Task</DialogTitle>
          <DialogDescription id="dialog-description">
            Add a new task to your list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label for="task-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="Enter task title"
              className="flex h-10 w-full rounded-md border ..."
            />
          </div>
          <div className="grid gap-2">
            <label for="task-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="task-description"
              placeholder="Enter task description (optional)"
              rows={3}
              className="flex w-full rounded-md border ..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Create</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}`

const formCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

function DialogForm() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Edit Profile
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="form-dialog-title"
      >
        <DialogHeader>
          <DialogTitle id="form-dialog-title">Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" type="text" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
          <Button onClick={() => setOpen(false)}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}`

const longContentCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

function DialogLongContent() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Open Long Content Dialog
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="long-dialog-title"
        ariaDescribedby="long-dialog-description"
        class="max-h-80"
      >
        <DialogHeader>
          <DialogTitle id="long-dialog-title">Terms of Service</DialogTitle>
          <DialogDescription id="long-dialog-description">
            Please read the following terms carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4">
          <p>Lorem ipsum dolor sit amet...</p>
          {/* Multiple paragraphs of content */}
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Decline</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Accept</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}`

// Props definitions
const dialogTriggerProps: PropDefinition[] = [
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the trigger is clicked.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the trigger is disabled.',
  },
]

const dialogOverlayProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the overlay is visible.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the overlay is clicked (typically to close the dialog).',
  },
]

const dialogContentProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the dialog is open.',
  },
  {
    name: 'onClose',
    type: '() => void',
    description: 'Event handler called when the dialog should close (ESC key).',
  },
  {
    name: 'ariaLabelledby',
    type: 'string',
    description: 'ID of the element that labels the dialog (typically DialogTitle).',
  },
  {
    name: 'ariaDescribedby',
    type: 'string',
    description: 'ID of the element that describes the dialog (typically DialogDescription).',
  },
]

const dialogTitleProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-labelledby reference.',
  },
]

const dialogDescriptionProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-describedby reference.',
  },
]

const dialogCloseProps: PropDefinition[] = [
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the close button is clicked.',
  },
]

export function DialogPage() {
  const installCommands = getHighlightedCommands('barefoot add dialog')

  return (
    <DocPage slug="dialog" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Dialog"
          description="A modal dialog that displays content in a layer above the page. Supports ESC key, overlay click, focus trap, and scroll lock."
          {...getNavLinks('dialog')}
        />

        {/* Preview */}
        <Example title="" code={`<DialogContent open={open()} onClose={() => setOpen(false)}>...</DialogContent>`}>
          <div className="flex gap-4">
            <DialogBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add dialog" highlightedCommands={installCommands} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">ESC key to close</strong> - Press Escape to close the dialog</li>
            <li><strong className="text-foreground">Click outside to close</strong> - Click the overlay to close</li>
            <li><strong className="text-foreground">Scroll lock</strong> - Body scroll is disabled when dialog is open</li>
            <li><strong className="text-foreground">Focus trap</strong> - Tab/Shift+Tab cycles within the dialog</li>
            <li><strong className="text-foreground">Accessibility</strong> - role="dialog", aria-modal="true", aria-labelledby, aria-describedby</li>
            <li><strong className="text-foreground">Portal rendering</strong> - Dialog is mounted to document.body via createPortal</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <DialogBasicDemo />
            </Example>

            <Example title="With Form" code={formCode}>
              <DialogFormDemo />
            </Example>

            <Example title="Long Content" code={longContentCode}>
              <DialogLongContentDemo />
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Focus Management</strong> - Focus moves to the first focusable element when dialog opens, and returns to the trigger when closed</li>
            <li><strong className="text-foreground">Tab Cycling</strong> - Tab/Shift+Tab cycles within the dialog content</li>
            <li><strong className="text-foreground">Keyboard</strong> - Press ESC to close the dialog</li>
            <li><strong className="text-foreground">ARIA</strong> - role="dialog", aria-modal="true", aria-labelledby, aria-describedby</li>
            <li><strong className="text-foreground">Screen Readers</strong> - Dialog title and description are announced when opened</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogTrigger</h3>
              <PropsTable props={dialogTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogOverlay</h3>
              <PropsTable props={dialogOverlayProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogContent</h3>
              <PropsTable props={dialogContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogTitle</h3>
              <PropsTable props={dialogTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogDescription</h3>
              <PropsTable props={dialogDescriptionProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DialogClose</h3>
              <PropsTable props={dialogCloseProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
