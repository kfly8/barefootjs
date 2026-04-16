import { createConfig } from '@barefootjs/go-template/build'

export default createConfig({
  components: ['../shared/components'],
  outDir: 'dist',
  minify: true,
  adapterOptions: { packageName: 'main' },
  typesOutputFile: 'components.go',
  transformTypes: (types) => {
    let t = types

    // Add Go-server-specific computed fields to TodoAppProps
    t = t.replace(
      /(type TodoAppProps struct \{[\s\S]*?)(^\})/m,
      `$1\tTodoItems    []TodoItemProps  \`json:"-"\`         // For Go template (not in JSON)
\tDoneCount    int              \`json:"doneCount"\` // Pre-computed done count
$2`
    )

    // Add Go-server-specific computed fields to TodoAppSSRProps
    t = t.replace(
      /(type TodoAppSSRProps struct \{[\s\S]*?)(^\})/m,
      `$1\tTodoItems    []TodoItemProps  \`json:"-"\`         // For Go template (not in JSON)
\tDoneCount    int              \`json:"doneCount"\` // Pre-computed done count
$2`
    )

    return t
  },
})
