#!/usr/bin/env bun
/**
 * BarefootJS Build CLI
 * 
 * Usage: bun build.cli.ts [config-path]
 * 
 * If no config path is provided, looks for barefoot.config.json in the current directory
 */

import { build } from './build-runner'
import { resolve } from 'node:path'

const configPath = process.argv[2] || 'barefoot.config.json'
const resolvedPath = resolve(process.cwd(), configPath)

try {
  await build(resolvedPath)
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}
