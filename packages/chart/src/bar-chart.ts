import type { BarChartOptions, BarChartInstance } from './types'
import { createBandScale, createLinearScale } from './utils/scales'
import { renderGrid } from './cartesian-grid'
import { renderXAxis } from './x-axis'
import { renderYAxis } from './y-axis'
import { renderBars } from './bar'
import { createTooltip } from './tooltip'
import { applyChartCSSVariables } from './chart-container'

const SVG_NS = 'http://www.w3.org/2000/svg'
const DEFAULT_MARGIN = { top: 10, right: 12, bottom: 30, left: 40 }
const ASPECT_RATIO = 0.5 // height = width * 0.5

/**
 * Create a bar chart inside the given container element.
 * Returns a handle for updating or destroying the chart.
 */
export function createBarChart(
  container: HTMLElement,
  options: BarChartOptions,
): BarChartInstance {
  applyChartCSSVariables(container, options.config)

  const containerRect = container.getBoundingClientRect()
  const width = containerRect.width || 500
  const height = Math.round(width * ASPECT_RATIO)

  // Set explicit height on container so layout is stable
  container.style.height = `${height}px`
  container.style.minHeight = ''

  const margin = DEFAULT_MARGIN
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.style.width = '100%'
  svg.style.height = `${height}px`
  svg.style.display = 'block'

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('transform', `translate(${margin.left},${margin.top})`)
  svg.appendChild(g)

  const xDataKey = options.xAxis?.dataKey ?? ''
  const barDataKeys = options.bars.map((b) => b.dataKey)
  const xScale = createBandScale(options.data, xDataKey, innerWidth)
  const yScale = createLinearScale(options.data, barDataKeys, innerHeight)

  if (options.grid) {
    renderGrid(g, innerWidth, innerHeight, yScale, options.grid)
  }

  if (options.xAxis) {
    renderXAxis(g, xScale, innerHeight, options.xAxis)
  }

  if (options.yAxis) {
    const yAxisConfig =
      typeof options.yAxis === 'boolean' ? {} : options.yAxis
    renderYAxis(g, yScale, yAxisConfig)
  }

  renderBars(g, options.data, options.bars, xScale, yScale, innerHeight, xDataKey)

  let tooltipHandle: { destroy: () => void } | null = null
  if (options.tooltip) {
    const tooltipConfig =
      typeof options.tooltip === 'boolean' ? {} : options.tooltip
    tooltipHandle = createTooltip(
      container,
      svg,
      g,
      options.data,
      options.bars,
      options.config,
      xScale,
      yScale,
      tooltipConfig,
      xDataKey,
    )
  }

  container.appendChild(svg)

  return {
    update(_newOptions) {
      // Full re-render for simplicity
      this.destroy()
      const instance = createBarChart(container, { ...options, ..._newOptions })
      this.update = instance.update
      this.destroy = instance.destroy
    },
    destroy() {
      tooltipHandle?.destroy()
      svg.remove()
    },
  }
}
