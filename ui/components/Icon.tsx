/**
 * Icon Component
 *
 * A wrapper component for Lucide icons.
 * Provides consistent sizing and styling across the UI.
 *
 * Icons are implemented as JSX to work with BarefootJS compiler.
 * Based on lucide-static v0.562.0 icon definitions.
 */

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

export interface IconProps {
  name: IconName
  size?: IconSize
  class?: string
}

// Map size to pixel values
const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

// Available icon names
export type IconName =
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'x'
  | 'plus'
  | 'minus'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'copy'
  | 'clipboard'
  | 'clipboard-check'

// Icon path definitions (from lucide-static)
const iconPaths: Record<IconName, string> = {
  'check': 'M20 6 9 17l-5-5',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-up': 'm18 15-6-6-6 6',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  'x': 'M18 6 6 18M6 6l12 12',
  'plus': 'M5 12h14M12 5v14',
  'minus': 'M5 12h14',
  'sun': 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  'moon': 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  'monitor': 'M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 21h8M12 17v4',
  'copy': 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2M8 8h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z',
  'clipboard': 'M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
  'clipboard-check': 'M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4',
}

export function Icon({ name, size = 'md', class: className = '' }: IconProps) {
  const pixelSize = sizeMap[size]
  const path = iconPaths[name]

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

// Convenience components for commonly used icons
export function CheckIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="check" size={size} class={className} />
}

export function ChevronDownIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="chevron-down" size={size} class={className} />
}

export function ChevronUpIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="chevron-up" size={size} class={className} />
}

export function ChevronLeftIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="chevron-left" size={size} class={className} />
}

export function ChevronRightIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="chevron-right" size={size} class={className} />
}

export function XIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="x" size={size} class={className} />
}

export function PlusIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="plus" size={size} class={className} />
}

export function MinusIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="minus" size={size} class={className} />
}

export function SunIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="sun" size={size} class={className} />
}

export function MoonIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="moon" size={size} class={className} />
}

export function MonitorIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="monitor" size={size} class={className} />
}

export function CopyIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="copy" size={size} class={className} />
}

export function ClipboardIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="clipboard" size={size} class={className} />
}

export function ClipboardCheckIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="clipboard-check" size={size} class={className} />
}
