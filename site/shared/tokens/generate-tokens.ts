#!/usr/bin/env bun
// Regenerate tokens.css from tokens.json.

import { resolve, dirname } from 'node:path'
import { loadTokens, generateCSS } from './index'

const ROOT = dirname(import.meta.dir)
const tokensPath = resolve(ROOT, 'tokens/tokens.json')
const outputPath = resolve(ROOT, 'styles/tokens.css')

const tokens = await loadTokens(tokensPath)
const css = generateCSS(tokens)
await Bun.write(outputPath, css)
console.log(`Generated: ${outputPath}`)
