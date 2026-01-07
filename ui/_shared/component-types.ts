/**
 * Component Type Information Registry
 *
 * Provides type information for UI components to display in code tooltips.
 * Each entry contains a brief description shown on hover.
 */

export interface ComponentTypeInfo {
  /** Brief description shown in tooltip */
  description: string
  /** Key props to highlight */
  props?: string[]
}

/**
 * Registry of component type information.
 * Keys are component names as they appear in JSX (e.g., "Button", "Badge").
 */
export const componentTypes: Record<string, ComponentTypeInfo> = {
  // UI Components
  Button: {
    description: `Button component with variants and sizes.

variant - Visual style:
  'default' - Primary action, solid background
  'destructive' - Dangerous action (red)
  'outline' - Bordered with transparent bg
  'secondary' - Muted styling
  'ghost' - Minimal, visible on hover
  'link' - Text link with underline

size - Button size:
  'default' | 'sm' | 'lg' | 'icon'

asChild - Render child element instead`,
    props: ['variant', 'size', 'asChild'],
  },
  Badge: {
    description: 'A small label for status or category.',
    props: ['variant'],
  },
  Input: {
    description: 'A text input field with styling.',
    props: ['type', 'placeholder'],
  },
  Checkbox: {
    description: 'A toggleable checkbox with checked state.',
    props: ['checked', 'onCheckedChange', 'disabled'],
  },
  Switch: {
    description: 'A toggle switch for boolean values.',
    props: ['checked', 'onCheckedChange', 'disabled'],
  },
  Counter: {
    description: 'A numeric input with increment/decrement buttons.',
    props: ['value', 'onChange', 'min', 'max'],
  },
  Select: {
    description: 'A dropdown selection component.',
    props: ['value', 'onValueChange', 'options'],
  },

  // Composite Components
  Tabs: {
    description: 'A tabbed interface container.',
    props: ['value', 'onValueChange', 'defaultValue'],
  },
  TabsList: {
    description: 'Container for tab triggers.',
  },
  TabsTrigger: {
    description: 'A clickable tab button.',
    props: ['value'],
  },
  TabsContent: {
    description: 'Content panel for a tab.',
    props: ['value'],
  },
  Accordion: {
    description: 'An expandable content container.',
    props: ['type', 'defaultValue'],
  },
  AccordionItem: {
    description: 'A single accordion section.',
    props: ['value'],
  },
  AccordionTrigger: {
    description: 'Clickable header to toggle accordion.',
  },
  AccordionContent: {
    description: 'Expandable content area.',
  },
  Dialog: {
    description: 'A modal dialog overlay.',
    props: ['open', 'onOpenChange'],
  },
  DialogTrigger: {
    description: 'Button to open the dialog.',
  },
  DialogContent: {
    description: 'The dialog panel content.',
  },
  DialogHeader: {
    description: 'Header section of dialog.',
  },
  DialogTitle: {
    description: 'Title text of dialog.',
  },
  DialogDescription: {
    description: 'Description text of dialog.',
  },
  DialogFooter: {
    description: 'Footer section with actions.',
  },
  DialogClose: {
    description: 'Button to close the dialog.',
  },
  Dropdown: {
    description: 'A dropdown menu component.',
    props: ['open', 'onOpenChange'],
  },
  DropdownTrigger: {
    description: 'Button to open the dropdown.',
  },
  DropdownContent: {
    description: 'The dropdown menu content.',
  },
  DropdownItem: {
    description: 'A selectable menu item.',
    props: ['value', 'onSelect'],
  },
  DropdownLabel: {
    description: 'A non-interactive label.',
  },
  Toast: {
    description: 'A notification message.',
    props: ['variant', 'duration'],
  },
  ToastProvider: {
    description: 'Container for toast notifications.',
    props: ['position'],
  },
  Tooltip: {
    description: 'A hover tooltip component.',
    props: ['content', 'side'],
  },
  TooltipTrigger: {
    description: 'Element that triggers tooltip.',
  },
  TooltipContent: {
    description: 'The tooltip popup content.',
  },

  // Card Components
  Card: {
    description: 'A container card with sections.',
  },
  CardHeader: {
    description: 'Header section of card.',
  },
  CardTitle: {
    description: 'Title text of card.',
  },
  CardDescription: {
    description: 'Description text of card.',
  },
  CardContent: {
    description: 'Main content area of card.',
  },
  CardFooter: {
    description: 'Footer section of card.',
  },

  // Utility
  Slot: {
    description: 'Renders child with merged props.',
  },
}

/**
 * Get tooltip content for a component name.
 * Returns null if component is not in registry.
 */
export function getComponentTooltip(componentName: string): string | null {
  const info = componentTypes[componentName]
  if (!info) return null

  let tooltip = info.description
  if (info.props && info.props.length > 0) {
    tooltip += `\nProps: ${info.props.join(', ')}`
  }
  return tooltip
}
