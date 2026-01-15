export { compileJSX } from './jsx-compiler'
export type { CompileJSXResult } from './jsx-compiler'

// Compiler v2 (multi-backend architecture)
export * as v2 from './v2'
export type {
  OutputFormat,
  CompileOptions,
  MarkedJsxAdapter,
  MarkedJsxComponentData,
  PropWithType,
  SignalDeclaration,
  MemoDeclaration,
  ModuleConstant,
  LocalVariable,
  ComponentImport,
  FileOutput,
} from './types'

// HTML element attribute types
export type {
  // Event types
  TargetedEvent,
  TargetedInputEvent,
  TargetedFocusEvent,
  TargetedKeyboardEvent,
  TargetedMouseEvent,

  // Event handlers
  InputEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ChangeEventHandler,

  // Base attributes
  BaseEventAttributes,
  HTMLBaseAttributes,

  // Form attribute helper types
  HTMLAttributeFormEnctype,
  HTMLAttributeFormMethod,
  HTMLAttributeAnchorTarget,

  // Element-specific attributes
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  FormHTMLAttributes,
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  LabelHTMLAttributes,
  OptionHTMLAttributes,
} from './html-types'
