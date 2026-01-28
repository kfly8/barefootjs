/**
 * Hero section with code comparison demo
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHighlighter } from 'shiki'

// Cache highlighter instance
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['tsx', 'javascript', 'html'],
    })
  }
  return highlighterPromise
}

async function highlightCode(code: string, lang: 'tsx' | 'javascript' | 'html') {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark',
  })
}

async function CodeComparisonDemo() {
  // Load code snippets from static files
  const snippetsDir = join(process.cwd(), 'public/static/snippets')
  const sourceCode = readFileSync(join(snippetsDir, 'source.txt'), 'utf-8').trim()
  const honoOutput = readFileSync(join(snippetsDir, 'hono.txt'), 'utf-8').trim()
  const echoOutput = readFileSync(join(snippetsDir, 'echo.txt'), 'utf-8').trim()
  const clientCode = readFileSync(join(snippetsDir, 'client.txt'), 'utf-8').trim()

  // Highlight all code snippets
  const sourceHtml = await highlightCode(sourceCode, 'tsx')
  const honoHtml = await highlightCode(honoOutput, 'tsx')
  const echoHtml = await highlightCode(echoOutput, 'html')
  const clientHtml = await highlightCode(clientCode, 'javascript')

  const html = `
    <div class="code-demo" id="code-demo">
      <!-- Source Panel (Left) -->
      <div class="code-panel source-panel" id="source-panel">
        <div class="code-header">
          <div class="code-tabs">
            <button class="code-tab active" id="tab-source">Counter.tsx</button>
          </div>
        </div>
        <div class="code-content">${sourceHtml}</div>
      </div>

      <!-- Compile Button (Center) -->
      <div class="compile-section" id="compile-section">
        <button class="compile-btn" id="compile-btn">
          <span class="compile-icon">→</span>
          <span class="compile-text">Compile</span>
        </button>
      </div>

      <!-- Output Panel (Right) -->
      <div class="code-panel output-panel" id="output-panel">
        <div class="code-header">
          <div class="code-tabs">
            <button class="code-tab" data-output="template" id="tab-template">Template</button>
            <button class="code-tab" data-output="client" id="tab-client">client.js</button>
          </div>
          <div class="backend-tabs" id="backend-tabs" style="display: none;">
            <button class="backend-tab active" data-backend="hono" id="btn-hono">Hono</button>
            <button class="backend-tab" data-backend="echo" id="btn-echo">Echo</button>
          </div>
        </div>
        <div class="code-content" id="output-content">
          <div class="output-placeholder" id="output-placeholder">
            <span>Click Compile to generate output</span>
          </div>
          <div class="output-code" id="output-hono" style="display: none;">${honoHtml}</div>
          <div class="output-code" id="output-echo" style="display: none;">${echoHtml}</div>
          <div class="output-code" id="output-client" style="display: none;">${clientHtml}</div>
        </div>
      </div>

      <script>
        (function() {
          var sourcePanel = document.getElementById('source-panel');
          var outputPanel = document.getElementById('output-panel');
          var compileBtn = document.getElementById('compile-btn');
          var compileSection = document.getElementById('compile-section');
          var placeholder = document.getElementById('output-placeholder');
          var backendTabs = document.getElementById('backend-tabs');
          var outputHono = document.getElementById('output-hono');
          var outputEcho = document.getElementById('output-echo');
          var outputClient = document.getElementById('output-client');
          var tabTemplate = document.getElementById('tab-template');
          var tabClient = document.getElementById('tab-client');
          var btnHono = document.getElementById('btn-hono');
          var btnEcho = document.getElementById('btn-echo');

          var compiled = false;
          var currentOutput = 'template';
          var currentBackend = 'hono';

          function updateOutputDisplay() {
            outputHono.style.display = 'none';
            outputEcho.style.display = 'none';
            outputClient.style.display = 'none';

            if (currentOutput === 'template') {
              backendTabs.style.display = 'flex';
              if (currentBackend === 'hono') {
                outputHono.style.display = 'block';
              } else {
                outputEcho.style.display = 'block';
              }
            } else {
              backendTabs.style.display = 'none';
              outputClient.style.display = 'block';
            }
          }

          function compile() {
            if (compiled) return;
            compiled = true;

            // Add compiled class for width transition
            document.getElementById('code-demo').classList.add('compiled');
            compileBtn.classList.add('compiled');
            compileBtn.disabled = true;

            // Show output
            placeholder.style.display = 'none';
            tabTemplate.classList.add('active');
            currentOutput = 'template';
            updateOutputDisplay();
          }

          function switchOutput(type) {
            if (!compiled) return;
            currentOutput = type;
            tabTemplate.classList.toggle('active', type === 'template');
            tabClient.classList.toggle('active', type === 'client');
            updateOutputDisplay();
          }

          function switchBackend(backend) {
            currentBackend = backend;
            btnHono.classList.toggle('active', backend === 'hono');
            btnEcho.classList.toggle('active', backend === 'echo');
            updateOutputDisplay();
          }

          compileBtn.addEventListener('click', compile);
          tabTemplate.addEventListener('click', function() { switchOutput('template'); });
          tabClient.addEventListener('click', function() { switchOutput('client'); });
          btnHono.addEventListener('click', function() { switchBackend('hono'); });
          btnEcho.addEventListener('click', function() { switchBackend('echo'); });
        })();
      </script>
    </div>
  `

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export async function Hero() {
  const codeDemo = await CodeComparisonDemo()

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
          {codeDemo}
        </div>
      </div>
    </section>
  )
}
