import type { XAxisConfig } from './types'
import type { ScaleBand } from 'd3-scale'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Render X axis ticks and labels into an SVG group.
 */
export function renderXAxis(
  parent: SVGGElement,
  scale: ScaleBand<string>,
  height: number,
  config: XAxisConfig,
): void {
  if (config.hide) return

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class', 'chart-x-axis')
  g.setAttribute('transform', `translate(0,${height})`)

  // Axis line
  const line = document.createElementNS(SVG_NS, 'line')
  line.setAttribute('x1', '0')
  line.setAttribute('x2', String(scale.range()[1]))
  line.setAttribute('y1', '0')
  line.setAttribute('y2', '0')
  line.setAttribute('stroke', 'currentColor')
  line.setAttribute('stroke-opacity', '0.1')
  g.appendChild(line)

  // Tick labels
  const bandwidth = scale.bandwidth()
  for (const value of scale.domain()) {
    const x = (scale(value) ?? 0) + bandwidth / 2
    const text = document.createElementNS(SVG_NS, 'text')
    text.setAttribute('x', String(x))
    text.setAttribute('y', '20')
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', 'currentColor')
    text.setAttribute('opacity', '0.5')
    text.setAttribute('font-size', '12')
    text.textContent = config.tickFormatter ? config.tickFormatter(value) : value
    g.appendChild(text)
  }

  parent.appendChild(g)
}
