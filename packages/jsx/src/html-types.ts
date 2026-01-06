/**
 * BarefootJS HTML Type Definitions
 *
 * Framework-agnostic HTML element attribute types for JSX components.
 * These types provide proper typing for HTML attributes and event handlers.
 *
 * Note: These types are designed to be compatible with Hono's JSX types.
 */

// ============================================================================
// Event Types
// ============================================================================

/**
 * Targeted event with properly typed target element
 */
export type TargetedEvent<
  Target extends EventTarget,
  E extends Event = Event
> = Omit<E, 'target'> & {
  readonly target: Target
}

export type TargetedInputEvent<Target extends EventTarget> = TargetedEvent<Target, InputEvent>
export type TargetedFocusEvent<Target extends EventTarget> = TargetedEvent<Target, FocusEvent>
export type TargetedKeyboardEvent<Target extends EventTarget> = TargetedEvent<Target, KeyboardEvent>
export type TargetedMouseEvent<Target extends EventTarget> = TargetedEvent<Target, MouseEvent>

// ============================================================================
// Event Handler Types
// ============================================================================

export type InputEventHandler<T extends EventTarget = HTMLInputElement> =
  (event: TargetedInputEvent<T>) => void
export type FocusEventHandler<T extends EventTarget = HTMLElement> =
  (event: TargetedFocusEvent<T>) => void
export type KeyboardEventHandler<T extends EventTarget = HTMLElement> =
  (event: TargetedKeyboardEvent<T>) => void
export type MouseEventHandler<T extends EventTarget = HTMLElement> =
  (event: TargetedMouseEvent<T>) => void
export type ChangeEventHandler<T extends EventTarget = HTMLElement> =
  (event: TargetedEvent<T>) => void

// ============================================================================
// Base Event Attributes
// ============================================================================

export interface BaseEventAttributes {
  onScroll?: (event: Event) => void
  onWheel?: (event: WheelEvent) => void
  onAnimationStart?: (event: AnimationEvent) => void
  onAnimationEnd?: (event: AnimationEvent) => void
  onAnimationIteration?: (event: AnimationEvent) => void
  onTransitionEnd?: (event: TransitionEvent) => void
  onCopy?: (event: ClipboardEvent) => void
  onCut?: (event: ClipboardEvent) => void
  onPaste?: (event: ClipboardEvent) => void
  onCompositionStart?: (event: CompositionEvent) => void
  onCompositionEnd?: (event: CompositionEvent) => void
  onCompositionUpdate?: (event: CompositionEvent) => void
  onDrag?: (event: DragEvent) => void
  onDragEnd?: (event: DragEvent) => void
  onDragEnter?: (event: DragEvent) => void
  onDragExit?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDragStart?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  onSubmit?: (event: SubmitEvent) => void
  onReset?: (event: Event) => void
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
}

// ============================================================================
// HTML Base Attributes
// ============================================================================

export interface HTMLBaseAttributes extends BaseEventAttributes {
  // Core attributes
  id?: string
  class?: string | Promise<string>
  style?: string | Record<string, string | number>
  title?: string
  tabindex?: number
  hidden?: boolean
  draggable?: boolean
  contenteditable?: boolean | 'inherit' | 'plaintext-only'
  spellcheck?: boolean
  accesskey?: string
  dir?: 'ltr' | 'rtl' | 'auto'
  lang?: string
  slot?: string

  // Data attributes
  [key: `data-${string}`]: string | number | boolean | undefined

  // ARIA attributes
  role?: string
  [key: `aria-${string}`]: string | number | boolean | undefined

  // JSX special
  dangerouslySetInnerHTML?: { __html: string }
  children?: unknown
  key?: string | number | bigint | null

  // Allow any other attributes
  [key: string]: unknown
}

// ============================================================================
// Form Attribute Helper Types (for Hono compatibility)
// ============================================================================

export type HTMLAttributeFormEnctype =
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain'

export type HTMLAttributeFormMethod = 'get' | 'post' | 'dialog'

export type HTMLAttributeAnchorTarget =
  | '_self'
  | '_blank'
  | '_parent'
  | '_top'
  | string

// ============================================================================
// Button Element Attributes
// ============================================================================

export interface ButtonHTMLAttributes extends HTMLBaseAttributes {
  autofocus?: boolean
  disabled?: boolean
  form?: string
  formaction?: string
  formenctype?: HTMLAttributeFormEnctype
  formmethod?: HTMLAttributeFormMethod
  formnovalidate?: boolean
  formtarget?: HTMLAttributeAnchorTarget
  name?: string
  type?: 'submit' | 'reset' | 'button'
  value?: string

