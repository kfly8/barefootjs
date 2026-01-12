'use client'

/**
 * Icon Component
 *
 * A wrapper component for Lucide icons and custom icons.
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
  | 'github'
  | 'search'
  | 'menu'
  | 'arrow-left'
  | 'arrow-right'

// Simple stroke-based icons (single path string)
const strokeIcons: Partial<Record<IconName, string>> = {
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
  'menu': 'M4 6h16M4 12h16M4 18h16',
  'arrow-left': 'm12 19-7-7 7-7M19 12H5',
  'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
}

// Simple stroke icon component
function StrokeIcon({ d, size, className }: { d: string; size: number; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

// GitHub icon (fill-based)
function GitHubSvg({ size, className }: { size: number; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      class={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

// Search icon (multi-element: circle + path)
function SearchSvg({ size, className }: { size: number; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function Icon({ name, size = 'md', class: className = '' }: IconProps) {
  const pixelSize = sizeMap[size]

  // Handle special icons with dedicated components
  if (name === 'github') {
    return <GitHubSvg size={pixelSize} className={className} />
  }

  if (name === 'search') {
    return <SearchSvg size={pixelSize} className={className} />
  }

  // Handle simple stroke-based icons
  const path = strokeIcons[name]
  if (path) {
    return <StrokeIcon d={path} size={pixelSize} className={className} />
  }

  // Fallback (should not happen if IconName is used correctly)
  return null
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

export function GitHubIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="github" size={size} class={className} />
}

export function SearchIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="search" size={size} class={className} />
}

export function MenuIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="menu" size={size} class={className} />
}

export function ArrowLeftIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="arrow-left" size={size} class={className} />
}

export function ArrowRightIcon({ size = 'md', class: className = '' }: Omit<IconProps, 'name'>) {
  return <Icon name="arrow-right" size={size} class={className} />
}
