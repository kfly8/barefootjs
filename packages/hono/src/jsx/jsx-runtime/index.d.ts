/**
 * BarefootJS Hono JSX Extension - Type Definitions
 *
 * Extends Hono's JSX types to provide properly typed event handlers
 * for interactive elements. Hono's JSX is designed for SSR, so event
 * types are weak. This module strengthens them for client-side use.
 *
 * Usage in tsconfig.json:
 *   "jsxImportSource": "@barefootjs/dom/hono-jsx"
 */

export { jsx, jsxs, Fragment } from 'hono/jsx/jsx-runtime'

// Targeted event types with proper target typing
type TargetedEvent<Target extends EventTarget, E extends Event = Event> = Omit<E, 'target'> & {
  readonly target: Target
}

type TargetedInputEvent<Target extends EventTarget> = TargetedEvent<Target, InputEvent>
type TargetedFocusEvent<Target extends EventTarget> = TargetedEvent<Target, FocusEvent>
type TargetedKeyboardEvent<Target extends EventTarget> = TargetedEvent<Target, KeyboardEvent>
type TargetedMouseEvent<Target extends EventTarget> = TargetedEvent<Target, MouseEvent>

// Event handler types
type InputEventHandler<T extends EventTarget = HTMLInputElement> = (event: TargetedInputEvent<T>) => void
type FocusEventHandler<T extends EventTarget = HTMLElement> = (event: TargetedFocusEvent<T>) => void
type KeyboardEventHandler<T extends EventTarget = HTMLElement> = (event: TargetedKeyboardEvent<T>) => void
type MouseEventHandler<T extends EventTarget = HTMLElement> = (event: TargetedMouseEvent<T>) => void
type ChangeEventHandler<T extends EventTarget = HTMLElement> = (event: TargetedEvent<T>) => void

// Base event attributes (from Hono, but with weaker types for non-input elements)
interface BaseEventAttributes {
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

// HTML attributes base
interface HTMLBaseAttributes extends BaseEventAttributes {
  // Core attributes
  id?: string
  class?: string | Promise<string>
  style?: string | Record<string, string | number>
  title?: string
  tabindex?: number | string
  hidden?: boolean
  draggable?: boolean | 'true' | 'false'
  contenteditable?: boolean | 'true' | 'false' | 'inherit' | 'plaintext-only'
  spellcheck?: boolean | 'true' | 'false'
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
  children?: any
  key?: string | number | bigint | null

  // Allow any other attributes
  [key: string]: any
}

// Input element specific attributes with proper event typing
interface InputHTMLAttributes extends HTMLBaseAttributes {
  // Input specific attributes
  accept?: string
  alt?: string
  autocomplete?: string
  autofocus?: boolean
  capture?: boolean | 'user' | 'environment'
  checked?: boolean
  disabled?: boolean
  form?: string
  formaction?: string
  formenctype?: string
  formmethod?: string
  formnovalidate?: boolean
  formtarget?: string
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

  // Properly typed event handlers for input
  onInput?: InputEventHandler<HTMLInputElement>
  onChange?: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  onFocus?: FocusEventHandler<HTMLInputElement>
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  onKeyUp?: KeyboardEventHandler<HTMLInputElement>
  onKeyPress?: KeyboardEventHandler<HTMLInputElement>
}

// Textarea element specific attributes
interface TextareaHTMLAttributes extends HTMLBaseAttributes {
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

  // Properly typed event handlers for textarea
  onInput?: InputEventHandler<HTMLTextAreaElement>
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onFocus?: FocusEventHandler<HTMLTextAreaElement>
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>
  onKeyPress?: KeyboardEventHandler<HTMLTextAreaElement>
}

// Select element specific attributes
interface SelectHTMLAttributes extends HTMLBaseAttributes {
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  form?: string
  multiple?: boolean
  name?: string
  required?: boolean
  size?: number
  value?: string | ReadonlyArray<string>

  // Properly typed event handlers for select
  onChange?: ChangeEventHandler<HTMLSelectElement>
  onBlur?: FocusEventHandler<HTMLSelectElement>
  onFocus?: FocusEventHandler<HTMLSelectElement>
}

// Button element specific attributes
interface ButtonHTMLAttributes extends HTMLBaseAttributes {
  autofocus?: boolean
  disabled?: boolean
  form?: string
  formaction?: string
  formenctype?: string
  formmethod?: string
  formnovalidate?: boolean
  formtarget?: string
  name?: string
  type?: 'submit' | 'reset' | 'button'
  value?: string

