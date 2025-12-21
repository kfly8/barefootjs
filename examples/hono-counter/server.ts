/**
 * BarefootJS + Hono SSR Server
 *
 * 事前ビルドされた dist/ から静的ファイルを配信
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

app.use('/*', serveStatic({ root: './dist' }))

export default {
  port: 3000,
  fetch: app.fetch,
}
