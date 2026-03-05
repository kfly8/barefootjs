import type { BarConfig, ChartConfig, TooltipConfig } from './types'
import type { ScaleBand, ScaleLinear } from 'd3-scale'

/**
 * Create a tooltip that follows the mouse over bar elements.
 * Returns a handle with a destroy method to clean up listeners.
 */
export function createTooltip(
  container: HTMLElement,
  svg: SVGSVGElement,
  chartGroup: SVGGElement,
  data: Record<string, unknown>[],
  bars: BarConfig[],
  config: ChartConfig,
  xScale: ScaleBand<string>,
  _yScale: ScaleLinear<number, number>,
  tooltipConfig: TooltipConfig,
  xDataKey: string,
): { destroy: () => void } {
  const tooltip = document.createElement('div')
  tooltip.className = 'chart-tooltip'
  Object.assign(tooltip.style, {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 150ms',
    backgroundColor: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: '50',
    whiteSpace: 'nowrap',
  })
  container.style.position = 'relative'
  container.appendChild(tooltip)

  const handleMouseOver = (e: Event): void => {
    const target = e.target as SVGElement
    if (target.tagName !== 'rect' || !target.hasAttribute('data-x')) return

    const xValue = target.getAttribute('data-x') ?? ''
    const datum = data.find((d) => String(d[xDataKey]) === xValue)
    if (!datum) return

    const label = tooltipConfig.labelFormatter
      ? tooltipConfig.labelFormatter(xValue)
      : xValue

    let html = `<div style="font-weight:500;margin-bottom:4px">${label}</div>`
    for (const bar of bars) {
      const value = datum[bar.dataKey]
      const configEntry = config[bar.dataKey]
      const color = bar.fill ?? configEntry?.color ?? 'currentColor'
      const entryLabel = configEntry?.label ?? bar.dataKey
      html += `<div style="display:flex;align-items:center;gap:8px">`
      html += `<span style="width:8px;height:8px;border-radius:2px;background:${color};display:inline-block"></span>`
      html += `<span>${entryLabel}</span>`
      html += `<span style="font-weight:500;margin-left:auto">${value}</span>`
      html += `</div>`
    }
    tooltip.innerHTML = html
    tooltip.style.opacity = '1'
  }

  const handleMouseMove = (e: MouseEvent): void => {
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left + 12
    const y = e.clientY - rect.top - 12
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
  }

  const handleMouseOut = (e: Event): void => {
    const target = e.target as SVGElement
    if (target.tagName === 'rect') {
      tooltip.style.opacity = '0'
    }
  }

  chartGroup.addEventListener('mouseover', handleMouseOver)
  chartGroup.addEventListener('mousemove', handleMouseMove as EventListener)
  chartGroup.addEventListener('mouseout', handleMouseOut)

  return {
    destroy: () => {
      chartGroup.removeEventListener('mouseover', handleMouseOver)
      chartGroup.removeEventListener('mousemove', handleMouseMove as EventListener)
      chartGroup.removeEventListener('mouseout', handleMouseOut)
      tooltip.remove()
    },
  }
}
