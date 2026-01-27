"use client"

/**
 * Accordion Components
 *
 * A vertically stacked set of interactive headings that reveal content.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Design Decision: Props-based state management instead of Context.
 * For "only one open at a time" behavior, use a single signal to
 * track the currently open item and pass `open`/`onOpenChange` props.
 *
 * @example Basic accordion
 * ```tsx
 * const [openItem, setOpenItem] = useState<string | null>(null)
 *
 * <Accordion>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger
 *       open={openItem === 'item-1'}
 *       onClick={() => setOpenItem(openItem === 'item-1' ? null : 'item-1')}
 *     >
 *       Section 1
 *     </AccordionTrigger>
 *     <AccordionContent open={openItem === 'item-1'}>
 *       Content for section 1
 *     </AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger
 *       open={openItem === 'item-2'}
 *       onClick={() => setOpenItem(openItem === 'item-2' ? null : 'item-2')}
 *     >
 *       Section 2
 *     </AccordionTrigger>
 *     <AccordionContent open={openItem === 'item-2'}>
 *       Content for section 2
 *     </AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */

import type { Child } from '../../types'
import { ChevronDownIcon } from './icon'

// Accordion container classes
const accordionClasses = 'w-full'

// AccordionItem classes
const accordionItemClasses = 'border-b border-border last:border-b-0'

// AccordionTrigger base classes
const accordionTriggerBaseClasses = 'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50'

// AccordionTrigger focus classes
const accordionTriggerFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// AccordionContent base classes (uses CSS grid animation)
const accordionContentBaseClasses = 'grid transition-[grid-template-rows,visibility] duration-normal ease-out'

// AccordionContent open classes
const accordionContentOpenClasses = 'grid-rows-[1fr] visible'

// AccordionContent closed classes
const accordionContentClosedClasses = 'grid-rows-[0fr] invisible'

// AccordionContent inner classes
const accordionContentInnerClasses = 'overflow-hidden text-sm'

/**
 * Props for Accordion component.
 */
interface AccordionProps {
  /** AccordionItem components */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Accordion container component.
 *
 * @param props.children - AccordionItem components
 */
function Accordion({
  class: className = '',
  children,
}: AccordionProps) {
  return (
    <div data-slot="accordion" className={`${accordionClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for AccordionItem component.
 */
interface AccordionItemProps {
  /** Unique identifier for this item */
  value: string
  /** Whether this item is open */
  open?: boolean
  /** Whether this item is disabled */
  disabled?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** AccordionTrigger and AccordionContent */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Individual accordion item.
 *
 * @param props.value - Item identifier
 * @param props.open - Whether open
 * @param props.disabled - Whether disabled
 */
function AccordionItem({
  class: className = '',
  value,
  open = false,
  children,
}: AccordionItemProps) {
  return (
    <div
      data-slot="accordion-item"
      data-state={open ? 'open' : 'closed'}
      data-value={value}
      className={`${accordionItemClasses} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Props for AccordionTrigger component.
 */
interface AccordionTriggerProps {
  /** Whether the accordion item is open */
  open?: boolean
  /** Whether disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Trigger label */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Clickable header that toggles accordion content.
 *
 * @param props.open - Whether open
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function AccordionTrigger({
  class: className = '',
  open = false,
  disabled = false,
  onClick,
  children,
}: AccordionTriggerProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const accordion = target.closest('[data-slot="accordion"]')
    if (!accordion) return

    const triggers = accordion.querySelectorAll('[data-slot="accordion-trigger"]:not([disabled])')
    const currentIndex = Array.from(triggers).indexOf(target)

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = currentIndex < triggers.length - 1 ? currentIndex + 1 : 0
        break
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : triggers.length - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = triggers.length - 1
        break
    }

    if (nextIndex !== null && triggers[nextIndex]) {
      ;(triggers[nextIndex] as HTMLElement).focus()
    }
  }

  const classes = `${accordionTriggerBaseClasses} ${accordionTriggerFocusClasses} ${className}`
  const iconClasses = `text-muted-foreground pointer-events-none shrink-0 translate-y-0.5 transition-transform duration-normal ${open ? 'rotate-180' : ''}`

  // Handle click with stopPropagation to prevent bubbling to parent scope element
  const handleClick = (e: Event) => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <h3 className="flex">
      <button
        data-slot="accordion-trigger"
        className={classes}
        disabled={disabled}
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
        <ChevronDownIcon size="sm" className={iconClasses} />
      </button>
    </h3>
  )
}

/**
 * Props for AccordionContent component.
 */
interface AccordionContentProps {
  /** Whether the content is visible */
  open?: boolean
  /** Content to display */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Collapsible content panel.
 *
 * @param props.open - Whether visible
 */
function AccordionContent({
  class: className = '',
  open = false,
  children,
}: AccordionContentProps) {
  // Create props object for reactive class updates
  // The compiler detects props.open usage and generates createEffect for client-side updates
  // Note: The 'props' constant is intentionally skipped in client JS generation
  //       since the function parameter already provides props
  const props = { open, class: className, children } as AccordionContentProps

  return (
    <div
      data-slot="accordion-content"
      role="region"
      data-state={open ? 'open' : 'closed'}
      className={`${accordionContentBaseClasses} ${(props.open ?? false) ? accordionContentOpenClasses : accordionContentClosedClasses}`}
    >
      <div className={accordionContentInnerClasses}>
        <div className={`pt-0 pb-4 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps }
