/**
 * Hero section with code comparison demo
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function CodeComparisonDemo() {
  // Load code snippets from static files
  const snippetsDir = join(process.cwd(), 'public/static/snippets')
  const sourceCode = escapeHtml(readFileSync(join(snippetsDir, 'source.txt'), 'utf-8'))
  const honoOutput = escapeHtml(readFileSync(join(snippetsDir, 'hono.txt'), 'utf-8'))
  const echoOutput = escapeHtml(readFileSync(join(snippetsDir, 'echo.txt'), 'utf-8'))

  const html = `
    <div class="code-comparison" id="code-demo">
      <div class="code-panel">
        <div class="code-header">
          <span class="code-label">Write</span>
          <span class="code-filename">Counter.tsx</span>
        </div>
        <pre class="code-content">${sourceCode}</pre>
      </div>

      <div class="code-arrow">
        <span>→</span>
      </div>

      <div class="code-panel">
        <div class="code-header">
          <span class="code-label">Output</span>
          <div class="code-tabs">
            <button class="code-tab active" data-backend="hono" id="tab-hono">Hono</button>
            <button class="code-tab" data-backend="echo" id="tab-echo">Echo</button>
          </div>
        </div>
        <pre class="code-content" id="output-hono">${honoOutput}</pre>
        <pre class="code-content" id="output-echo" style="display: none;">${echoOutput}</pre>
      </div>

      <script>
        (function() {
          var tabHono = document.getElementById('tab-hono');
          var tabEcho = document.getElementById('tab-echo');
          var outputHono = document.getElementById('output-hono');
          var outputEcho = document.getElementById('output-echo');

          function showHono() {
            tabHono.classList.add('active');
            tabEcho.classList.remove('active');
            outputHono.style.display = 'block';
            outputEcho.style.display = 'none';
          }

          function showEcho() {
            tabEcho.classList.add('active');
            tabHono.classList.remove('active');
            outputEcho.style.display = 'block';
            outputHono.style.display = 'none';
          }

          tabHono.addEventListener('click', showHono);
          tabEcho.addEventListener('click', showEcho);
        })();
      </script>
    </div>
  `

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

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

        {/* Right: Code Comparison Demo */}
        <div className="fade-in-3">
          <CodeComparisonDemo />
        </div>
      </div>
    </section>
  )
}
