import type { LabelHTMLAttributes } from '@barefootjs/jsx'
import type { Child } from '../../types'

const labelClasses = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'

/**
 * Props for the Label component.
 */
interface LabelProps extends LabelHTMLAttributes {
  /**
   * Additional CSS class names.
   */
  className?: string
  /**
   * Content displayed inside the label.
   */
  children?: Child
}

/**
 * Renders an accessible label element for form controls.
 */
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
