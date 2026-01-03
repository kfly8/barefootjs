/**
 * BarefootJS JSX Compiler - ID Generator
 *
 * Manages slot ID generation with a single sequential counter.
 * Slot IDs are simple numbers (0, 1, 2...) for reliable hydration.
 */

export class IdGenerator {
  private slotCounter = 0

  /**
   * Resets counter
   */
  reset(): void {
    this.slotCounter = 0
  }

  /**
   * Generates next slot ID
   * Returns string for compatibility with existing code
   */
  generateSlotId(): string {
    return String(this.slotCounter++)
  }

  /**
   * Gets the current counter value (for registry generation)
   */
  getCurrentCount(): number {
    return this.slotCounter
  }
}
