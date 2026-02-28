import { raw } from 'hono/html'

/**
 * Output HTML comment marker for conditional reconciliation.
 * Same signature as Go template bfComment function.
 */
export function bfComment(key: string) {
  return raw(`<!--bf-${key}-->`)
}

/**
 * Output comment marker for reactive text expressions.
 * Renders <!--bf:slotId-->
 */
export function bfText(slotId: string) {
  return raw(`<!--bf:${slotId}-->`)
}

