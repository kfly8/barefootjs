/**
 * Hero section with terminal demo
 */

import { TerminalDemo } from '@/components/demo/terminal-demo'

export function Hero() {
  return (
    <section className="h-screen flex items-center px-6 sm:px-12">
      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Headline */}
        <div>
          <h1 className="fade-in text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
            Reactive TSX for <span className="gradient-text whitespace-nowrap">any backend</span>
          </h1>
          <p className="fade-in-1 text-lg text-muted-foreground mb-8 max-w-lg">
            Write TSX with signals. Compile to templates your backend understands.
            No VDOM on the client, just selective hydration.
          </p>
          <div className="fade-in-2 flex flex-wrap gap-3">
            <a
              href="https://github.com/kfly8/barefootjs#quick-start"
              className="btn-primary"
            >
              Get Started
            </a>
            <a
              href="https://github.com/kfly8/barefootjs"
              className="btn-secondary"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Right: Terminal Demo */}
        <div className="fade-in-3">
          <TerminalDemo />
        </div>
      </div>
    </section>
  )
}
