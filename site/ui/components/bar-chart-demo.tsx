"use client"
/**
 * BarChartDemo Components
 *
 * Interactive demos for the Bar Chart component.
 * Uses @barefootjs/chart to render SVG bar charts with D3 scales.
 */

import { createSignal, onMount, createEffect, onCleanup } from '@barefootjs/dom'
import { createBarChart, applyChartCSSVariables, type ChartConfig, type BarChartOptions } from '@barefootjs/chart'

const chartConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'hsl(221 83% 53%)' },
  mobile: { label: 'Mobile', color: 'hsl(280 65% 60%)' },
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

/**
 * Preview demo — monthly visitors bar chart
 */
export function BarChartPreviewDemo() {
  onMount(() => {
    const container = document.querySelector('[data-chart-demo="preview"]') as HTMLElement
    if (!container) return
    applyChartCSSVariables(container, chartConfig)
    const instance = createBarChart(container, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: 'desktop', fill: 'var(--color-desktop)', radius: 4 },
      ],
      xAxis: { dataKey: 'month', tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
    onCleanup(() => instance.destroy())
  })

  return (
    <div className="w-full space-y-2">
      <div>
        <h4 className="text-sm font-medium">Monthly Visitors</h4>
        <p className="text-xs text-muted-foreground">January - June 2024</p>
      </div>
      <div
        data-chart-demo="preview"
        className="w-full"
        style="color:hsl(var(--foreground))"
      />
    </div>
  )
}

/**
 * Basic demo — minimal bar chart
 */
export function BarChartBasicDemo() {
  onMount(() => {
    const container = document.querySelector('[data-chart-demo="basic"]') as HTMLElement
    if (!container) return
    applyChartCSSVariables(container, chartConfig)
    const instance = createBarChart(container, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: 'desktop', fill: 'var(--color-desktop)', radius: 4 },
      ],
      xAxis: { dataKey: 'month', tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
    })
    onCleanup(() => instance.destroy())
  })

  return (
    <div className="w-full">
      <div
        data-chart-demo="basic"
        className="w-full"
        style="color:hsl(var(--foreground))"
      />
    </div>
  )
}

/**
 * Multiple series demo — grouped bars for desktop and mobile
 */
export function BarChartMultipleDemo() {
  onMount(() => {
    const container = document.querySelector('[data-chart-demo="multiple"]') as HTMLElement
    if (!container) return
    applyChartCSSVariables(container, chartConfig)
    const instance = createBarChart(container, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: 'desktop', fill: 'var(--color-desktop)', radius: 4 },
        { dataKey: 'mobile', fill: 'var(--color-mobile)', radius: 4 },
      ],
      xAxis: { dataKey: 'month', tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
    onCleanup(() => instance.destroy())
  })

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style="background:hsl(221 83% 53%)" />
          <span className="text-xs text-muted-foreground">Desktop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style="background:hsl(280 65% 60%)" />
          <span className="text-xs text-muted-foreground">Mobile</span>
        </div>
      </div>
      <div
        data-chart-demo="multiple"
        className="w-full"
        style="color:hsl(var(--foreground))"
      />
    </div>
  )
}

/**
 * Interactive demo — signal-driven category switching
 */
export function BarChartInteractiveDemo() {
  const [category, setCategory] = createSignal<'desktop' | 'mobile'>('desktop')

  createEffect(() => {
    const container = document.querySelector('[data-chart-demo="interactive"]') as HTMLElement
    if (!container) return

    // Clear previous chart and tooltip
    const oldSvg = container.querySelector('svg')
    if (oldSvg) oldSvg.remove()
    const oldTooltip = container.querySelector('.chart-tooltip')
    if (oldTooltip) oldTooltip.remove()

    applyChartCSSVariables(container, chartConfig)
    const currentCategory = category()
    createBarChart(container, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: currentCategory, fill: `var(--color-${currentCategory})`, radius: 4 },
      ],
      xAxis: { dataKey: 'month', tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <button
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 ${
            category() === 'desktop'
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => setCategory('desktop')}
        >
          Desktop
        </button>
        <button
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 ${
            category() === 'mobile'
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => setCategory('mobile')}
        >
          Mobile
        </button>
      </div>
      <div
        data-chart-demo="interactive"
        className="w-full"
        style="color:hsl(var(--foreground))"
      />
    </div>
  )
}
