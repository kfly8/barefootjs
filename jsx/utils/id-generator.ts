/**
 * BarefootJS JSX Compiler - ID Generator
 *
 * 要素ID生成を管理するクラス。
 * グローバル状態を排除し、コンパイル単位でのID管理を可能にする。
 */

export class IdGenerator {
  private buttonIdCounter = 0
  private dynamicIdCounter = 0
  private listIdCounter = 0
  private attrIdCounter = 0

  /**
   * カウンターをリセット
   */
  reset(): void {
    this.buttonIdCounter = 0
    this.dynamicIdCounter = 0
    this.listIdCounter = 0
    this.attrIdCounter = 0
  }

  /**
   * ボタン/インタラクティブ要素用のIDを生成
   */
  generateButtonId(): string {
    return `__b${this.buttonIdCounter++}`
  }

  /**
   * 動的コンテンツ要素用のIDを生成
   */
  generateDynamicId(): string {
    return `__d${this.dynamicIdCounter++}`
  }

  /**
   * リスト要素用のIDを生成
   */
  generateListId(): string {
    return `__l${this.listIdCounter++}`
  }

  /**
   * 動的属性を持つ要素用のIDを生成
   */
  generateAttrId(): string {
    return `__a${this.attrIdCounter++}`
  }
}
