/**
 * Drawer Documentation Page
 */

import { DrawerBasicDemo, DrawerDirectionDemo, DrawerFormDemo } from '@/components/drawer-demo'
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
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'direction', title: 'Direction', branch: 'child' },
  { id: 'form', title: 'Form', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Drawer,
  DrawerTrigger,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'

function BasicDrawer() {
  const [open, setOpen] = createSignal(false)

  return (
    <Drawer open={open()} onOpenChange={setOpen}>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerOverlay />
      <DrawerContent
        direction="bottom"
        ariaLabelledby="drawer-title"
        ariaDescribedby="drawer-description"
      >
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle id="drawer-title">Move Goal</DrawerTitle>
          <DrawerDescription id="drawer-description">
            Set your daily move goal.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-7xl font-bold tracking-tighter">350</span>
            <span className="text-muted-foreground text-sm pb-2">kcal/day</span>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}`

const directionCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Drawer,
  DrawerTrigger,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'

function DrawerDirections() {
  const [openBottom, setOpenBottom] = createSignal(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Drawer open={openBottom()} onOpenChange={setOpenBottom}>
        <DrawerTrigger>Bottom</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent direction="bottom" ariaLabelledby="bottom-title">
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle id="bottom-title">Bottom Drawer</DrawerTitle>
            <DrawerDescription>Slides from the bottom.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Repeat for top, right, left with direction="top|right|left" */}
    </div>
  )
}`

const formCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Drawer,
  DrawerTrigger,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'

// Interactive controls as a separate component with own scope
function GoalControl() {
  const [goal, setGoal] = createSignal(350)
  const adjustGoal = (amount) => {
    setGoal((prev) => Math.max(100, prev + amount))
  }
  return (
    <div className="p-4 pb-0">
      <div className="flex items-center justify-center space-x-4">
        <button onClick={() => adjustGoal(-10)}>-</button>
        <span className="text-7xl font-bold">{goal()}</span>
        <button onClick={() => adjustGoal(10)}>+</button>
      </div>
      <p className="text-muted-foreground text-sm text-center mt-1">kcal/day</p>
    </div>
  )
}

function GoalDrawer() {
  const [open, setOpen] = createSignal(false)

  return (
    <Drawer open={open()} onOpenChange={setOpen}>
      <DrawerTrigger>Set Goal</DrawerTrigger>
      <DrawerOverlay />
      <DrawerContent
        direction="bottom"
        ariaLabelledby="form-title"
        ariaDescribedby="form-description"
      >
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle id="form-title">Move Goal</DrawerTitle>
          <DrawerDescription id="form-description">
            Set your daily activity goal.
          </DrawerDescription>
        </DrawerHeader>
        <GoalControl />
        <DrawerFooter>
          <DrawerClose>Submit</DrawerClose>
          <DrawerClose>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}`

// Props definitions
const drawerProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the drawer is open.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Event handler called when the open state should change.',
  },
]

const drawerTriggerProps: PropDefinition[] = [
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

const drawerContentProps: PropDefinition[] = [
  {
    name: 'direction',
    type: "'top' | 'right' | 'bottom' | 'left'",
    defaultValue: "'bottom'",
    description: 'Which edge of the screen the drawer slides from.',
  },
  {
    name: 'ariaLabelledby',
    type: 'string',
    description: 'ID of the element that labels the drawer (typically DrawerTitle).',
  },
  {
    name: 'ariaDescribedby',
    type: 'string',
    description: 'ID of the element that describes the drawer (typically DrawerDescription).',
  },
]

const drawerHandleProps: PropDefinition[] = [
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes for the handle bar.',
  },
]

const drawerTitleProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-labelledby reference.',
  },
]

const drawerDescriptionProps: PropDefinition[] = [
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-describedby reference.',
  },
]

const drawerCloseProps: PropDefinition[] = []

export function DrawerPage() {
  return (
    <DocPage slug="drawer" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Drawer"
          description="A panel that slides in from the edge of the screen, typically from the bottom. Ideal for mobile-friendly interactions."
          {...getNavLinks('drawer')}
        />

        {/* Preview */}
        <Example title="" code={basicCode}>
          <div className="flex gap-4">
            <DrawerBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add drawer" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <DrawerBasicDemo />
            </Example>

            <Example title="Direction" code={directionCode}>
              <DrawerDirectionDemo />
            </Example>

            <Example title="Form" code={formCode}>
              <DrawerFormDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Drawer</h3>
              <PropsTable props={drawerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerTrigger</h3>
              <PropsTable props={drawerTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerContent</h3>
              <PropsTable props={drawerContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerHandle</h3>
              <PropsTable props={drawerHandleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerTitle</h3>
              <PropsTable props={drawerTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerDescription</h3>
              <PropsTable props={drawerDescriptionProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">DrawerClose</h3>
              <PropsTable props={drawerCloseProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
