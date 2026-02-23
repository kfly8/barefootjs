/**
 * Adapter Conformance Test Suite — JSON Test Case Loader
 *
 * Reads JSON test case files from the cases/ directory and hydrates
 * computed fields (loc, filterPredicate.predicate, metadata defaults).
 */

import { readdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { parseExpression } from '@barefootjs/jsx'
import type { SourceLocation } from '@barefootjs/jsx'
import type { ConformanceTestCase } from './types'

const DEFAULT_LOC: SourceLocation = {
  file: 'test.tsx',
  start: { line: 1, column: 0 },
  end: { line: 1, column: 0 },
}

const CASES_DIR = join(import.meta.dir, '..', 'cases')

/**
 * Load all conformance test cases from the cases/ directory.
 */
export async function loadTestCases(): Promise<ConformanceTestCase[]> {
  const cases: ConformanceTestCase[] = []
  const categories = await readdir(CASES_DIR, { withFileTypes: true })

  for (const cat of categories) {
    if (!cat.isDirectory()) continue
    const categoryDir = join(CASES_DIR, cat.name)
    const files = await readdir(categoryDir)

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const filePath = join(categoryDir, file)
      const raw = await Bun.file(filePath).json()
      const id = `${cat.name}/${basename(file, '.json')}`

      const testCase: ConformanceTestCase = {
        ...raw,
        id,
        category: cat.name,
        input: hydrateInput(raw.input, raw.level),
      }
      cases.push(testCase)
    }
  }

  return cases.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Hydrate IR input: fill loc fields, parse filterPredicate, fill metadata defaults.
 */
function hydrateInput(input: Record<string, unknown>, level: string): Record<string, unknown> {
  if (level === 'generate') {
    return hydrateComponentIR(input)
  }
  return hydrateNode(input)
}

function hydrateNode(node: Record<string, unknown>): Record<string, unknown> {
  // Add default loc if missing
  if (!node.loc) {
    node.loc = DEFAULT_LOC
  }

  // Hydrate children recursively
  if (Array.isArray(node.children)) {
    node.children = node.children.map((child: Record<string, unknown>) => hydrateNode(child))
  }

  // Hydrate conditional branches
  if (node.whenTrue && typeof node.whenTrue === 'object') {
    node.whenTrue = hydrateNode(node.whenTrue as Record<string, unknown>)
  }
  if (node.whenFalse && typeof node.whenFalse === 'object') {
    node.whenFalse = hydrateNode(node.whenFalse as Record<string, unknown>)
  }

  // Hydrate attrs and events with loc
  if (Array.isArray(node.attrs)) {
    node.attrs = node.attrs.map((attr: Record<string, unknown>) => ({
      ...attr,
      loc: attr.loc || DEFAULT_LOC,
    }))
  }
  if (Array.isArray(node.events)) {
    node.events = node.events.map((evt: Record<string, unknown>) => ({
      ...evt,
      loc: evt.loc || DEFAULT_LOC,
    }))
  }
  if (Array.isArray(node.props)) {
    node.props = node.props.map((prop: Record<string, unknown>) => ({
      ...prop,
      loc: prop.loc || DEFAULT_LOC,
    }))
  }

  // Hydrate filterPredicate
  if (node.filterPredicate && typeof node.filterPredicate === 'object') {
    const fp = node.filterPredicate as Record<string, unknown>
    if (fp.raw && !fp.predicate && !fp.blockBody) {
      fp.predicate = parseExpression(fp.raw as string)
    }
  }

  return node
}

function hydrateComponentIR(ir: Record<string, unknown>): Record<string, unknown> {
  // Hydrate root node
  if (ir.root && typeof ir.root === 'object') {
    ir.root = hydrateNode(ir.root as Record<string, unknown>)
  }

  // Fill metadata defaults
  if (ir.metadata && typeof ir.metadata === 'object') {
    const meta = ir.metadata as Record<string, unknown>
    if (meta.isClientComponent === undefined) meta.isClientComponent = false
    if (meta.propsObjectName === undefined) meta.propsObjectName = null
    if (meta.onMounts === undefined) meta.onMounts = []
    if (meta.restPropsName === undefined) meta.restPropsName = null
    if (meta.clientAnalysis === undefined) meta.clientAnalysis = undefined

    // Add loc to signals, memos, effects
    for (const field of ['signals', 'memos', 'effects', 'onMounts', 'imports', 'localFunctions', 'localConstants']) {
      if (Array.isArray(meta[field])) {
        meta[field] = (meta[field] as Record<string, unknown>[]).map(item => ({
          ...item,
          loc: item.loc || DEFAULT_LOC,
        }))
      }
    }
  }

  // Fill errors default
  if (!ir.errors) {
    ir.errors = []
  }

  return ir
}
