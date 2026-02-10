"use client"

/**
 * Backend name cycling animation
 *
 * Shows "any backend" for 3 seconds, then cycles through frameworks,
 * then returns to "any backend" and stops.
 */

import { createSignal, onMount, onCleanup } from '@barefootjs/dom'

const sequence = [
  { name: 'any backend', logo: null },
  { name: 'Hono', logo: 'hono' },
  { name: 'Echo', logo: 'echo' },
  { name: 'FastAPI', logo: 'fastapi' },
  { name: 'Mojolicious', logo: 'mojo' },
  { name: 'any backend', logo: null },
]

export function BackendTyper() {
  const [index, setIndex] = createSignal(0)

  onMount(() => {
    // Wait 3 seconds before starting animation
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setIndex((i) => {
          const next = i + 1
          if (next >= sequence.length - 1) {
            clearInterval(interval)
            return sequence.length - 1
          }
          return next
        })
      }, 1800)

      onCleanup(() => clearInterval(interval))
    }, 3000)

    onCleanup(() => clearTimeout(startDelay))
  })

  return (
    <span className="backend-text">
      {sequence[index()].logo ? (
        <span className="framework-display">
          <img
            src={`/static/logos/${sequence[index()].logo}.svg`}
            alt=""
            className="framework-logo"
          />
          <span className="font-bold">{sequence[index()].name}</span>
        </span>
      ) : (
        <span className="gradient-text font-bold">{sequence[index()].name}</span>
      )}
    </span>
  )
}
