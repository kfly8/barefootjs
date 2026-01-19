import { raw } from 'hono/html'

/**
 * Output HTML comment marker for conditional reconciliation.
 * Same signature as Go template bfComment function.
 */
export function bfComment(key: string) {
  return raw(`<!--bf-${key}-->`)
}
