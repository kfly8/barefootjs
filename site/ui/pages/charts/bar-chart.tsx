/**
 * Bar Chart Documentation Page
 */

import {
  BarChartPreviewDemo,
  BarChartBasicDemo,
  BarChartMultipleDemo,
  BarChartInteractiveDemo,
} from '@/components/bar-chart-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../../components/shared/docs'
import { getChartNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'multiple', title: 'Multiple', branch: 'child' },
  { id: 'interactive', title: 'Interactive', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const previewCode = `"use client"

import { onMount, onCleanup } from "@barefootjs/dom"
import {
  createBarChart,
  applyChartCSSVariables,
  type ChartConfig,
} from "@barefootjs/chart"

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
}

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

export function BarChartPreviewDemo() {
  onMount(() => {
    const container = document.querySelector(
      '[data-chart-demo="preview"]'
    ) as HTMLElement
    if (!container) return
    applyChartCSSVariables(container, chartConfig)
    const instance = createBarChart(container, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: "desktop", fill: "var(--color-desktop)", radius: 4 },
      ],
      xAxis: {
        dataKey: "month",
        tickFormatter: (v) => v.slice(0, 3),
      },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
    onCleanup(() => instance.destroy())
  })

  return (
    <div
      data-chart-demo="preview"
      className="w-full"
      style="min-height:250px"
    />
  )
}`

const basicCode = `"use client"

import { onMount, onCleanup } from "@barefootjs/dom"
import { createBarChart, applyChartCSSVariables, type ChartConfig } from "@barefootjs/chart"

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
}

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

export function BarChartBasicDemo() {
  onMount(() => {
    const el = document.querySelector('[data-chart-demo="basic"]') as HTMLElement
    if (!el) return
    applyChartCSSVariables(el, chartConfig)
    const instance = createBarChart(el, {
      data: chartData,
      config: chartConfig,
      bars: [{ dataKey: "desktop", fill: "var(--color-desktop)", radius: 4 }],
      xAxis: { dataKey: "month", tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
    })
    onCleanup(() => instance.destroy())
  })

  return <div data-chart-demo="basic" className="w-full" style="min-height:250px" />
}`

const multipleCode = `"use client"

import { onMount, onCleanup } from "@barefootjs/dom"
import { createBarChart, applyChartCSSVariables, type ChartConfig } from "@barefootjs/chart"

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
  mobile: { label: "Mobile", color: "hsl(280 65% 60%)" },
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  // ...
]

export function BarChartMultipleDemo() {
  onMount(() => {
    const el = document.querySelector('[data-chart-demo="multiple"]') as HTMLElement
    if (!el) return
    applyChartCSSVariables(el, chartConfig)
    const instance = createBarChart(el, {
      data: chartData,
      config: chartConfig,
      bars: [
        { dataKey: "desktop", fill: "var(--color-desktop)", radius: 4 },
        { dataKey: "mobile", fill: "var(--color-mobile)", radius: 4 },
      ],
      xAxis: { dataKey: "month", tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
    onCleanup(() => instance.destroy())
  })

  return <div data-chart-demo="multiple" className="w-full" style="min-height:250px" />
}`

const interactiveCode = `"use client"

import { createSignal, createEffect, onCleanup } from "@barefootjs/dom"
import { createBarChart, applyChartCSSVariables, type ChartConfig } from "@barefootjs/chart"

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
  mobile: { label: "Mobile", color: "hsl(280 65% 60%)" },
}

export function BarChartInteractiveDemo() {
  const [category, setCategory] = createSignal<"desktop" | "mobile">("desktop")

  createEffect(() => {
    const el = document.querySelector('[data-chart-demo="interactive"]') as HTMLElement
    if (!el) return
    const oldSvg = el.querySelector("svg")
    if (oldSvg) oldSvg.remove()

    applyChartCSSVariables(el, chartConfig)
    const c = category()
    createBarChart(el, {
      data: chartData,
      config: chartConfig,
      bars: [{ dataKey: c, fill: \\\`var(--color-\\\${c})\\\`, radius: 4 }],
      xAxis: { dataKey: "month", tickFormatter: (v) => v.slice(0, 3) },
      yAxis: true,
      grid: { vertical: false },
      tooltip: true,
    })
  })

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setCategory("desktop")}>Desktop</button>
        <button onClick={() => setCategory("mobile")}>Mobile</button>
      </div>
      <div data-chart-demo="interactive" className="w-full" style="min-height:250px" />
    </div>
  )
}`

const chartProps: PropDefinition[] = [
  {
    name: 'data',
    type: 'Record<string, unknown>[]',
    description: 'Array of data objects. Each object represents one group on the X axis.',
  },
  {
    name: 'config',
    type: 'ChartConfig',
    description: 'Maps each data key to a label and color. Sets CSS variables for theming.',
  },
  {
    name: 'bars',
    type: 'BarConfig[]',
    description: 'Array of bar series. Each entry specifies dataKey, fill color, and optional radius.',
  },
  {
    name: 'xAxis',
    type: 'XAxisConfig',
    description: 'X axis settings: dataKey for labels, optional tickFormatter.',
  },
  {
    name: 'yAxis',
    type: 'YAxisConfig | boolean',
    defaultValue: 'false',
    description: 'Y axis settings. Pass true for defaults or an object with tickFormatter.',
  },
  {
    name: 'grid',
    type: 'CartesianGridConfig',
    description: 'Grid line settings. Control horizontal and vertical grid lines independently.',
  },
  {
    name: 'tooltip',
    type: 'TooltipConfig | boolean',
    defaultValue: 'false',
    description: 'Enable tooltip on bar hover. Pass true for defaults or an object with labelFormatter.',
  },
]

export function BarChartPage() {
  return (
    <DocPage slug="bar-chart" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Bar Chart"
          description="A bar chart component built with SVG and D3 scales."
          {...getChartNavLinks('bar-chart')}
        />

        <Example title="" code={previewCode}>
          <BarChartPreviewDemo />
        </Example>

        <Section id="installation" title="Installation">
          <PackageManagerTabs command="bun add @barefootjs/chart" />
        </Section>

        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <BarChartBasicDemo />
            </Example>

            <Example title="Multiple" code={multipleCode}>
              <BarChartMultipleDemo />
            </Example>

            <Example title="Interactive" code={interactiveCode}>
              <BarChartInteractiveDemo />
            </Example>
          </div>
        </Section>

        <Section id="api-reference" title="API Reference">
          <PropsTable props={chartProps} />
        </Section>
      </div>
    </DocPage>
  )
}
