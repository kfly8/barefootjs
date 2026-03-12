import { createContext } from '@barefootjs/dom'
import type { BarChartContextValue, PieChartContextValue, ChartConfig } from './types'

export const BarChartContext = createContext<BarChartContextValue>()

export const PieChartContext = createContext<PieChartContextValue>()

export const ChartConfigContext = createContext<{ config: ChartConfig }>()
