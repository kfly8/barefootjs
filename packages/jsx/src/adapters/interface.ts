/**
 * BarefootJS Compiler - Template Adapter Interface
 *
 * Defines the interface for language-specific template adapters.
 */

import type {
  ComponentIR,
  IRNode,
  IRElement,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
} from '../types'

/**
 * Check if a reactive expression at index i in children needs a closing
 * comment marker to prevent the browser from merging the expression's
 * text node with the following static text node.
 */
export function needsTextEndMarker(children: IRNode[], i: number): boolean {
  const child = children[i]
  if (child.type !== 'expression' || !child.slotId) return false
  const next = children[i + 1]
  return next?.type === 'text'
}

export interface AdapterOutput {
  template: string
  types?: string // Generated types (for typed languages)
  extension: string
}

export interface AdapterGenerateOptions {
  /** Skip script registration (for child components bundled in parent's .client.js) */
  skipScriptRegistration?: boolean
  /** Base name for script registration (for non-default exports sharing parent's .client.js) */
  scriptBaseName?: string
}

export interface TemplateAdapter {
  name: string
  extension: string

  // Main entry point - generates complete template from IR
  generate(ir: ComponentIR, options?: AdapterGenerateOptions): AdapterOutput

  // Node rendering
  renderNode(node: IRNode): string
  renderElement(element: IRElement): string
  renderExpression(expr: IRExpression): string
  renderConditional(cond: IRConditional): string
  renderLoop(loop: IRLoop): string
  renderComponent(comp: IRComponent): string

  // Hydration markers
  renderScopeMarker(instanceIdExpr: string): string
  renderSlotMarker(slotId: string): string
  renderCondMarker(condId: string): string

  // Type generation (for typed languages)
  generateTypes?(ir: ComponentIR): string | null
}

// Base class with common functionality
export abstract class BaseAdapter implements TemplateAdapter {
  abstract name: string
  abstract extension: string

  abstract generate(ir: ComponentIR, options?: AdapterGenerateOptions): AdapterOutput
  abstract renderNode(node: IRNode): string
  abstract renderElement(element: IRElement): string
  abstract renderExpression(expr: IRExpression): string
  abstract renderConditional(cond: IRConditional): string
  abstract renderLoop(loop: IRLoop): string
  abstract renderComponent(comp: IRComponent): string
  abstract renderScopeMarker(instanceIdExpr: string): string
  abstract renderSlotMarker(slotId: string): string
  abstract renderCondMarker(condId: string): string
  abstract renderTextEndMarker(slotId: string): string

  renderChildren(children: IRNode[]): string {
    return children.map((child, i) => {
      const rendered = this.renderNode(child)
      if (needsTextEndMarker(children, i)) {
        return rendered + this.renderTextEndMarker((child as IRExpression).slotId!)
      }
      return rendered
    }).join('')
  }
}
