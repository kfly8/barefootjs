import { goTemplate } from '@barefootjs/go-template/build'

export default goTemplate({
  components: ['../shared/components'],
  outDir: 'dist',
  adapterOptions: { packageName: 'main' },
})
