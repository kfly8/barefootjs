/**
 * barefoot story <component>
 *
 * Entry point: find stories, compile, serve.
 */

/** @jsxImportSource hono/jsx */

import { resolve } from 'node:path'
import { compile } from './compile'
import { createStoryApp, startServer, pascalToTitle, type StoryEntry } from './server'

const ROOT_DIR = resolve(import.meta.dir, '../..')
const STORIES_DIR = resolve(ROOT_DIR, 'ui/components/ui/__stories__')
const DEFAULT_PORT = 3003

export async function runStory(componentName: string) {
  const storiesPath = resolve(STORIES_DIR, `${componentName}.stories.tsx`)

  // 1. Check stories file exists
  if (!await Bun.file(storiesPath).exists()) {
    console.error(`Error: Stories file not found: ui/components/ui/__stories__/${componentName}.stories.tsx`)
    process.exit(1)
  }

  // 2. Extract export function names from source
  const source = await Bun.file(storiesPath).text()
  const storyNames = [...source.matchAll(/export function (\w+)/g)].map(m => m[1])

  if (storyNames.length === 0) {
    console.error('Error: No exported functions found in stories file.')
    process.exit(1)
  }

  console.log(`Found ${storyNames.length} stories: ${storyNames.join(', ')}`)

  // 3. Compile
  console.log('\nCompiling...')
  const result = await compile({ storiesPath, storyNames })

  // 4. Import compiled stories module
  const storiesModule = await import(result.storiesCompiledPath)

  // 5. Build story entries
  const stories: StoryEntry[] = storyNames.map(name => ({
    name,
    displayName: pascalToTitle(name),
  }))

  // 6. Create and start server
  const app = createStoryApp({
    stories,
    componentName: componentName.charAt(0).toUpperCase() + componentName.slice(1),
    renderStory: (name: string) => {
      const Story = storiesModule[name]
      if (!Story) return <div>Story "{name}" not found</div>
      return <Story />
    },
    port: DEFAULT_PORT,
  })

  startServer(app, DEFAULT_PORT)
}

// Run if called directly (not imported)
if (import.meta.main) {
  const componentArg = process.argv[2]
  if (componentArg) {
    runStory(componentArg)
  } else {
    console.error('Usage: bun run scripts/story/index.tsx <component>')
    process.exit(1)
  }
}