  // Properly typed event handlers for button
  onClick?: MouseEventHandler<HTMLButtonElement>
  onBlur?: FocusEventHandler<HTMLButtonElement>
  onFocus?: FocusEventHandler<HTMLButtonElement>
}

// Form element attributes
interface FormHTMLAttributes extends HTMLBaseAttributes {
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

// Anchor element attributes
interface AnchorHTMLAttributes extends HTMLBaseAttributes {
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

// Image element attributes
interface ImgHTMLAttributes extends HTMLBaseAttributes {
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

// Label element attributes
interface LabelHTMLAttributes extends HTMLBaseAttributes {
  for?: string
  form?: string
}

// Option element attributes
interface OptionHTMLAttributes extends HTMLBaseAttributes {
  disabled?: boolean
  label?: string
  selected?: boolean
  value?: string | ReadonlyArray<string> | number
}

// Re-export JSX namespace with proper types
export declare namespace JSX {
  type Element = import('hono/jsx').JSX.Element

  interface ElementChildrenAttribute {
    children: {}
  }

  interface IntrinsicAttributes {
    key?: string | number | bigint | null | undefined
  }

  interface IntrinsicElements {
    // Form elements with properly typed events
    input: InputHTMLAttributes
    textarea: TextareaHTMLAttributes
    select: SelectHTMLAttributes
    button: ButtonHTMLAttributes
    form: FormHTMLAttributes
    label: LabelHTMLAttributes
    option: OptionHTMLAttributes
    optgroup: HTMLBaseAttributes & { disabled?: boolean; label?: string }

    // Interactive elements
    a: AnchorHTMLAttributes

    // Media elements
    img: ImgHTMLAttributes
    video: HTMLBaseAttributes & { src?: string; controls?: boolean; autoplay?: boolean; loop?: boolean; muted?: boolean; poster?: string; width?: number | string; height?: number | string }
    audio: HTMLBaseAttributes & { src?: string; controls?: boolean; autoplay?: boolean; loop?: boolean; muted?: boolean }
    source: HTMLBaseAttributes & { src?: string; type?: string; media?: string }
    track: HTMLBaseAttributes & { default?: boolean; kind?: string; label?: string; src?: string; srclang?: string }

    // Container elements
    div: HTMLBaseAttributes
    span: HTMLBaseAttributes
    p: HTMLBaseAttributes
    section: HTMLBaseAttributes
    article: HTMLBaseAttributes
    aside: HTMLBaseAttributes
    header: HTMLBaseAttributes
    footer: HTMLBaseAttributes
    main: HTMLBaseAttributes
    nav: HTMLBaseAttributes

    // Heading elements
    h1: HTMLBaseAttributes
    h2: HTMLBaseAttributes
    h3: HTMLBaseAttributes
    h4: HTMLBaseAttributes
    h5: HTMLBaseAttributes
    h6: HTMLBaseAttributes

    // List elements
    ul: HTMLBaseAttributes
    ol: HTMLBaseAttributes & { start?: number; type?: '1' | 'a' | 'A' | 'i' | 'I'; reversed?: boolean }
    li: HTMLBaseAttributes & { value?: number }
    dl: HTMLBaseAttributes
    dt: HTMLBaseAttributes
    dd: HTMLBaseAttributes

    // Table elements
    table: HTMLBaseAttributes
    thead: HTMLBaseAttributes
    tbody: HTMLBaseAttributes
    tfoot: HTMLBaseAttributes
    tr: HTMLBaseAttributes
    th: HTMLBaseAttributes & { colspan?: number; rowspan?: number; scope?: string; headers?: string }
    td: HTMLBaseAttributes & { colspan?: number; rowspan?: number; headers?: string }
    caption: HTMLBaseAttributes
    colgroup: HTMLBaseAttributes & { span?: number }
    col: HTMLBaseAttributes & { span?: number }

    // Text formatting
    strong: HTMLBaseAttributes
    em: HTMLBaseAttributes
    b: HTMLBaseAttributes
    i: HTMLBaseAttributes
    u: HTMLBaseAttributes
    s: HTMLBaseAttributes
    mark: HTMLBaseAttributes
    small: HTMLBaseAttributes
    sub: HTMLBaseAttributes
    sup: HTMLBaseAttributes
    code: HTMLBaseAttributes
    pre: HTMLBaseAttributes
    kbd: HTMLBaseAttributes
    samp: HTMLBaseAttributes
    var: HTMLBaseAttributes
    abbr: HTMLBaseAttributes & { title?: string }
    cite: HTMLBaseAttributes
    q: HTMLBaseAttributes & { cite?: string }
    blockquote: HTMLBaseAttributes & { cite?: string }

    // Line break and horizontal rule
    br: HTMLBaseAttributes
    hr: HTMLBaseAttributes
    wbr: HTMLBaseAttributes

    // Semantic elements
    address: HTMLBaseAttributes
    time: HTMLBaseAttributes & { datetime?: string }
    figure: HTMLBaseAttributes
    figcaption: HTMLBaseAttributes
    details: HTMLBaseAttributes & { open?: boolean }
    summary: HTMLBaseAttributes
    dialog: HTMLBaseAttributes & { open?: boolean }

