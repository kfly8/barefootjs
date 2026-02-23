// `barefoot init` — Initialize a new BarefootJS project.

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import type { BarefootConfig } from '../context'

const DEFAULT_CONFIG: BarefootConfig = {
  $schema: 'https://barefootjs.dev/schema/barefoot.json',
  paths: {
    components: 'components/ui',
    tokens: 'tokens',
    meta: 'meta',
  },
}

export function run(args: string[], ctx: CliContext): void {
  const projectDir = process.cwd()

  // Parse --name flag
  let name: string | undefined
  const nameIdx = args.indexOf('--name')
  if (nameIdx !== -1 && args[nameIdx + 1]) {
    name = args[nameIdx + 1]
  }

  // Check if already initialized
  const configPath = path.join(projectDir, 'barefoot.json')
  if (existsSync(configPath)) {
    console.error('Error: barefoot.json already exists. Project is already initialized.')
    process.exit(1)
  }

  const config: BarefootConfig = { ...DEFAULT_CONFIG }
  if (name) config.name = name

  // 1. Write barefoot.json
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
  console.log('  Created barefoot.json')

  // 2. Generate tokens/ (tokens.json + tokens.css)
  const tokensDir = path.resolve(projectDir, config.paths.tokens)
  mkdirSync(tokensDir, { recursive: true })

  const sourceTokensJson = path.resolve(ctx.root, 'site/shared/tokens/tokens.json')
  const destTokensJson = path.join(tokensDir, 'tokens.json')
  if (existsSync(sourceTokensJson)) {
    copyFileSync(sourceTokensJson, destTokensJson)
    console.log(`  Created ${config.paths.tokens}/tokens.json`)
  }

  // Generate tokens.css from tokens.json
  generateTokensCSS(ctx.root, destTokensJson, tokensDir, config.paths.tokens)

  // 3. Copy types/index.tsx
  const typesDir = path.join(projectDir, 'types')
  mkdirSync(typesDir, { recursive: true })
  const sourceTypes = path.resolve(ctx.root, 'ui/types/index.tsx')
  if (existsSync(sourceTypes)) {
    copyFileSync(sourceTypes, path.join(typesDir, 'index.tsx'))
    console.log('  Created types/index.tsx')
  }

  // 4. Create meta/ directory
  const metaDir = path.resolve(projectDir, config.paths.meta)
  mkdirSync(metaDir, { recursive: true })
  writeFileSync(
    path.join(metaDir, 'index.json'),
    JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), components: [] }, null, 2) + '\n',
  )
  console.log(`  Created ${config.paths.meta}/index.json`)

  // 5. Create components directory
  const componentsDir = path.resolve(projectDir, config.paths.components)
  mkdirSync(componentsDir, { recursive: true })

  console.log(`\nProject initialized successfully!`)
  console.log(`\nNext steps:`)
  console.log(`  barefoot add button checkbox   # Add components`)
  console.log(`  barefoot search <query>        # Search available components`)
}

async function generateTokensCSS(
  root: string,
  tokensJsonPath: string,
  tokensDir: string,
  tokensRelDir: string,
): Promise<void> {
  try {
    const { loadTokens, generateCSS } = await import(
      path.resolve(root, 'site/shared/tokens/index')
    )
    const tokenSet = await loadTokens(tokensJsonPath)
    const css = generateCSS(tokenSet)
    writeFileSync(path.join(tokensDir, 'tokens.css'), css)
    console.log(`  Created ${tokensRelDir}/tokens.css`)
  } catch {
    // Token generation is optional; skip if modules are not available
    console.log(`  Skipped tokens.css generation (token modules not available)`)
  }
}
