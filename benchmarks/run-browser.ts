/**
 * Playwright runner for browser-bench.ts.
 * Bundles the benchmark and runs it in headless Chromium.
 *
 * Usage:
 *   bun run benchmarks/run-browser.ts           # plain text tables
 *   bun run benchmarks/run-browser.ts --md      # markdown for PR comments
 */
import { chromium } from '@playwright/test'

const mdMode = process.argv.includes('--md')

// ---------------------------------------------------------------------------
// 1. Bundle
// ---------------------------------------------------------------------------

if (!mdMode) console.log('Bundling benchmark...')
const buildResult = await Bun.build({
  entrypoints: ['./benchmarks/browser-bench.ts'],
  outdir: './benchmarks/dist',
  target: 'browser',
  format: 'esm',
  minify: false,
})

if (!buildResult.success) {
  console.error('Bundle failed:', buildResult.logs)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 2. Run in Chromium
// ---------------------------------------------------------------------------

if (!mdMode) console.log('Launching Chromium...')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('pageerror', (err) => {
  console.error(`  [page error] ${err.message}`)
})

const bundlePath = `${process.cwd()}/benchmarks/dist/browser-bench.js`
await page.setContent('<!DOCTYPE html><html><head><title>running</title></head><body></body></html>')
await page.addScriptTag({ path: bundlePath })

// Poll for results (benchmarks are CPU-bound, may take minutes)
type Results = {
  results: Record<string, Record<string, number>>
  scaling: Record<string, Record<number, number>>
}

let data: Results | null = null
for (let i = 0; i < 600; i++) {
  data = await page.evaluate(() => (window as any).__benchResults) as Results | null
  if (data) break
  await new Promise(r => setTimeout(r, 500))
}
await browser.close()

if (!data) {
  console.error('Timed out waiting for benchmark results (5 min)')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 3. Print results
// ---------------------------------------------------------------------------

const ROWS = 1000
const frameworks = ['Vanilla', 'BarefootJS', 'SolidJS', 'React'] as const
const ops = Object.keys(data.results.Vanilla)

function fmt(ms: number, decimals = 3): string {
  if (ms < 0.01) return '<0.01'
  return ms.toFixed(decimals)
}

function cell(ms: number, baseline: number): string {
  const r = baseline > 0.001 ? ` (${(ms / baseline).toFixed(1)}x)` : ''
  return `${fmt(ms)} ms${r}`
}

if (mdMode) {
  // --- Markdown output for PR comments ---
  const hdr = `| Operation (${ROWS} rows) | ` + frameworks.join(' | ') + ' |'
  const sep = '|---|' + frameworks.map(() => '---|').join('')
  console.log(hdr)
  console.log(sep)

  for (const op of ops) {
    const baseline = data.results.Vanilla[op]
    const cells = frameworks.map(fw => {
      const ms = data.results[fw]?.[op]
      if (ms === undefined) return '_N/A_'
      if (fw === 'Vanilla') return `${fmt(ms)} ms`
      return cell(ms, baseline)
    })
    console.log(`| ${op.replace(/_/g, ' ')} | ${cells.join(' | ')} |`)
  }

  console.log('')
  console.log(`**Partial update scaling** (N of ${ROWS} rows):`)
  console.log('')
  const sHdr = '| N | ' + frameworks.join(' | ') + ' |'
  const sSep = '|---|' + frameworks.map(() => '---|').join('')
  console.log(sHdr)
  console.log(sSep)

  for (const n of [1, 100, 1000]) {
    const baseline = data.scaling.Vanilla[n]
    const cells = frameworks.map(fw => {
      const ms = data.scaling[fw]?.[n]
      if (ms === undefined) return '_N/A_'
      if (fw === 'Vanilla') return `${fmt(ms)} ms`
      return cell(ms, baseline)
    })
    console.log(`| ${n} | ${cells.join(' | ')} |`)
  }
} else {
  // --- Plain text output for local use ---
  const colW = 14
  const opW = 20
  console.log(`\n=== DOM Benchmark (${ROWS} rows, Chromium, median) ===\n`)

  const header = 'Operation'.padEnd(opW) + frameworks.map(f => f.padStart(colW)).join('')
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const op of ops) {
    const baseline = data.results.Vanilla[op]
    let line = op.replace(/_/g, ' ').padEnd(opW)
    for (const fw of frameworks) {
      const ms = data.results[fw]?.[op]
      if (ms === undefined) {
        line += 'n/a'.padStart(colW)
      } else if (fw === 'Vanilla') {
        line += `${fmt(ms)}ms`.padStart(colW)
      } else {
        line += `${fmt(ms / baseline, 2)}x`.padStart(colW)
      }
    }
    console.log(line)
  }

  console.log(`\n=== Scaling: partial update N of ${ROWS} rows ===\n`)

  const scaleColW = 16
  const scaleHeader = 'N'.padEnd(8) + frameworks.map(f => f.padStart(scaleColW)).join('')
  console.log(scaleHeader)
  console.log('-'.repeat(scaleHeader.length))

  for (const n of [1, 100, 1000]) {
    const baseline = data.scaling.Vanilla[n]
    let line = String(n).padEnd(8)
    for (const fw of frameworks) {
      const ms = data.scaling[fw]?.[n]
      if (ms === undefined) {
        line += 'n/a'.padStart(scaleColW)
      } else if (fw === 'Vanilla') {
        line += `${fmt(ms)}ms`.padStart(scaleColW)
      } else {
        line += `${fmt(ms)}ms (${fmt(ms / baseline, 2)}x)`.padStart(scaleColW)
      }
    }
    console.log(line)
  }

  console.log('')
}
