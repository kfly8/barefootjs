import { describe, test, expect, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Register happy-dom globals for SVG support
GlobalRegistrator.register()

import { createBarChart } from '../bar-chart'
import { applyChartCSSVariables } from '../chart-container'
import type { ChartConfig, BarChartOptions } from '../types'

const chartConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'hsl(221 83% 53%)' },
  mobile: { label: 'Mobile', color: 'hsl(280 65% 60%)' },
}

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
]

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  // happy-dom doesn't compute layout, so set explicit dimensions
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ width: 400, height: 200, top: 0, left: 0, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => {} }),
  })
  document.body.appendChild(el)
  return el
}

describe('applyChartCSSVariables', () => {
  test('sets CSS custom properties on the container', () => {
    const el = document.createElement('div')
    applyChartCSSVariables(el, chartConfig)

    expect(el.style.getPropertyValue('--color-desktop')).toBe('hsl(221 83% 53%)')
    expect(el.style.getPropertyValue('--color-mobile')).toBe('hsl(280 65% 60%)')
  })
})

describe('createBarChart', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  const baseOptions: BarChartOptions = {
    data: chartData,
    config: chartConfig,
    bars: [{ dataKey: 'desktop', fill: 'var(--color-desktop)', radius: 4 }],
    xAxis: { dataKey: 'month' },
    yAxis: true,
    grid: { vertical: false },
  }

  test('creates an SVG element inside the container', () => {
    createBarChart(container, baseOptions)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  test('renders the correct number of bar rects', () => {
    createBarChart(container, baseOptions)
    const rects = container.querySelectorAll('rect[data-key="desktop"]')
    expect(rects.length).toBe(chartData.length)
  })

  test('renders X axis labels', () => {
    createBarChart(container, baseOptions)
    const texts = container.querySelectorAll('.chart-x-axis text')
    expect(texts.length).toBe(chartData.length)
    expect(texts[0].textContent).toBe('Jan')
  })

  test('supports tickFormatter for X axis', () => {
    createBarChart(container, {
      ...baseOptions,
      xAxis: { dataKey: 'month', tickFormatter: (v) => v.slice(0, 1) },
    })
    const texts = container.querySelectorAll('.chart-x-axis text')
    expect(texts[0].textContent).toBe('J')
  })

  test('renders Y axis labels', () => {
    createBarChart(container, baseOptions)
    const texts = container.querySelectorAll('.chart-y-axis text')
    expect(texts.length).toBeGreaterThan(0)
  })

  test('renders grid lines when grid option is provided', () => {
    createBarChart(container, baseOptions)
    const lines = container.querySelectorAll('.chart-grid line')
    expect(lines.length).toBeGreaterThan(0)
  })

  test('supports multiple bar series', () => {
    createBarChart(container, {
      ...baseOptions,
      bars: [
        { dataKey: 'desktop', fill: 'var(--color-desktop)' },
        { dataKey: 'mobile', fill: 'var(--color-mobile)' },
      ],
    })
    const desktopBars = container.querySelectorAll('rect[data-key="desktop"]')
    const mobileBars = container.querySelectorAll('rect[data-key="mobile"]')
    expect(desktopBars.length).toBe(chartData.length)
    expect(mobileBars.length).toBe(chartData.length)
  })

  test('destroy removes the SVG', () => {
    const instance = createBarChart(container, baseOptions)
    expect(container.querySelector('svg')).not.toBeNull()
    instance.destroy()
    expect(container.querySelector('svg')).toBeNull()
  })

  test('applies CSS variables from config', () => {
    createBarChart(container, baseOptions)
    expect(container.style.getPropertyValue('--color-desktop')).toBe('hsl(221 83% 53%)')
  })
})
