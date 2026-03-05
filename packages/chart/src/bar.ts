import type { BarConfig } from './types'
import type { ScaleBand, ScaleLinear } from 'd3-scale'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Render bar rectangles for all series into an SVG group.
 */
export function renderBars(
  parent: SVGGElement,
  data: Record<string, unknown>[],
  bars: BarConfig[],
  xScale: ScaleBand<string>,
  yScale: ScaleLinear<number, number>,
  height: number,
  xDataKey: string,
): void {
  const bandwidth = xScale.bandwidth()
  const barWidth = bars.length > 1 ? bandwidth / bars.length : bandwidth

  for (let barIdx = 0; barIdx < bars.length; barIdx++) {
    const bar = bars[barIdx]
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', `chart-bar chart-bar-${bar.dataKey}`)

    for (const datum of data) {
      const xValue = String(datum[xDataKey])
      const yValue = Number(datum[bar.dataKey]) || 0
      const x = (xScale(xValue) ?? 0) + barIdx * barWidth
      const y = yScale(yValue)
      const barHeight = height - y

      if (barHeight <= 0) continue

      const rect = document.createElementNS(SVG_NS, 'rect')
      rect.setAttribute('x', String(x))
      rect.setAttribute('y', String(y))
      rect.setAttribute('width', String(barWidth))
      rect.setAttribute('height', String(barHeight))
      rect.setAttribute('fill', bar.fill ?? 'currentColor')

      if (bar.radius && bar.radius > 0) {
        rect.setAttribute('rx', String(bar.radius))
        rect.setAttribute('ry', String(bar.radius))
      }

      rect.setAttribute('data-x', xValue)
      rect.setAttribute('data-y', String(yValue))
      rect.setAttribute('data-key', bar.dataKey)

      g.appendChild(rect)
    }

    parent.appendChild(g)
  }
}
