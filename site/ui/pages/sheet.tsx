/**
 * Sheet Documentation Page
 */

import { SheetBasicDemo, SheetSideDemo, SheetFormDemo } from '@/components/sheet-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'side-variants', title: 'Side Variants', branch: 'start' },
  { id: 'form', title: 'Form', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Sheet,
  SheetTrigger,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'

function BasicSheet() {
  const [open, setOpen] = createSignal(false)

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger>Open Sheet</SheetTrigger>
      <SheetOverlay />
      <SheetContent
        side="right"
        ariaLabelledby="sheet-title"
        ariaDescribedby="sheet-description"
      >
        <SheetHeader>
          <SheetTitle id="sheet-title">Sheet Title</SheetTitle>
          <SheetDescription id="sheet-description">
            This is a basic sheet that slides in from the right.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 text-sm text-muted-foreground">
          <p>Sheet content goes here.</p>
        </div>
        <SheetFooter>
          <SheetClose>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}`

const sideCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Sheet,
  SheetTrigger,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'

function SheetSides() {
  const [openTop, setOpenTop] = createSignal(false)
  const [openRight, setOpenRight] = createSignal(false)
  const [openBottom, setOpenBottom] = createSignal(false)
  const [openLeft, setOpenLeft] = createSignal(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={openTop()} onOpenChange={setOpenTop}>
        <SheetTrigger>Top</SheetTrigger>
        <SheetOverlay />
        <SheetContent side="top" ariaLabelledby="top-title">
          <SheetHeader>
            <SheetTitle id="top-title">Top Sheet</SheetTitle>
            <SheetDescription>Slides from the top.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Repeat for right, bottom, left with side="right|bottom|left" */}
    </div>
  )
}`

const formCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Sheet,
  SheetTrigger,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'

function EditProfileSheet() {
  const [open, setOpen] = createSignal(false)

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger>Edit Profile</SheetTrigger>
      <SheetOverlay />
      <SheetContent
        side="right"
        ariaLabelledby="form-title"
        ariaDescribedby="form-description"
      >
        <SheetHeader>
          <SheetTitle id="form-title">Edit Profile</SheetTitle>
          <SheetDescription id="form-description">
            Make changes to your profile here.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label for="name" className="text-right text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              defaultValue="John Doe"
              className="col-span-3 flex h-10 w-full rounded-md border ..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label for="username" className="text-right text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              defaultValue="@johndoe"
              className="col-span-3 flex h-10 w-full rounded-md border ..."
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose>Cancel</SheetClose>
          <SheetClose>Save changes</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}`

// Props definitions
const sheetProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the sheet is open.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Event handler called when the open state should change.',
  },
]

const sheetTriggerProps: PropDefinition[] = [
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

const sheetContentProps: PropDefinition[] = [
  {
    name: 'side',
    type: "'top' | 'right' | 'bottom' | 'left'",
    defaultValue: "'right'",
    description: 'Which edge of the screen the sheet slides from.',
  },
  {
    name: 'showCloseButton',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Whether to show the built-in close button (X) in the top-right corner.',
  },
  {
    name: 'ariaLabelledby',
    type: 'string',
    description: 'ID of the element that labels the sheet (typically SheetTitle).',
  },
  {
    name: 'ariaDescribedby',
    type: 'string',
    description: 'ID of the element that describes the sheet (typically SheetDescription).',
  },
]

const sheetTitleProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-labelledby reference.',
  },
]

const sheetDescriptionProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-describedby reference.',
  },
]

const sheetCloseProps: PropDefinition[] = []

export function SheetPage() {
  return (
    <DocPage slug="sheet" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Sheet"
          description="A panel that slides in from the edge of the screen. Extends the Dialog pattern with side-based positioning and slide animations."
          {...getNavLinks('sheet')}
        />

        {/* Preview */}
        <Example title="" code={basicCode}>
          <div className="flex gap-4">
            <SheetBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add sheet" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Side Variants" code={sideCode}>
              <SheetSideDemo />
            </Example>

            <Example title="Form" code={formCode}>
              <SheetFormDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Sheet</h3>
              <PropsTable props={sheetProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">SheetTrigger</h3>
              <PropsTable props={sheetTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">SheetContent</h3>
              <PropsTable props={sheetContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">SheetTitle</h3>
              <PropsTable props={sheetTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">SheetDescription</h3>
              <PropsTable props={sheetDescriptionProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">SheetClose</h3>
              <PropsTable props={sheetCloseProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
