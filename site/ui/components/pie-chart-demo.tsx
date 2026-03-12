"use client"
/**
 * PieChartDemo Components
 *
 * Interactive demos for the Pie Chart component.
 * Uses JSX component API with @barefootjs/chart.
 */

import { createSignal } from '@barefootjs/dom'
import type { ChartConfig } from '@barefootjs/chart'
import {
  ChartContainer,
  PieChart,
  Pie,
  PieTooltip,
} from '@ui/components/ui/chart'

const chartConfig: ChartConfig = {
  chrome: { label: 'Chrome', color: 'hsl(221 83% 53%)' },
  safari: { label: 'Safari', color: 'hsl(280 65% 60%)' },
  firefox: { label: 'Firefox', color: 'hsl(350 65% 55%)' },
  edge: { label: 'Edge', color: 'hsl(142 60% 45%)' },
  other: { label: 'Other', color: 'hsl(45 80% 55%)' },
}

const chartData = [
  { browser: 'chrome', visitors: 275 },
  { browser: 'safari', visitors: 200 },
  { browser: 'firefox', visitors: 187 },
  { browser: 'edge', visitors: 173 },
  { browser: 'other', visitors: 90 },
]

/**
 * Preview demo — browser share pie chart
 */
export function PieChartPreviewDemo() {
  return (
    <div className="w-full space-y-2">
      <div>
        <h4 className="text-sm font-medium">Browser Share</h4>
        <p className="text-xs text-muted-foreground">January - June 2024</p>
      </div>
      <ChartContainer config={chartConfig} className="w-full max-w-[400px] mx-auto">
        <PieChart data={chartData}>
          <PieTooltip />
          <Pie dataKey="visitors" nameKey="browser" />
        </PieChart>
      </ChartContainer>
    </div>
  )
}

/**
 * Basic demo — minimal pie chart
 */
export function PieChartBasicDemo() {
  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="w-full max-w-[400px] mx-auto">
        <PieChart data={chartData}>
          <Pie dataKey="visitors" nameKey="browser" />
        </PieChart>
      </ChartContainer>
    </div>
  )
}

/**
 * Donut demo — pie chart with inner radius
 */
export function PieChartDonutDemo() {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(chartConfig).map(([key, cfg]) => (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={`background:${cfg.color}`} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>
      <ChartContainer config={chartConfig} className="w-full max-w-[400px] mx-auto">
        <PieChart data={chartData}>
          <PieTooltip />
          <Pie dataKey="visitors" nameKey="browser" innerRadius={0.4} />
        </PieChart>
      </ChartContainer>
    </div>
  )
}

/**
 * Interactive demo — signal-driven metric switching
 */
export function PieChartInteractiveDemo() {
  const interactiveData = [
    { browser: 'chrome', visitors: 275, sessions: 450 },
    { browser: 'safari', visitors: 200, sessions: 320 },
    { browser: 'firefox', visitors: 187, sessions: 280 },
    { browser: 'edge', visitors: 173, sessions: 210 },
    { browser: 'other', visitors: 90, sessions: 150 },
  ]

  const [metric, setMetric] = createSignal<'visitors' | 'sessions'>('visitors')

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Metric:</span>
        <button
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 ${
            metric() === 'visitors'
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => setMetric('visitors')}
        >
          Visitors
        </button>
        <button
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 ${
            metric() === 'sessions'
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => setMetric('sessions')}
        >
          Sessions
        </button>
      </div>
      <ChartContainer config={chartConfig} className="w-full max-w-[400px] mx-auto">
        <PieChart data={interactiveData}>
          <PieTooltip />
          <Pie dataKey={metric()} nameKey="browser" innerRadius={0.3} paddingAngle={2} />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
