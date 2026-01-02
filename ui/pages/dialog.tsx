/**
 * Dialog Documentation Page
 */

import { DialogBasicDemo, DialogFormDemo } from '@/components/DialogDemo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add dialog`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/dialog'

export default function Page() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Open Dialog
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="dialog-title"
        ariaDescribedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
          <DialogDescription id="dialog-description">
            Dialog description here.
          </DialogDescription>
        </DialogHeader>
        <p>Dialog content goes here.</p>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}`

const basicCode = `const [open, setOpen] = createSignal(false)

<DialogTrigger onClick={() => setOpen(true)}>
  Open Dialog
</DialogTrigger>
<DialogOverlay open={open()} onClick={() => setOpen(false)} />
<DialogContent
  open={open()}
  onClose={() => setOpen(false)}
  ariaLabelledby="dialog-title"
  ariaDescribedby="dialog-description"
>
  <DialogHeader>
    <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
    <DialogDescription id="dialog-description">
      This is a basic dialog example.
    </DialogDescription>
  </DialogHeader>
  <p>Dialog content goes here.</p>
  <DialogFooter>
    <DialogClose onClick={() => setOpen(false)}>Close</DialogClose>
  </DialogFooter>
</DialogContent>`

const formCode = `const [open, setOpen] = createSignal(false)

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
  <div class="grid gap-4 py-4">
    <div class="grid grid-cols-4 items-center gap-4">
      <label for="name" class="text-right text-sm font-medium">
        Name
      </label>
      <input id="name" type="text" class="col-span-3 ..." />
    </div>
  </div>
  <DialogFooter>
    <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
    <button onClick={() => setOpen(false)}>Save changes</button>
  </DialogFooter>
</DialogContent>`

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
  return (
    <div class="space-y-12">
      <PageHeader
        title="Dialog"
        description="A modal dialog that displays content in a layer above the page. Supports ESC key, overlay click, focus trap, and scroll lock."
      />

      {/* Preview */}
      <Example title="" code={`<DialogContent open={open()} onClose={() => setOpen(false)}>...</DialogContent>`}>
        <div class="flex gap-4">
          <DialogBasicDemo />
        </div>
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Features */}
      <Section title="Features">
        <ul class="list-disc list-inside space-y-2 text-zinc-400">
          <li><strong class="text-zinc-200">ESC key to close</strong> - Press Escape to close the dialog</li>
          <li><strong class="text-zinc-200">Click outside to close</strong> - Click the overlay to close</li>
          <li><strong class="text-zinc-200">Scroll lock</strong> - Body scroll is disabled when dialog is open</li>
          <li><strong class="text-zinc-200">Focus trap</strong> - Tab/Shift+Tab cycles within the dialog</li>
          <li><strong class="text-zinc-200">Accessibility</strong> - role="dialog", aria-modal="true", aria-labelledby, aria-describedby</li>
          <li><strong class="text-zinc-200">Portal rendering</strong> - Dialog is mounted to document.body via createPortal</li>
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Basic Dialog" code={basicCode}>
            <DialogBasicDemo />
          </Example>

          <Example title="Dialog with Form" code={formCode}>
            <DialogFormDemo />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogTrigger</h3>
            <PropsTable props={dialogTriggerProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogOverlay</h3>
            <PropsTable props={dialogOverlayProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogContent</h3>
            <PropsTable props={dialogContentProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogTitle</h3>
            <PropsTable props={dialogTitleProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogDescription</h3>
            <PropsTable props={dialogDescriptionProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DialogClose</h3>
            <PropsTable props={dialogCloseProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
