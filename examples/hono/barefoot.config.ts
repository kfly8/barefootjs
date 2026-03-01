import { hono } from '@barefootjs/hono/build'

export default hono({
  components: ['components', '../shared/components'],
  outDir: 'dist',
})
