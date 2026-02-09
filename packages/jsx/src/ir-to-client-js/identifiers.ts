/**
 * Used identifier extraction and keyword filtering.
 */

import type { ClientJsContext } from './types'

/** JavaScript keywords and common globals to skip during identifier extraction. */
const KEYWORDS_AND_GLOBALS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'this',
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'new',
  'typeof',
  'instanceof',
  'void',
  'delete',
  'console',
  'window',
  'document',
  'Math',
  'String',
  'Number',
  'Array',
  'Object',
  'Boolean',
  'Date',
  'JSON',
  'Promise',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
])

/**
 * Collect local function names used as event handlers.
 */
export function collectUsedFunctions(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(event.handler)) {
        used.add(event.handler)
      }
    }
  }

  return used
}

/**
 * Collect all identifiers used in client-side reactive code.
 * This includes identifiers in event handlers, dynamic expressions,
 * conditionals, loops, signals, memos, effects, refs, and constants.
 */
export function collectUsedIdentifiers(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      extractIdentifiers(event.handler, used)
    }
  }

  for (const elem of ctx.dynamicElements) {
    extractIdentifiers(elem.expression, used)
  }

  for (const elem of ctx.conditionalElements) {
    extractIdentifiers(elem.condition, used)
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
  }

  for (const elem of ctx.clientOnlyConditionals) {
    extractIdentifiers(elem.condition, used)
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
    for (const event of elem.whenTrueEvents) {
      extractIdentifiers(event.handler, used)
    }
    for (const event of elem.whenFalseEvents) {
      extractIdentifiers(event.handler, used)
    }
  }

  for (const elem of ctx.loopElements) {
    extractIdentifiers(elem.array, used)
    extractTemplateIdentifiers(elem.template, used)
    for (const handler of elem.childEventHandlers) {
      extractIdentifiers(handler, used)
    }
  }

  for (const signal of ctx.signals) {
    extractIdentifiers(signal.initialValue, used)
  }

  for (const memo of ctx.memos) {
    extractIdentifiers(memo.computation, used)
  }

  for (const effect of ctx.effects) {
    extractIdentifiers(effect.body, used)
  }

  for (const onMount of ctx.onMounts) {
    extractIdentifiers(onMount.body, used)
  }

  for (const elem of ctx.refElements) {
    extractIdentifiers(elem.callback, used)
  }

  for (const elem of ctx.conditionalElements) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  for (const elem of ctx.clientOnlyConditionals) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  for (const fn of ctx.localFunctions) {
    extractIdentifiers(fn.body, used)
  }

  for (const constant of ctx.localConstants) {
    extractIdentifiers(constant.value, used)
  }

  for (const child of ctx.childInits) {
    extractIdentifiers(child.propsExpr, used)
  }

  for (const attr of ctx.reactiveAttrs) {
    extractIdentifiers(attr.expression, used)
  }

  return used
}

/**
 * Extract identifiers from an expression string.
 */
export function extractIdentifiers(expr: string, set: Set<string>): void {
  const matches = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)
  if (matches) {
    for (const id of matches) {
      if (!isKeywordOrGlobal(id)) {
        set.add(id)
      }
    }
  }
}

/**
 * Extract identifiers from template literal expressions.
 * Finds ${...} patterns and extracts identifiers from inside.
 */
export function extractTemplateIdentifiers(template: string, set: Set<string>): void {
  const templatePattern = /\$\{([^}]+)\}/g
  let match
  while ((match = templatePattern.exec(template)) !== null) {
    extractIdentifiers(match[1], set)
  }
}

/**
 * Check if an identifier is a JavaScript keyword or common global.
 */
export function isKeywordOrGlobal(id: string): boolean {
  return KEYWORDS_AND_GLOBALS.has(id)
}
