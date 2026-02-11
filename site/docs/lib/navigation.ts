/**
 * Navigation structure for the documentation sidebar.
 * Mirrors the table of contents in docs/core/README.md.
 */

export interface NavItem {
  title: string
  slug: string
  children?: NavItem[]
}

export const navigation: NavItem[] = [
  { title: 'Introduction', slug: 'introduction' },
  { title: 'Core Concepts', slug: 'core-concepts' },
  {
    title: 'Reactivity',
    slug: 'reactivity',
    children: [
      { title: 'createSignal', slug: 'reactivity/create-signal' },
      { title: 'createEffect', slug: 'reactivity/create-effect' },
      { title: 'createMemo', slug: 'reactivity/create-memo' },
      { title: 'onMount', slug: 'reactivity/on-mount' },
      { title: 'onCleanup', slug: 'reactivity/on-cleanup' },
      { title: 'untrack', slug: 'reactivity/untrack' },
      { title: 'Props Reactivity', slug: 'reactivity/props-reactivity' },
    ],
  },
  {
    title: 'Templates & Rendering',
    slug: 'rendering',
    children: [
      { title: 'JSX Compatibility', slug: 'rendering/jsx-compatibility' },
      { title: 'Fragment', slug: 'rendering/fragment' },
      { title: 'Client Directive', slug: 'rendering/client-directive' },
    ],
  },
  {
    title: 'Components',
    slug: 'components',
    children: [
      { title: 'Component Authoring', slug: 'components/component-authoring' },
      { title: 'Props & Type Safety', slug: 'components/props-type-safety' },
      { title: 'Children & Slots', slug: 'components/children-slots' },
      { title: 'Context API', slug: 'components/context-api' },
      { title: 'Portals', slug: 'components/portals' },
    ],
  },
  {
    title: 'Adapters',
    slug: 'adapters',
    children: [
      { title: 'Adapter Architecture', slug: 'adapters/adapter-architecture' },
      { title: 'Hono Adapter', slug: 'adapters/hono-adapter' },
      { title: 'Go Template Adapter', slug: 'adapters/go-template-adapter' },
      { title: 'Custom Adapter', slug: 'adapters/custom-adapter' },
    ],
  },
  {
    title: 'Advanced',
    slug: 'advanced',
    children: [
      { title: 'Compiler Internals', slug: 'advanced/compiler-internals' },
      { title: 'IR Schema', slug: 'advanced/ir-schema' },
      { title: 'Error Codes', slug: 'advanced/error-codes' },
      { title: 'Performance', slug: 'advanced/performance' },
    ],
  },
]
