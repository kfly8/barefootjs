import { hono } from '@barefootjs/hono/build'

export default hono({
  components: ['../shared/components'],
  outDir: 'dist',
  clientOnly: true,
  scriptCollection: false,
})
