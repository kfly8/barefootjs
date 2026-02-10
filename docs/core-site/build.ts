/**
 * SSG Build Script for the BarefootJS documentation site.
 *
 * Generates static HTML and Markdown files for deployment to GitHub Pages:
 *   dist/{slug}/index.html  — Rendered HTML page
 *   dist/{slug}.md          — Raw Markdown file
 *   dist/static/            — CSS and other assets
 */

import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createApp } from './app'

const DIST_DIR = resolve(dirname(import.meta.path), 'dist')

async function build() {
  console.log('Building BarefootJS documentation...\n')

  const { app, pages } = await createApp()

  await mkdir(DIST_DIR, { recursive: true })

  let htmlCount = 0
  let mdCount = 0

  // Generate index page
  const indexPage = pages.find((p) => p.slug === '')
  if (indexPage) {
    // HTML version
    const htmlRes = await app.request('/')
    const html = await htmlRes.text()
    await Bun.write(resolve(DIST_DIR, 'index.html'), html)
    console.log('  HTML: /index.html')
    htmlCount++

    // Markdown version
    const mdRes = await app.request('/README.md')
    const md = await mdRes.text()
    await Bun.write(resolve(DIST_DIR, 'README.md'), md)
    console.log('  MD:   /README.md')
    mdCount++
  }

  // Generate all other pages
  for (const page of pages.filter((p) => p.slug !== '')) {
    // HTML version: dist/{slug}/index.html
    const htmlRes = await app.request(`/${page.slug}`)
    const html = await htmlRes.text()
    const htmlDir = resolve(DIST_DIR, page.slug)
    await mkdir(htmlDir, { recursive: true })
    await Bun.write(resolve(htmlDir, 'index.html'), html)
    console.log(`  HTML: /${page.slug}/index.html`)
    htmlCount++

    // Markdown version: dist/{slug}.md
    const mdRes = await app.request(`/${page.slug}.md`)
    const md = await mdRes.text()
    const mdDir = dirname(resolve(DIST_DIR, `${page.slug}.md`))
    await mkdir(mdDir, { recursive: true })
    await Bun.write(resolve(DIST_DIR, `${page.slug}.md`), md)
    console.log(`  MD:   /${page.slug}.md`)
    mdCount++
  }

  // Copy static assets
  const stylesDir = resolve(DIST_DIR, 'static')
  await mkdir(stylesDir, { recursive: true })

  const globalsCss = resolve(dirname(import.meta.path), 'styles/globals.css')
  await Bun.write(resolve(stylesDir, 'globals.css'), Bun.file(globalsCss))
  console.log('  CSS:  /static/globals.css')

  // Create .nojekyll for GitHub Pages (prevents Jekyll processing)
  await Bun.write(resolve(DIST_DIR, '.nojekyll'), '')

  // Create 404.html that redirects to index
  const notFoundRes = await app.request('/')
  const notFoundHtml = await notFoundRes.text()
  await Bun.write(resolve(DIST_DIR, '404.html'), notFoundHtml)
  console.log('  HTML: /404.html')

  console.log(`\nBuild complete! ${htmlCount} HTML pages, ${mdCount} Markdown files.`)
  console.log(`Output: ${DIST_DIR}`)
}

build().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
