/**
 * BarefootJS Compiler v2 - Template Adapter Interface
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

export interface AdapterOutput {
  template: string
  types?: string // Generated types (for typed languages)
  extension: string
}

export interface TemplateAdapter {
  name: string
  extension: string

  // Main entry point - generates complete template from IR
  generate(ir: ComponentIR): AdapterOutput

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

  abstract generate(ir: ComponentIR): AdapterOutput
  abstract renderNode(node: IRNode): string
  abstract renderElement(element: IRElement): string
  abstract renderExpression(expr: IRExpression): string
  abstract renderConditional(cond: IRConditional): string
  abstract renderLoop(loop: IRLoop): string
  abstract renderComponent(comp: IRComponent): string
  abstract renderScopeMarker(instanceIdExpr: string): string
  abstract renderSlotMarker(slotId: string): string
  abstract renderCondMarker(condId: string): string

  renderChildren(children: IRNode[]): string {
    return children.map((child) => this.renderNode(child)).join('')
  }
}
