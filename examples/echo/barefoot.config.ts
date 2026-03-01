import { createConfig } from '@barefootjs/go-template/build'

export default createConfig({
  components: ['../shared/components'],
  outDir: 'dist',
  adapterOptions: { packageName: 'main' },
})
