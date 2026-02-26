/**
 * Aspect Ratio Component
 *
 * Displays content within a desired width-to-height ratio.
 * Uses CSS aspect-ratio property for layout.
 *
 * @example Basic usage
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="/photo.jpg" className="object-cover w-full h-full" />
 * </AspectRatio>
 * ```
 */

import type { HTMLBaseAttributes } from '@barefootjs/jsx'
import type { Child } from '../../../types'

interface AspectRatioProps extends HTMLBaseAttributes {
  /** Width-to-height ratio (e.g. 16/9, 4/3, 1) */
  ratio?: number
  /** Content to display within the aspect ratio container */
  children?: Child
}

function AspectRatio({ ratio = 1, children, className = '', ...props }: AspectRatioProps) {
  return (
    <div
      data-slot="aspect-ratio"
      className={`relative w-full ${className}`}
      style={`position:relative;aspect-ratio:${ratio}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { AspectRatio }
export type { AspectRatioProps }
