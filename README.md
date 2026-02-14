<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/logo/logo-for-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="images/logo/logo-for-light.svg">
    <img alt="BarefootJS" src="images/logo/logo-for-light.svg" width="400">
  </picture>
</p>

<p align="center">
  <strong>Reactive JSX for any backend</strong><br>
  Generates Marked Templates + Client JS from Signal-based JSX
</p>

---

## Features

- **Zero runtime overhead (SSR)** - Server renders pure templates, no JS framework needed
- **Fine-grained reactivity** - Signal-based updates, only re-render what changed
- **Type-safe** - Full TypeScript support with preserved type information
- **Backend agnostic** - Currently supports Hono/JSX, designed for Go, Python, etc.

---

## Documentation

- [barefootjs.dev](https://barefootjs.dev/) - Core documentation
- [ui.barefootjs.dev](https://ui.barefootjs.dev/) - UI components built with BarefootJS

---

## Acknowledgements

This project is inspired by and built with:

- [SolidJS](https://www.solidjs.com/) - Fine-grained reactivity model and Signal API design
- [shadcn/ui](https://ui.shadcn.com/) - UI component design system (docs/ui)
- [Hono](https://hono.dev/) - JSX runtime for server-side rendering

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
