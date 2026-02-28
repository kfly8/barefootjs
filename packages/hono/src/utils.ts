import { raw } from 'hono/html'

/**
 * Output HTML comment marker for conditional reconciliation.
 * Same signature as Go template bfComment function.
 */
export function bfComment(key: string) {
  return raw(`<!--bf-${key}-->`)
}

/**
 * Output comment markers for reactive text expressions.
 * Renders <!--bf:slotId--> (start) or <!--/bf:slotId--> (end).
 */
export function bfText(slotId: string, end?: boolean) {
  return raw(end ? `<!--/bf:${slotId}-->` : `<!--bf:${slotId}-->`)
}

