/**
 * BarefootJS JSX Compiler - ID Generator
 *
 * Manages element ID generation.
 * Eliminates global state and enables per-compilation ID management.
 */

export class IdGenerator {
  private buttonIdCounter = 0
  private dynamicIdCounter = 0
  private listIdCounter = 0
  private attrIdCounter = 0

  /**
   * Resets counters
   */
  reset(): void {
    this.buttonIdCounter = 0
    this.dynamicIdCounter = 0
    this.listIdCounter = 0
    this.attrIdCounter = 0
  }

  /**
   * Generates ID for button/interactive elements
   */
  generateButtonId(): string {
    return `__b${this.buttonIdCounter++}`
  }

  /**
   * Generates ID for dynamic content elements
   */
  generateDynamicId(): string {
    return `__d${this.dynamicIdCounter++}`
  }

  /**
   * Generates ID for list elements
   */
  generateListId(): string {
    return `__l${this.listIdCounter++}`
  }

  /**
   * Generates ID for elements with dynamic attributes
   */
  generateAttrId(): string {
    return `__a${this.attrIdCounter++}`
  }
}
