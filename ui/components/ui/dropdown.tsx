"use client"

/**
 * Dropdown Components
 *
 * A select-like dropdown menu for choosing from a list of options.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Features:
 * - ESC key to close
 * - Arrow key navigation
 * - Accessibility (role="combobox", role="listbox", role="option")
 *
 * @example Basic dropdown
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const [selected, setSelected] = useState('apple')
 *
 * <Dropdown>
 *   <DropdownTrigger open={open} onClick={() => setOpen(!open)}>
 *     <DropdownLabel>{selected}</DropdownLabel>
 *   </DropdownTrigger>
 *   <DropdownContent open={open} onClose={() => setOpen(false)}>
 *     <DropdownItem
 *       value="apple"
 *       selected={selected === 'apple'}
 *       onClick={() => { setSelected('apple'); setOpen(false) }}
 *     >
 *       Apple
 *     </DropdownItem>
 *     <DropdownItem
 *       value="banana"
 *       selected={selected === 'banana'}
 *       onClick={() => { setSelected('banana'); setOpen(false) }}
 *     >
 *       Banana
 *     </DropdownItem>
 *   </DropdownContent>
 * </Dropdown>
 * ```
 */

import type { Child } from '../../types'
import { CheckIcon, ChevronDownIcon } from './icon'

// Dropdown container classes
const dropdownClasses = 'relative inline-block'

// DropdownTrigger base classes
const dropdownTriggerBaseClasses = 'inline-flex items-center justify-between rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent h-10 px-4 py-2 min-w-[160px] disabled:pointer-events-none disabled:opacity-50'

// DropdownContent base classes
const dropdownContentBaseClasses = 'absolute z-50 mt-1 w-full min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-md transform-gpu origin-top transition-all duration-normal ease-out'

// DropdownContent open/closed classes
const dropdownContentOpenClasses = 'opacity-100 scale-100'
const dropdownContentClosedClasses = 'opacity-0 scale-95 pointer-events-none'

// DropdownItem base classes
const dropdownItemBaseClasses = 'relative flex cursor-pointer select-none items-center gap-2 px-2 py-1.5 text-sm outline-hidden rounded-sm'

// DropdownItem state classes
const dropdownItemDefaultClasses = 'text-popover-foreground hover:bg-accent/50 focus:bg-accent focus:text-accent-foreground'
const dropdownItemSelectedClasses = 'bg-accent text-accent-foreground font-medium'
const dropdownItemDisabledClasses = 'pointer-events-none opacity-50'

// DropdownLabel classes
const dropdownLabelClasses = 'text-muted-foreground'

/**
 * Props for Dropdown component.
 */
interface DropdownProps {
  /** DropdownTrigger and DropdownContent */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Dropdown container component.
 *
 * @param props.children - Trigger and content components
 */
function Dropdown({ class: className = '', children }: DropdownProps) {
  return (
    <div data-slot="dropdown" className={`${dropdownClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for DropdownTrigger component.
 */
interface DropdownTriggerProps {
  /** Whether the dropdown is open */
  open?: boolean
  /** Whether disabled */
  disabled?: boolean
  /** Click handler to toggle dropdown */
  onClick?: () => void
  /** Trigger content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that toggles the dropdown.
 *
 * @param props.open - Whether open
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function DropdownTrigger({
  class: className = '',
  open = false,
  disabled = false,
  onClick,
  children,
}: DropdownTriggerProps) {
  const iconClasses = `ml-2 text-muted-foreground transition-transform duration-normal ${open ? 'rotate-180' : ''}`

  return (
    <button
      data-slot="dropdown-trigger"
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      className={`${dropdownTriggerBaseClasses} ${className}`}
      onClick={onClick}
    >
      <span className="truncate">{children}</span>
      <ChevronDownIcon size="sm" className={iconClasses} />
    </button>
  )
}

/**
 * Props for DropdownContent component.
 */
interface DropdownContentProps {
  /** Whether the dropdown is open */
  open?: boolean
  /** Callback to close the dropdown */
  onClose?: () => void
  /** DropdownItem components */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Content container for dropdown items.
 *
 * @param props.open - Whether visible
 * @param props.onClose - Close callback
 */
function DropdownContent({
  class: className = '',
  open = false,
  onClose,
  children,
}: DropdownContentProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const items = target.querySelectorAll('[data-slot="dropdown-item"]:not([aria-disabled="true"])')
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

    switch (e.key) {
      case 'Escape':
        if (onClose) onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (items.length > 0) {
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          ;(items[nextIndex] as HTMLElement).focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (items.length > 0) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          ;(items[prevIndex] as HTMLElement).focus()
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (document.activeElement && (document.activeElement as HTMLElement).dataset.slot === 'dropdown-item') {
          ;(document.activeElement as HTMLElement).click()
        }
        break
      case 'Home':
        e.preventDefault()
        if (items.length > 0) {
          ;(items[0] as HTMLElement).focus()
        }
        break
      case 'End':
        e.preventDefault()
        if (items.length > 0) {
          ;(items[items.length - 1] as HTMLElement).focus()
        }
        break
    }
  }

  const stateClasses = open ? dropdownContentOpenClasses : dropdownContentClosedClasses

  return (
    <div
      data-slot="dropdown-content"
      data-state={open ? 'open' : 'closed'}
      role="listbox"
      tabindex={-1}
      className={`${dropdownContentBaseClasses} ${stateClasses} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

/**
 * Props for DropdownItem component.
 */
interface DropdownItemProps {
  /** Value identifier */
  value: string
  /** Whether this item is selected */
  selected?: boolean
  /** Whether disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Item content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Individual dropdown item.
 *
 * @param props.value - Item identifier
 * @param props.selected - Whether selected
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function DropdownItem({
  class: className = '',
  value,
  selected = false,
  disabled = false,
  onClick,
  children,
}: DropdownItemProps) {
  const handleClick = () => {
    onClick?.()
    const trigger = document.querySelector('[data-slot="dropdown-trigger"]') as HTMLElement
    setTimeout(() => trigger?.focus(), 0)
  }

  const stateClasses = disabled
    ? dropdownItemDisabledClasses
    : selected
    ? dropdownItemSelectedClasses
    : dropdownItemDefaultClasses

  return (
    <div
      data-slot="dropdown-item"
      data-value={value}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      tabindex={disabled ? -1 : 0}
      className={`${dropdownItemBaseClasses} ${stateClasses} ${className}`}
      onClick={handleClick}
    >
      {selected && <CheckIcon size="sm" className="absolute left-2" />}
      <span className={selected ? 'pl-6' : ''}>{children}</span>
    </div>
  )
}

/**
 * Props for DropdownLabel component.
 */
interface DropdownLabelProps {
  /** Label text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Label text inside the trigger.
 *
 * @param props.children - Label content
 */
function DropdownLabel({ class: className = '', children }: DropdownLabelProps) {
  return (
    <span data-slot="dropdown-label" className={`${dropdownLabelClasses} ${className}`}>
      {children}
    </span>
  )
}

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownLabel }
export type { DropdownProps, DropdownTriggerProps, DropdownContentProps, DropdownItemProps, DropdownLabelProps }
