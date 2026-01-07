"use client"
/**
 * CodeTooltip Component
 *
 * A client-side tooltip portal that displays type information
 * when hovering over component names in code blocks.
 * Uses position: fixed to escape overflow clipping.
 */

import { createSignal, createEffect } from '@barefootjs/dom'

export function CodeTooltip() {
  // Use separate signals for each property (compiler handles these correctly)
  const [visible, setVisible] = createSignal(false)
  const [content, setContent] = createSignal('')
  const [posX, setPosX] = createSignal(0)
  const [posY, setPosY] = createSignal(0)

  // Set up event listeners on mount
  createEffect(() => {
    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement
      const tooltipEl = target.closest('.code-tooltip') as HTMLElement | null
      if (!tooltipEl) return

      const tooltipContent = tooltipEl.getAttribute('data-tooltip')
      if (!tooltipContent) return

      const rect = tooltipEl.getBoundingClientRect()

      // Position below the element, centered
      setPosX(rect.left + rect.width / 2)
      setPosY(rect.bottom + 8)
      setContent(tooltipContent)
      setVisible(true)
    }

    const handleMouseLeave = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('.code-tooltip')) {
        setVisible(false)
      }
    }

    // Use event delegation on document
    document.addEventListener('mouseenter', handleMouseEnter, true)
    document.addEventListener('mouseleave', handleMouseLeave, true)

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
    }
  })

  return (
    <div
      class="code-tooltip-portal"
      style={{
        position: 'fixed',
        left: `${posX()}px`,
        top: `${posY()}px`,
        transform: 'translateX(-50%)',
        opacity: visible() ? '1' : '0',
        visibility: visible() ? 'visible' : 'hidden',
        pointerEvents: 'none',
        zIndex: '9999',
        transition: 'opacity 150ms ease-out, visibility 150ms ease-out',
      }}
    >
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid var(--popover)',
        }}
      />
      {/* Content */}
      <div
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--popover)',
          color: 'var(--popover-foreground)',
          fontSize: '0.75rem',
          lineHeight: '1.4',
          whiteSpace: 'pre-line',
          borderRadius: '0.375rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          minWidth: '200px',
          maxWidth: '350px',
        }}
      >
        {content()}
      </div>
    </div>
  )
}