    // Embedded content
    iframe: HTMLBaseAttributes & { src?: string; srcdoc?: string; name?: string; sandbox?: string; allow?: string; allowfullscreen?: boolean; width?: number | string; height?: number | string; loading?: 'eager' | 'lazy'; referrerpolicy?: string }
    embed: HTMLBaseAttributes & { src?: string; type?: string; width?: number | string; height?: number | string }
    object: HTMLBaseAttributes & { data?: string; type?: string; name?: string; usemap?: string; width?: number | string; height?: number | string }
    param: HTMLBaseAttributes & { name?: string; value?: string }
    picture: HTMLBaseAttributes

    // Script and style
    script: HTMLBaseAttributes & { src?: string; type?: string; async?: boolean; defer?: boolean; crossorigin?: string; integrity?: string; nomodule?: boolean; nonce?: string; referrerpolicy?: string }
    noscript: HTMLBaseAttributes
    style: HTMLBaseAttributes & { media?: string; nonce?: string; scoped?: boolean; type?: string }
    link: HTMLBaseAttributes & { href?: string; rel?: string; media?: string; type?: string; as?: string; crossorigin?: string; integrity?: string; sizes?: string }

    // Meta elements
    meta: HTMLBaseAttributes & { charset?: string; content?: string; 'http-equiv'?: string; name?: string }
    base: HTMLBaseAttributes & { href?: string; target?: string }
    title: HTMLBaseAttributes

    // Document structure
    html: HTMLBaseAttributes & { lang?: string }
    head: HTMLBaseAttributes
    body: HTMLBaseAttributes

    // Interactive elements
    menu: HTMLBaseAttributes
    fieldset: HTMLBaseAttributes & { disabled?: boolean; form?: string; name?: string }
    legend: HTMLBaseAttributes
    datalist: HTMLBaseAttributes
    output: HTMLBaseAttributes & { for?: string; form?: string; name?: string }
    progress: HTMLBaseAttributes & { max?: number; value?: number }
    meter: HTMLBaseAttributes & { high?: number; low?: number; max?: number; min?: number; optimum?: number; value?: number }

    // Template and slot
    template: HTMLBaseAttributes
    slot: HTMLBaseAttributes & { name?: string }

    // Canvas and map
    canvas: HTMLBaseAttributes & { width?: number | string; height?: number | string }
    map: HTMLBaseAttributes & { name?: string }
    area: HTMLBaseAttributes & { alt?: string; coords?: string; download?: string; href?: string; media?: string; ping?: string; rel?: string; shape?: string; target?: string }

    // SVG (basic support)
    svg: HTMLBaseAttributes & { viewBox?: string; xmlns?: string; width?: number | string; height?: number | string; fill?: string; stroke?: string }
    path: HTMLBaseAttributes & { d?: string; fill?: string; stroke?: string; 'stroke-width'?: number | string }
    circle: HTMLBaseAttributes & { cx?: number | string; cy?: number | string; r?: number | string; fill?: string; stroke?: string }
    rect: HTMLBaseAttributes & { x?: number | string; y?: number | string; width?: number | string; height?: number | string; rx?: number | string; ry?: number | string; fill?: string; stroke?: string }
    line: HTMLBaseAttributes & { x1?: number | string; y1?: number | string; x2?: number | string; y2?: number | string; stroke?: string; 'stroke-width'?: number | string }
    polyline: HTMLBaseAttributes & { points?: string; fill?: string; stroke?: string }
    polygon: HTMLBaseAttributes & { points?: string; fill?: string; stroke?: string }
    text: HTMLBaseAttributes & { x?: number | string; y?: number | string; dx?: number | string; dy?: number | string; fill?: string }
    tspan: HTMLBaseAttributes
    g: HTMLBaseAttributes & { transform?: string }
    defs: HTMLBaseAttributes
    use: HTMLBaseAttributes & { href?: string; x?: number | string; y?: number | string; width?: number | string; height?: number | string }
    symbol: HTMLBaseAttributes & { viewBox?: string }
    clipPath: HTMLBaseAttributes
    mask: HTMLBaseAttributes
    linearGradient: HTMLBaseAttributes & { x1?: number | string; y1?: number | string; x2?: number | string; y2?: number | string }
    radialGradient: HTMLBaseAttributes & { cx?: number | string; cy?: number | string; r?: number | string; fx?: number | string; fy?: number | string }
    stop: HTMLBaseAttributes & { offset?: number | string; 'stop-color'?: string; 'stop-opacity'?: number | string }
    pattern: HTMLBaseAttributes & { x?: number | string; y?: number | string; width?: number | string; height?: number | string; patternUnits?: string }
    image: HTMLBaseAttributes & { href?: string; x?: number | string; y?: number | string; width?: number | string; height?: number | string }
    foreignObject: HTMLBaseAttributes & { x?: number | string; y?: number | string; width?: number | string; height?: number | string }

    // Allow any other elements
    [tagName: string]: HTMLBaseAttributes
  }
}
