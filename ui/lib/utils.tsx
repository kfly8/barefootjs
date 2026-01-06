import { clsx, type ClassValue } from 'clsx'

/**
 * Merges class names using clsx
 * Compatible with shadcn/ui cn function (without tailwind-merge)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
