/** Color and label configuration for chart data series */
export type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

/** Configuration for a single bar series */
export interface BarConfig {
  dataKey: string
  fill?: string
  radius?: number
}

/** Configuration for the X axis */
export interface XAxisConfig {
  dataKey: string
  tickFormatter?: (value: string) => string
  hide?: boolean
}

/** Configuration for the Y axis */
export interface YAxisConfig {
  hide?: boolean
  tickFormatter?: (value: number) => string
}

/** Configuration for the cartesian grid */
export interface CartesianGridConfig {
  vertical?: boolean
  horizontal?: boolean
}

/** Configuration for chart tooltip */
export interface TooltipConfig {
  enabled?: boolean
  labelFormatter?: (label: string) => string
}

/** Options for createBarChart */
export interface BarChartOptions {
  data: Record<string, unknown>[]
  config: ChartConfig
  bars: BarConfig[]
  xAxis?: XAxisConfig
  yAxis?: YAxisConfig | boolean
  grid?: CartesianGridConfig
  tooltip?: TooltipConfig | boolean
}

/** Returned handle from createBarChart */
export interface BarChartInstance {
  update: (options: Partial<BarChartOptions>) => void
  destroy: () => void
}
