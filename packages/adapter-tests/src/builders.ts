/**
 * Adapter Conformance Test Suite — IR Builder Utilities
 *
 * Provides concise builder functions for constructing IR nodes in tests.
 * Each builder supplies sensible defaults so tests only specify what matters.
 */

import type {
  ComponentIR, IRNode, IRElement, IRText, IRExpression,
  IRConditional, IRLoop, IRComponent, IRMetadata, IRProp,
  ParamInfo, TypeInfo, SourceLocation,
} from '@barefootjs/jsx'

type Attr = IRElement['attrs'][number]
type Event = IRElement['events'][number]
type Signal = IRMetadata['signals'][number]
type Memo = IRMetadata['memos'][number]

/** Default source location for test IR nodes */
export const testLoc: SourceLocation = {
  file: 'test.tsx',
  start: { line: 1, column: 0 },
  end: { line: 1, column: 0 },
}

// ---------------------------------------------------------------------------
// IR Node Builders
// ---------------------------------------------------------------------------

export function textNode(value: string): IRText {
  return { type: 'text', value, loc: testLoc }
}

export function nullExpr(): IRExpression {
  return expression('null')
}

export function expression(
  expr: string,
  opts: { reactive?: boolean; slotId?: string | null; clientOnly?: boolean } = {},
): IRExpression {
  return {
    type: 'expression',
    expr,
    typeInfo: null,
    reactive: opts.reactive ?? false,
    slotId: opts.slotId ?? null,
    loc: testLoc,
    ...(opts.clientOnly !== undefined ? { clientOnly: opts.clientOnly } : {}),
  }
}

export function element(
  tag: string,
  opts: {
    attrs?: Attr[]
    events?: Event[]
    children?: IRNode[]
    needsScope?: boolean
    slotId?: string | null
    ref?: string | null
  } = {},
): IRElement {
  return {
    type: 'element',
    tag,
    attrs: opts.attrs ?? [],
    events: opts.events ?? [],
    ref: opts.ref ?? null,
    children: opts.children ?? [],
    slotId: opts.slotId ?? null,
    needsScope: opts.needsScope ?? false,
    loc: testLoc,
  }
}

export function conditional(
  condition: string,
  whenTrue: IRNode,
  whenFalse?: IRNode | null,
  opts: { reactive?: boolean; slotId?: string | null; clientOnly?: boolean } = {},
): IRConditional {
  return {
    type: 'conditional',
    condition,
    conditionType: null,
    reactive: opts.reactive ?? false,
    whenTrue,
    whenFalse: whenFalse ?? nullExpr(),
    slotId: opts.slotId ?? null,
    loc: testLoc,
    ...(opts.clientOnly !== undefined ? { clientOnly: opts.clientOnly } : {}),
  }
}

export function loop(
  array: string,
  param: string,
  children: IRNode[],
  opts: {
    index?: string | null
    key?: string | null
    slotId?: string | null
    isStaticArray?: boolean
    filterPredicate?: IRLoop['filterPredicate']
    sortComparator?: IRLoop['sortComparator']
    chainOrder?: IRLoop['chainOrder']
  } = {},
): IRLoop {
  return {
    type: 'loop',
    array,
    arrayType: null,
    itemType: null,
    param,
    index: opts.index ?? null,
    key: opts.key ?? null,
    children,
    slotId: opts.slotId ?? null,
    isStaticArray: opts.isStaticArray ?? true,
    loc: testLoc,
    ...(opts.filterPredicate ? { filterPredicate: opts.filterPredicate } : {}),
    ...(opts.sortComparator ? { sortComparator: opts.sortComparator } : {}),
    ...(opts.chainOrder ? { chainOrder: opts.chainOrder } : {}),
  }
}

export function component(
  name: string,
  opts: {
    props?: IRProp[]
    children?: IRNode[]
    slotId?: string | null
    template?: string
  } = {},
): IRComponent {
  return {
    type: 'component',
    name,
    props: opts.props ?? [],
    propsType: null,
    children: opts.children ?? [],
    template: opts.template ?? '',
    slotId: opts.slotId ?? null,
    loc: testLoc,
  }
}

// ---------------------------------------------------------------------------
// Field Helpers
// ---------------------------------------------------------------------------

export function attr(
  name: string,
  value: string,
  opts: { dynamic?: boolean; isLiteral?: boolean } = {},
): Attr {
  return {
    name,
    value,
    dynamic: opts.dynamic ?? false,
    isLiteral: opts.isLiteral ?? true,
    loc: testLoc,
  }
}

export function prop(
  name: string,
  value: string,
  opts: { dynamic?: boolean; isLiteral?: boolean } = {},
): IRProp {
  return {
    name,
    value,
    dynamic: opts.dynamic ?? false,
    isLiteral: opts.isLiteral ?? true,
    loc: testLoc,
  }
}

export function signal(
  getter: string,
  setter: string,
  initialValue: string,
  type?: TypeInfo,
): Signal {
  return {
    getter,
    setter,
    initialValue,
    type: type ?? { kind: 'primitive', raw: 'number', primitive: 'number' },
    loc: testLoc,
  }
}

export function memo(
  name: string,
  computation: string,
  deps: string[],
  type?: TypeInfo,
): Memo {
  return {
    name,
    computation,
    deps,
    type: type ?? { kind: 'primitive', raw: 'number', primitive: 'number' },
    loc: testLoc,
  }
}

export function param(
  name: string,
  type: TypeInfo,
  opts: { optional?: boolean; defaultValue?: string } = {},
): ParamInfo {
  return {
    name,
    type,
    optional: opts.optional ?? false,
    ...(opts.defaultValue !== undefined ? { defaultValue: opts.defaultValue } : {}),
  }
}

// ---------------------------------------------------------------------------
// ComponentIR Builder
// ---------------------------------------------------------------------------

export function componentIR(
  name: string,
  root: IRNode,
  metadata?: Partial<Omit<IRMetadata, 'componentName'>>,
): ComponentIR {
  return {
    version: '0.1',
    metadata: {
      componentName: name,
      hasDefaultExport: false,
      isClientComponent: false,
      typeDefinitions: [],
      propsType: null,
      propsParams: [],
      propsObjectName: null,
      restPropsName: null,
      signals: [],
      memos: [],
      effects: [],
      onMounts: [],
      imports: [],
      localFunctions: [],
      localConstants: [],
      ...metadata,
    },
    root,
    errors: [],
  }
}
