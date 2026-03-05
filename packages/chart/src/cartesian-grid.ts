import type { CartesianGridConfig } from './types'
import type { ScaleLinear } from 'd3-scale'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Render grid lines into an SVG group.
 */
export function renderGrid(
  parent: SVGGElement,
  width: number,
  height: number,
  yScale: ScaleLinear<number, number>,
  config: CartesianGridConfig,
): void {
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class', 'chart-grid')

  const horizontal = config.horizontal !== false
  const vertical = config.vertical !== false

  if (horizontal) {
    for (const tick of yScale.ticks()) {
      const y = yScale(tick)
      const line = document.createElementNS(SVG_NS, 'line')
      line.setAttribute('x1', '0')
      line.setAttribute('x2', String(width))
      line.setAttribute('y1', String(y))
      line.setAttribute('y2', String(y))
      line.setAttribute('stroke', 'currentColor')
      line.setAttribute('stroke-opacity', '0.1')
      g.appendChild(line)
    }
  }

  if (vertical) {
    for (const tick of yScale.ticks()) {
      const x = (tick / (yScale.domain()[1] || 1)) * width
      const line = document.createElementNS(SVG_NS, 'line')
      line.setAttribute('x1', String(x))
      line.setAttribute('x2', String(x))
      line.setAttribute('y1', '0')
      line.setAttribute('y2', String(height))
      line.setAttribute('stroke', 'currentColor')
      line.setAttribute('stroke-opacity', '0.1')
      g.appendChild(line)
    }
  }

  parent.appendChild(g)
}
