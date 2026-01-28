"use client"

/**
 * Terminal Demo Animation
 *
 * Shows the workflow: JSX source -> compile -> marked template -> deploy -> demo
 */

import { createSignal, onMount } from '@barefootjs/dom'

// Animation step types
type Step = {
  type: 'clear' | 'title' | 'command' | 'output' | 'demo'
  content?: string
  delay?: number
}

export function TerminalDemo() {
  const [lines, setLines] = createSignal<string[]>([])
  const [currentTab, setCurrentTab] = createSignal('source')
  const [demoCount, setDemoCount] = createSignal(0)
  const [showDemo, setShowDemo] = createSignal(false)
  const [isAnimating, setIsAnimating] = createSignal(false)

  // Animation sequences - all content inlined to avoid compiler reordering issues
  const sequences: Record<string, Step[]> = {
    source: [
      { type: 'clear' },
      { type: 'title', content: '# Counter.tsx' },
      { type: 'output', content: `"use client"

import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)
  return (
    &lt;div&gt;
      &lt;span&gt;{count()}&lt;/span&gt;
      &lt;button onClick={() =&gt; setCount(n =&gt; n + 1)}&gt;
        +1
      &lt;/button&gt;
    &lt;/div&gt;
  )
}`, delay: 3000 },
    ],
    hono: [
      { type: 'clear' },
      { type: 'command', content: '$ barefoot compile --adapter hono' },
      { type: 'output', content: `Generated: Counter.tsx (Marked Template)
Generated: Counter.client.js`, delay: 800 },
      { type: 'title', content: '# Counter.tsx (Hono Marked Template)' },
      { type: 'output', content: `export function Counter() {
  return (
    &lt;div data-bf-scope="Counter"&gt;
      &lt;span data-bf="slot_0"&gt;0&lt;/span&gt;
      &lt;button data-bf="slot_1"&gt;+1&lt;/button&gt;
    &lt;/div&gt;
  )
}`, delay: 1200 },
      { type: 'command', content: '$ bun run server.tsx' },
      { type: 'output', content: 'Server running at http://localhost:3000', delay: 600 },
      { type: 'demo', content: 'hono', delay: 2000 },
    ],
    echo: [
      { type: 'clear' },
      { type: 'command', content: '$ barefoot compile --adapter echo' },
      { type: 'output', content: `Generated: Counter.tmpl (Go Template)
Generated: Counter.client.js`, delay: 800 },
      { type: 'title', content: '# Counter.tmpl (Echo Go Template)' },
      { type: 'output', content: `{{/* Marked Template */}}
&lt;div data-bf-scope="Counter"&gt;
  &lt;span data-bf="slot_0"&gt;{{ .Count }}&lt;/span&gt;
  &lt;button data-bf="slot_1"&gt;+1&lt;/button&gt;
&lt;/div&gt;`, delay: 1200 },
      { type: 'command', content: '$ go run main.go' },
      { type: 'output', content: 'Server running at http://localhost:8080', delay: 600 },
      { type: 'demo', content: 'echo', delay: 2000 },
    ],
  }

  const typeText = async (text: string, speed = 20): Promise<string> => {
    return new Promise((resolve) => {
      let result = ''
      let i = 0
      const interval = setInterval(() => {
        if (i < text.length) {
          result += text[i]
          i++
          setLines((prev) => [...prev.slice(0, -1), result])
        } else {
          clearInterval(interval)
          resolve(result)
        }
      }, speed)
    })
  }

  const addLine = (line: string) => {
    setLines((prev) => [...prev, line])
  }

  const runSequence = async (tab: string) => {
    if (isAnimating()) return
    setIsAnimating(true)
    setShowDemo(false)
    setDemoCount(0)

    const steps = sequences[tab]
    for (const step of steps) {
      switch (step.type) {
        case 'clear':
          setLines([])
          break
        case 'title':
          addLine('')
          addLine(step.content || '')
          break
        case 'command':
          addLine('')
          addLine('')
          await typeText(step.content || '', 30)
          break
        case 'output':
          await new Promise((r) => setTimeout(r, 300))
          const outputLines = (step.content || '').split('\n')
          for (const line of outputLines) {
            addLine(line)
            await new Promise((r) => setTimeout(r, 50))
          }
          break
        case 'demo':
          setShowDemo(true)
          break
      }
      if (step.delay) {
        await new Promise((r) => setTimeout(r, step.delay))
      }
    }
    setIsAnimating(false)
  }

  const handleIncrement = () => {
    setDemoCount((n) => n + 1)
  }

  const switchTab = async (tab: string) => {
    if (tab === currentTab() || isAnimating()) return
    setCurrentTab(tab)
    await runSequence(tab)
  }

  onMount(() => {
    runSequence('source')
  })

  return (
    <div className="terminal-container">
      {/* Tabs */}
      <div className="terminal-tabs">
        <button
          className={`terminal-tab ${currentTab() === 'source' ? 'active' : ''}`}
          onClick={() => switchTab('source')}
        >
          Source
        </button>
        <button
          className={`terminal-tab ${currentTab() === 'hono' ? 'active' : ''}`}
          onClick={() => switchTab('hono')}
        >
          Hono
        </button>
        <button
          className={`terminal-tab ${currentTab() === 'echo' ? 'active' : ''}`}
          onClick={() => switchTab('echo')}
        >
          Echo
        </button>
      </div>

      {/* Terminal content */}
      <div className="terminal-content">
        {lines().map((line) => (
          <div className={`terminal-line ${line.startsWith('$') ? 'command' : line.startsWith('#') ? 'title' : ''}`}>
            {line}
          </div>
        ))}
        {isAnimating() && <span className="terminal-cursor">|</span>}
      </div>

      {/* Live demo */}
      {showDemo() && (
        <div className="terminal-demo">
          <div className="demo-label">{currentTab() === 'hono' ? 'Hono App' : 'Echo App'}</div>
          <div className="demo-content">
            <span className="demo-count">{demoCount()}</span>
            <button className="demo-button" onClick={handleIncrement}>
              +1
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
