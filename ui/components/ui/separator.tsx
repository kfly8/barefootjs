type SeparatorOrientation = 'horizontal' | 'vertical'

const baseClasses = 'bg-border shrink-0'

const orientationClasses: Record<SeparatorOrientation, string> = {
  horizontal: 'h-px w-full',
  vertical: 'w-px self-stretch',
}

interface SeparatorProps {
  orientation?: SeparatorOrientation
  decorative?: boolean
  className?: string
}

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
