"use client"
/**
 * PackageManagerTabs Component
 *
 * A tabbed interface for displaying installation commands
 * for different package managers (pnpm, npm, yarn, bun).
 *
 * This component is compiled by BarefootJS to enable client-side
 * interactivity (tab switching).
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../ui/tabs'
import { CopyButton } from './copy-button'

interface HighlightedCommands {
  pnpm: string
  npm: string
  yarn: string
  bun: string
}

interface PackageManagerTabsProps {
  command: string
  /** Pre-highlighted HTML for each package manager command (server-side rendered) */
  highlightedCommands?: HighlightedCommands
}

export function PackageManagerTabs({ command, highlightedCommands }: PackageManagerTabsProps) {
  const [selected, setSelected] = createSignal('bun')

  const isPnpmSelected = createMemo(() => selected() === 'pnpm')
  const isNpmSelected = createMemo(() => selected() === 'npm')
  const isYarnSelected = createMemo(() => selected() === 'yarn')
  const isBunSelected = createMemo(() => selected() === 'bun')

  const pnpmCommand = `pnpm dlx ${command}`
  const npmCommand = `npx ${command}`
  const yarnCommand = `npx ${command}`
  const bunCommand = `bunx --bun ${command}`

  return (
    <Tabs value={selected()} onValueChange={(v) => setSelected(v)}>
      <TabsList>
        <TabsTrigger
          value="pnpm"
          selected={isPnpmSelected()}
          onClick={() => setSelected('pnpm')}
        >
          pnpm
        </TabsTrigger>
        <TabsTrigger
          value="npm"
          selected={isNpmSelected()}
          onClick={() => setSelected('npm')}
        >
          npm
        </TabsTrigger>
        <TabsTrigger
          value="yarn"
          selected={isYarnSelected()}
          onClick={() => setSelected('yarn')}
        >
          yarn
        </TabsTrigger>
        <TabsTrigger
          value="bun"
          selected={isBunSelected()}
          onClick={() => setSelected('bun')}
        >
          bun
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pnpm" selected={isPnpmSelected()}>
        <div class="relative group">
          <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono border border-border">
            {highlightedCommands ? (
              <code dangerouslySetInnerHTML={{ __html: highlightedCommands.pnpm }} />
            ) : (
              <code>{pnpmCommand}</code>
            )}
          </pre>
          <CopyButton code={pnpmCommand} />
        </div>
      </TabsContent>
      <TabsContent value="npm" selected={isNpmSelected()}>
        <div class="relative group">
          <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono border border-border">
            {highlightedCommands ? (
              <code dangerouslySetInnerHTML={{ __html: highlightedCommands.npm }} />
            ) : (
              <code>{npmCommand}</code>
            )}
          </pre>
          <CopyButton code={npmCommand} />
        </div>
      </TabsContent>
      <TabsContent value="yarn" selected={isYarnSelected()}>
        <div class="relative group">
          <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono border border-border">
            {highlightedCommands ? (
              <code dangerouslySetInnerHTML={{ __html: highlightedCommands.yarn }} />
            ) : (
              <code>{yarnCommand}</code>
            )}
          </pre>
          <CopyButton code={yarnCommand} />
        </div>
      </TabsContent>
      <TabsContent value="bun" selected={isBunSelected()}>
        <div class="relative group">
          <pre class="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono border border-border">
            {highlightedCommands ? (
              <code dangerouslySetInnerHTML={{ __html: highlightedCommands.bun }} />
            ) : (
              <code>{bunCommand}</code>
            )}
          </pre>
          <CopyButton code={bunCommand} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
