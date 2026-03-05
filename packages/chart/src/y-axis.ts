import type { YAxisConfig } from './types'
import type { ScaleLinear } from 'd3-scale'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Render Y axis ticks and labels into an SVG group.
 */
export function renderYAxis(
  parent: SVGGElement,
  scale: ScaleLinear<number, number>,
  config: YAxisConfig,
): void {
  if (config.hide) return

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class', 'chart-y-axis')

  // Axis line
  const line = document.createElementNS(SVG_NS, 'line')
  line.setAttribute('x1', '0')
  line.setAttribute('x2', '0')
  line.setAttribute('y1', String(scale.range()[0]))
  line.setAttribute('y2', String(scale.range()[1]))
  line.setAttribute('stroke', 'currentColor')
  line.setAttribute('stroke-opacity', '0.1')
  g.appendChild(line)

  // Tick labels
  for (const tick of scale.ticks()) {
    const y = scale(tick)
    const text = document.createElementNS(SVG_NS, 'text')
    text.setAttribute('x', '-8')
    text.setAttribute('y', String(y))
    text.setAttribute('text-anchor', 'end')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('fill', 'currentColor')
    text.setAttribute('opacity', '0.5')
    text.setAttribute('font-size', '12')
    text.textContent = config.tickFormatter
      ? config.tickFormatter(tick)
      : String(tick)
    g.appendChild(text)
  }

  parent.appendChild(g)
}