  // Event handlers - using native DOM event types for Hono JSX compatibility
  // Users can still use typed handlers like MouseEventHandler<HTMLButtonElement>
  // since they're subtypes of these
  onClick?: (event: MouseEvent) => void
  onBlur?: (event: FocusEvent) => void
  onFocus?: (event: FocusEvent) => void
}

// ============================================================================
// Input Element Attributes
// ============================================================================

export interface InputHTMLAttributes extends HTMLBaseAttributes {
  accept?: string
  alt?: string
  autocomplete?: string
  autofocus?: boolean
  capture?: boolean | 'user' | 'environment'
  checked?: boolean
  disabled?: boolean
  form?: string
  formaction?: string
  formenctype?: HTMLAttributeFormEnctype
  formmethod?: HTMLAttributeFormMethod
  formnovalidate?: boolean
  formtarget?: HTMLAttributeAnchorTarget
  height?: number | string
  list?: string
  max?: number | string
  maxlength?: number
  min?: number | string
  minlength?: number
  multiple?: boolean
  name?: string
  pattern?: string
  placeholder?: string
  readonly?: boolean
  required?: boolean
  size?: number
  src?: string
  step?: number | string
  type?: string
  value?: string | ReadonlyArray<string> | number
  width?: number | string

  // Event handlers - using native DOM event types for Hono JSX compatibility
  onInput?: (event: InputEvent) => void
  onChange?: (event: Event) => void
  onBlur?: (event: FocusEvent) => void
  onFocus?: (event: FocusEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onKeyPress?: (event: KeyboardEvent) => void
}

// ============================================================================
// Textarea Element Attributes
// ============================================================================

export interface TextareaHTMLAttributes extends HTMLBaseAttributes {
  autocomplete?: string
  autofocus?: boolean
  cols?: number
  disabled?: boolean
  form?: string
  maxlength?: number
  minlength?: number
  name?: string
  placeholder?: string
  readonly?: boolean
  required?: boolean
  rows?: number
  value?: string
  wrap?: 'hard' | 'soft' | 'off'

  // Event handlers - using native DOM event types for Hono JSX compatibility
  onInput?: (event: InputEvent) => void
  onChange?: (event: Event) => void
  onBlur?: (event: FocusEvent) => void
  onFocus?: (event: FocusEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onKeyPress?: (event: KeyboardEvent) => void
}

// ============================================================================
// Select Element Attributes
// ============================================================================

export interface SelectHTMLAttributes extends HTMLBaseAttributes {
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  form?: string
  multiple?: boolean
  name?: string
  required?: boolean
  size?: number
  value?: string | ReadonlyArray<string>

  // Event handlers - using native DOM event types for Hono JSX compatibility
  onChange?: (event: Event) => void
  onBlur?: (event: FocusEvent) => void
  onFocus?: (event: FocusEvent) => void
}

// ============================================================================
// Form Element Attributes
// ============================================================================

export interface FormHTMLAttributes extends HTMLBaseAttributes {
  acceptCharset?: string
  action?: string | Function
  autocomplete?: 'on' | 'off'
  encoding?: string
  enctype?: string
  method?: 'get' | 'post' | 'dialog'
  name?: string
  novalidate?: boolean
  target?: string
}

// ============================================================================
// Anchor Element Attributes
// ============================================================================

export interface AnchorHTMLAttributes extends HTMLBaseAttributes {
  download?: string | boolean
  href?: string
  hreflang?: string
  media?: string
  ping?: string
  rel?: string
  target?: '_self' | '_blank' | '_parent' | '_top' | string
  type?: string
  referrerpolicy?: string

  onClick?: MouseEventHandler<HTMLAnchorElement>
}

// ============================================================================
// Image Element Attributes
// ============================================================================

export interface ImgHTMLAttributes extends HTMLBaseAttributes {
  alt?: string
  crossorigin?: 'anonymous' | 'use-credentials' | ''
  decoding?: 'async' | 'auto' | 'sync'
  height?: number | string
  loading?: 'eager' | 'lazy'
  referrerpolicy?: string
  sizes?: string
  src?: string
  srcset?: string
  usemap?: string
  width?: number | string
}

// ============================================================================
// Label Element Attributes
// ============================================================================

export interface LabelHTMLAttributes extends HTMLBaseAttributes {
  for?: string
  form?: string
}

// ============================================================================
// Option Element Attributes
// ============================================================================

export interface OptionHTMLAttributes extends HTMLBaseAttributes {
  disabled?: boolean
  label?: string
  selected?: boolean
  value?: string | ReadonlyArray<string> | number
}
