/**
 * Minimal test server for @barefootjs/xyflow E2E tests.
 * Bundles xyflow + dom on the fly and serves a test page.
 */

import { resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const DOM_ROOT = resolve(ROOT, '../dom')

// Bundle @barefootjs/dom for the browser
const domBuild = await Bun.build({
  entrypoints: [resolve(DOM_ROOT, 'src/index.ts')],
  format: 'esm',
})

// Bundle @barefootjs/xyflow for the browser (external dom)
const xyflowBuild = await Bun.build({
  entrypoints: [resolve(ROOT, 'src/index.ts')],
  format: 'esm',
  external: ['@barefootjs/dom'],
})

const domJs = await domBuild.outputs[0].text()
const xyflowJs = await xyflowBuild.outputs[0].text()

// Read the test HTML
const testHtml = await Bun.file(resolve(ROOT, 'e2e/test-page.html')).text()

const port = Number(process.env.PORT) || 3099

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/barefoot-dom.js') {
      return new Response(domJs, { headers: { 'Content-Type': 'application/javascript' } })
    }
    if (url.pathname === '/barefoot-xyflow.js') {
      return new Response(xyflowJs, { headers: { 'Content-Type': 'application/javascript' } })
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(testHtml, { headers: { 'Content-Type': 'text/html' } })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Test server running at http://localhost:${port}`)
