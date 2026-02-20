/** The direction the separator is rendered in. */
type SeparatorOrientation = 'horizontal' | 'vertical'

const baseClasses = 'bg-border shrink-0'

const orientationClasses: Record<SeparatorOrientation, string> = {
  horizontal: 'h-px w-full',
  vertical: 'w-px self-stretch',
}

/** Props for the Separator component. */
interface SeparatorProps {
  /** The separator orientation. */
  orientation?: SeparatorOrientation
  /** Whether the separator is purely decorative. */
  decorative?: boolean
  /** Additional CSS classes applied to the separator. */
  className?: string
}

/** Renders a horizontal or vertical separator line. */
function Separator({
  orientation = 'horizontal',
  decorative = true,
  className = '',
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={`${baseClasses} ${orientationClasses[orientation]} ${className}`}
    />
  )
}

export { Separator }
export type { SeparatorOrientation, SeparatorProps }
