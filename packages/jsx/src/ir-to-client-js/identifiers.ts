/**
 * Used identifier extraction and keyword filtering.
 */

import type { ClientJsContext } from './types'

/**
 * Collect local function names used as event handlers
 */
export function collectUsedFunctions(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      // Check if the handler is a simple identifier (local function)
      // vs an inline function or prop reference
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(event.handler)) {
        used.add(event.handler)
      }
    }
  }

  return used
}

/**
 * Collect all identifiers used in client-side reactive code.
 * This includes identifiers in:
 * - Event handlers
 * - Dynamic expressions
 * - Conditionals (condition and html templates)
 * - Loops
 */
export function collectUsedIdentifiers(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  // From event handlers
  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      extractIdentifiers(event.handler, used)
    }
  }

  // From dynamic expressions
  for (const elem of ctx.dynamicElements) {
    extractIdentifiers(elem.expression, used)
  }

  // From conditionals - condition and html templates
  for (const elem of ctx.conditionalElements) {
    extractIdentifiers(elem.condition, used)
    // Extract identifiers from template expressions like ${fullCommand}
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
  }

  // From client-only conditionals - same as regular conditionals
  for (const elem of ctx.clientOnlyConditionals) {
    extractIdentifiers(elem.condition, used)
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
    // Also extract from event handlers in branches
    for (const event of elem.whenTrueEvents) {
      extractIdentifiers(event.handler, used)
    }
    for (const event of elem.whenFalseEvents) {
      extractIdentifiers(event.handler, used)
    }
  }

  // From loops
  for (const elem of ctx.loopElements) {
    extractIdentifiers(elem.array, used)
    extractTemplateIdentifiers(elem.template, used)
    // Extract identifiers from child element event handlers
    for (const handler of elem.childEventHandlers) {
      extractIdentifiers(handler, used)
    }
  }

  // From signal initial values
  for (const signal of ctx.signals) {
    extractIdentifiers(signal.initialValue, used)
  }

  // From memo computations
  for (const memo of ctx.memos) {
    extractIdentifiers(memo.computation, used)
  }

  // From effect bodies
  for (const effect of ctx.effects) {
    extractIdentifiers(effect.body, used)
  }

  // From onMount bodies
  for (const onMount of ctx.onMounts) {
    extractIdentifiers(onMount.body, used)
  }

  // From ref callbacks
  for (const elem of ctx.refElements) {
    extractIdentifiers(elem.callback, used)
  }

  // From conditional branch refs
  for (const elem of ctx.conditionalElements) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  // From client-only conditional branch refs
  for (const elem of ctx.clientOnlyConditionals) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  // From local function bodies (to find prop references like onAdd)
  for (const fn of ctx.localFunctions) {
    extractIdentifiers(fn.body, used)
  }

  // From local constants (including arrow functions like handleAdd)
  // Arrow functions in const declarations may reference props
  for (const constant of ctx.localConstants) {
    extractIdentifiers(constant.value, used)
  }

  // From child component props (e.g., initChild('Icon', scope, { className: () => iconClasses }))
  for (const child of ctx.childInits) {
    extractIdentifiers(child.propsExpr, used)
  }

  // From reactive attributes (attributes that depend on props/signals/memos)
  for (const attr of ctx.reactiveAttrs) {
    extractIdentifiers(attr.expression, used)
  }

  return used
}

/**
 * Extract identifiers from an expression string.
 */
export function extractIdentifiers(expr: string, set: Set<string>): void {
  // Match word boundaries for identifiers
  const matches = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)
  if (matches) {
    for (const id of matches) {
      // Skip keywords and common globals
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
  // Match template expressions like ${expr}
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
  const skip = new Set([
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
  return skip.has(id)
}
