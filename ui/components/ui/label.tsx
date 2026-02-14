import type { LabelHTMLAttributes } from '@barefootjs/jsx'
import type { Child } from '../../types'

const labelClasses = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'

interface LabelProps extends LabelHTMLAttributes {
  className?: string
  children?: Child
}

function Label({
  className = '',
  children,
  ...props
}: LabelProps) {
  return (
    <label
      data-slot="label"
      className={`${labelClasses} ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

export { Label }
export type { LabelProps }
