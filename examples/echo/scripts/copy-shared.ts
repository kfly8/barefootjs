/**
 * Copy ../shared/{styles,scripts} into ./dist/shared/ so the Go server and
 * the container image can serve them from a single root (dist/) under the
 * same URL path in dev and in production.
 */

import { cp, mkdir, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

async function mirror(srcRel: string, destRel: string) {
  const src = join(ROOT, srcRel)
  const dest = join(ROOT, destRel)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dirname(dest), { recursive: true })
  await cp(src, dest, { recursive: true })
  console.log(`Copied ${src} → ${destRel}`)
}

await mirror('../shared/styles', 'dist/shared/styles')
await mirror('../shared/scripts', 'dist/shared/scripts')
