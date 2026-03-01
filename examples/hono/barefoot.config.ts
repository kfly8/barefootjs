import { createConfig } from '@barefootjs/hono/build'

export default createConfig({
  components: ['components', '../shared/components'],
  outDir: 'dist',
})
