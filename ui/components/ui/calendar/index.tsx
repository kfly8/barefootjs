"use client"

import { createSignal, createMemo } from '@barefootjs/dom'

/**
 * Calendar Component
 *
 * A date picker calendar with month navigation.
 * Supports single date and date range selection modes.
 * Supports both controlled and uncontrolled modes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Single mode (controlled)
 * ```tsx
 * <Calendar selected={date()} onSelect={setDate} />
 * ```
 *
 * @example Range mode
 * ```tsx
 * <Calendar mode="range" selected={range()} onSelect={setRange} numberOfMonths={2} />
 * ```
 *
 * @example With constraints
 * ```tsx
 * <Calendar fromDate={new Date()} toDate={addDays(new Date(), 30)} />
 * ```
 */

// --- Types ---

/** Date range type for range selection mode */
export interface DateRange {
  from: Date
  to?: Date
}

// --- Calendar math helpers ---

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function isInRange(date: Date, range: DateRange): boolean {
  if (!range.from || !range.to) return false
  const time = date.getTime()
  return time > range.from.getTime() && time < range.to.getTime()
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function toISODateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface CalendarDay {
  date: Date
  isOutside: boolean
  isToday: boolean
  isDisabled: boolean
}

function generateCalendarDays(
  year: number,
  month: number,
  weekStartsOn: 0 | 1,
  disabled: boolean | ((date: Date) => boolean) | undefined,
  fromDate: Date | undefined,
  toDate: Date | undefined,
  showOutsideDays: boolean,
): CalendarDay[][] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month, 1).getDay()
  // Offset: how many days from previous month to show
  const offset = (firstDay - weekStartsOn + 7) % 7

  const weeks: CalendarDay[][] = []
  let week: CalendarDay[] = []

  // Previous month days
  if (offset > 0) {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevDaysInMonth = getDaysInMonth(prevYear, prevMonth)
    for (let i = offset - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, prevDaysInMonth - i)
      week.push({
        date,
        isOutside: true,
        isToday: isToday(date),
        isDisabled: isDateDisabled(date, disabled, fromDate, toDate),
      })
    }
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    week.push({
      date,
      isOutside: false,
      isToday: isToday(date),
      isDisabled: isDateDisabled(date, disabled, fromDate, toDate),
    })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  // Next month days
  if (week.length > 0) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    let nextDay = 1
    while (week.length < 7) {
      const date = new Date(nextYear, nextMonth, nextDay)
      week.push({
        date,
        isOutside: true,
        isToday: isToday(date),
        isDisabled: isDateDisabled(date, disabled, fromDate, toDate),
      })
      nextDay++
    }
    weeks.push(week)
  }

  // Hide outside days if not showing them
  if (!showOutsideDays) {
    return weeks
  }

  return weeks
}

function isDateDisabled(
  date: Date,
  disabled: boolean | ((date: Date) => boolean) | undefined,
  fromDate: Date | undefined,
  toDate: Date | undefined,
): boolean {
  if (disabled === true) return true
  if (typeof disabled === 'function' && disabled(date)) return true
  if (fromDate) {
    const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    if (date < from) return true
  }
  if (toDate) {
    const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
    if (date > to) return true
  }
  return false
}

// --- Weekday headers ---

const WEEKDAYS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// --- Styles ---

const calendarClasses = 'p-3'
const monthCaptionClasses = 'flex items-center justify-between mb-4'
const monthTitleClasses = 'text-sm font-medium'
const navButtonClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium size-7 bg-transparent hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50'
const weekdayClasses = 'text-muted-foreground text-xs font-medium w-8 text-center'
const dayCellClasses = 'p-0 text-center'
const dayButtonBaseClasses = 'inline-flex items-center justify-center text-sm size-8 font-normal transition-colors'
const dayButtonDefaultClasses = 'rounded-md hover:bg-accent hover:text-accent-foreground'
const dayButtonSelectedClasses = 'rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
const dayButtonTodayClasses = 'rounded-md bg-accent text-accent-foreground'
const dayButtonOutsideClasses = 'rounded-md text-muted-foreground opacity-50'
const dayButtonDisabledClasses = 'rounded-md text-muted-foreground opacity-50 pointer-events-none'
// Range-specific styles (shadcn/ui pattern)
const dayButtonRangeStartClasses = 'bg-primary text-primary-foreground rounded-l-md rounded-r-none'
const dayButtonRangeEndClasses = 'bg-primary text-primary-foreground rounded-r-md rounded-l-none'
const dayButtonRangeMiddleClasses = 'bg-accent text-accent-foreground rounded-none'

// --- Props ---

interface CalendarBaseProps {
  defaultMonth?: Date
  showOutsideDays?: boolean
  disabled?: boolean | ((date: Date) => boolean)
  fromDate?: Date
  toDate?: Date
  weekStartsOn?: 0 | 1
  numberOfMonths?: number
  className?: string
}

interface CalendarSingleProps extends CalendarBaseProps {
  mode?: 'single'
  selected?: Date
  defaultSelected?: Date
  onSelect?: (date: Date | undefined) => void
}

interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range'
  selected?: DateRange
  onSelect?: (range: DateRange | undefined) => void
}

type CalendarProps = CalendarSingleProps | CalendarRangeProps

// --- Component ---

function Calendar(props: CalendarProps) {
  const today = new Date()
  const isRangeMode = () => props.mode === 'range'
  const numMonths = () => props.numberOfMonths ?? 1

  // Determine initial month from props
  const getInitialMonth = (): Date => {
    if (props.defaultMonth) return props.defaultMonth
    if (isRangeMode()) {
      const range = (props as CalendarRangeProps).selected
      if (range?.from) return range.from
    } else {
      const single = props as CalendarSingleProps
      if (single.selected) return single.selected
      if (single.defaultSelected) return single.defaultSelected
    }
    return today
  }
  const initialMonth = getInitialMonth()

  // Month navigation state
  const [currentYear, setCurrentYear] = createSignal(initialMonth.getFullYear())
  const [currentMonth, setCurrentMonth] = createSignal(initialMonth.getMonth())

  // Single mode selection state (controlled/uncontrolled dual-signal pattern)
  const [internalSelected, setInternalSelected] = createSignal<Date | undefined>(
    !isRangeMode() ? (props as CalendarSingleProps).defaultSelected : undefined
  )
  const [controlledSelected, setControlledSelected] = createSignal<Date | undefined>(
    !isRangeMode() ? (props as CalendarSingleProps).selected : undefined
  )
  const isControlled = createMemo(() => !isRangeMode() && (props as CalendarSingleProps).selected !== undefined)
  const selectedDate = createMemo(() => isControlled() ? controlledSelected() : internalSelected())

  // Range mode selection state
  const [internalRange, setInternalRange] = createSignal<DateRange | undefined>(
    isRangeMode() ? (props as CalendarRangeProps).selected : undefined
  )
  const selectedRange = createMemo(() => {
    if (!isRangeMode()) return undefined
    // In range mode, prefer the latest prop value for controlled usage
    const propRange = (props as CalendarRangeProps).selected
    const internal = internalRange()
    return propRange ?? internal
  })

  const weekdays = createMemo(() =>
    (props.weekStartsOn ?? 0) === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN
  )

  // Generate weeks for a specific month offset
  const getWeeksForMonth = (monthOffset: number) => {
    let month = currentMonth() + monthOffset
    let year = currentYear()
    while (month > 11) { month -= 12; year += 1 }
    while (month < 0) { month += 12; year -= 1 }
    return generateCalendarDays(
      year, month,
      props.weekStartsOn ?? 0,
      props.disabled,
      props.fromDate,
      props.toDate,
      props.showOutsideDays !== false,
    )
  }

  const getMonthLabel = (monthOffset: number): string => {
    let month = currentMonth() + monthOffset
    let year = currentYear()
    while (month > 11) { month -= 12; year += 1 }
    return formatMonthYear(new Date(year, month))
  }

  // Check if prev/next month navigation should be disabled
  const isPrevDisabled = createMemo(() => {
    if (!props.fromDate) return false
    const prevMonth = currentMonth() === 0 ? 11 : currentMonth() - 1
    const prevYear = currentMonth() === 0 ? currentYear() - 1 : currentYear()
    const lastDayOfPrev = new Date(prevYear, prevMonth + 1, 0)
    const from = new Date(props.fromDate.getFullYear(), props.fromDate.getMonth(), props.fromDate.getDate())
    return lastDayOfPrev < from
  })

  const isNextDisabled = createMemo(() => {
    if (!props.toDate) return false
    // Account for numberOfMonths: the last visible month is currentMonth + numMonths - 1
    const lastVisibleOffset = numMonths() - 1
    let nextMonth = currentMonth() + lastVisibleOffset
    let nextYear = currentYear()
    while (nextMonth > 11) { nextMonth -= 12; nextYear += 1 }
    // Check the month AFTER the last visible month
    if (nextMonth === 11) { nextMonth = 0; nextYear += 1 } else { nextMonth += 1 }
    const firstDayOfNext = new Date(nextYear, nextMonth, 1)
    const to = new Date(props.toDate.getFullYear(), props.toDate.getMonth(), props.toDate.getDate())
    return firstDayOfNext > to
  })

  // Navigation handlers
  const goToPrevMonth = () => {
    if (currentMonth() === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear() - 1)
    } else {
      setCurrentMonth(currentMonth() - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth() === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear() + 1)
    } else {
      setCurrentMonth(currentMonth() + 1)
    }
  }

  // Restore day button classes based on its data attributes
  const restoreDayClasses = (el: Element): void => {
    const isOutside = el.hasAttribute('data-outside')
    const isTodayEl = el.hasAttribute('data-today')
    const isDisabledEl = el.hasAttribute('data-disabled')
    let classes = dayButtonBaseClasses
    if (isDisabledEl) {
      classes += ` ${dayButtonDisabledClasses}`
    } else if (isOutside) {
      classes += ` ${dayButtonOutsideClasses}`
    } else if (isTodayEl) {
      classes += ` ${dayButtonTodayClasses}`
    } else {
      classes += ` ${dayButtonDefaultClasses}`
    }
    el.className = classes
  }

  // Update calendar UI after single day selection
  const updateSingleUI = (container: HTMLElement, newDate: Date | undefined) => {
    const prevSelected = container.querySelector('[data-selected-single]')
    if (prevSelected) {
      prevSelected.removeAttribute('data-selected-single')
      prevSelected.removeAttribute('aria-selected')
      restoreDayClasses(prevSelected)
    }
    if (newDate) {
      const dayButton = container.querySelector(`[data-date="${toISODateString(newDate)}"]`) as HTMLElement | null
      if (dayButton) {
        dayButton.setAttribute('data-selected-single', '')
        dayButton.setAttribute('aria-selected', 'true')
        dayButton.className = `${dayButtonBaseClasses} ${dayButtonSelectedClasses}`
      }
    }
  }

  // Update calendar UI after range selection
  const updateRangeUI = (container: HTMLElement, range: DateRange | undefined) => {
    // Clear all range attributes
    container.querySelectorAll('[data-selected-range-start], [data-selected-range-end], [data-selected-range-middle]').forEach(el => {
      el.removeAttribute('data-selected-range-start')
      el.removeAttribute('data-selected-range-end')
      el.removeAttribute('data-selected-range-middle')
      el.removeAttribute('aria-selected')
      restoreDayClasses(el)
    })
    if (!range?.from) return

    // Apply start
    const startBtn = container.querySelector(`[data-date="${toISODateString(range.from)}"]`) as HTMLElement | null
    if (startBtn) {
      startBtn.setAttribute('data-selected-range-start', '')
      startBtn.setAttribute('aria-selected', 'true')
      startBtn.className = `${dayButtonBaseClasses} ${range.to ? dayButtonRangeStartClasses : dayButtonSelectedClasses}`
    }

    if (!range.to) return

    // Apply end
    const endBtn = container.querySelector(`[data-date="${toISODateString(range.to)}"]`) as HTMLElement | null
    if (endBtn) {
      endBtn.setAttribute('data-selected-range-end', '')
      endBtn.setAttribute('aria-selected', 'true')
      endBtn.className = `${dayButtonBaseClasses} ${dayButtonRangeEndClasses}`
    }

    // Apply middle days
    const allDayButtons = container.querySelectorAll('[data-slot="calendar-day-button"][data-date]')
    allDayButtons.forEach(btn => {
      const dateStr = btn.getAttribute('data-date')!
      const [y, m, d] = dateStr.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      if (isInRange(date, range) && !btn.hasAttribute('data-outside')) {
        btn.setAttribute('data-selected-range-middle', '')
        btn.setAttribute('aria-selected', 'true')
        btn.className = `${dayButtonBaseClasses} ${dayButtonRangeMiddleClasses}`
      }
    })
  }

  // Event delegation handler for all calendar button clicks.
  // Buttons inside .map() don't get direct event bindings from the compiler,
  // so we delegate from the root element (day buttons + nav buttons).
  const handleCalendarClick = (e: MouseEvent) => {
    const el = e.target as HTMLElement

    // Nav button clicks
    const navPrev = el.closest('[data-slot="calendar-nav-prev"]')
    if (navPrev && !(navPrev as HTMLButtonElement).disabled) {
      goToPrevMonth()
      return
    }
    const navNext = el.closest('[data-slot="calendar-nav-next"]')
    if (navNext && !(navNext as HTMLButtonElement).disabled) {
      goToNextMonth()
      return
    }

    // Day button clicks
    const target = el.closest('[data-slot="calendar-day-button"]') as HTMLElement | null
    if (!target) return
    if (target.hasAttribute('data-disabled')) return

    const dateStr = target.getAttribute('data-date')
    if (!dateStr) return

    const [y, m, d] = dateStr.split('-').map(Number)
    const clickedDate = new Date(y, m - 1, d)
    const container = target.closest('[data-slot="calendar"]') as HTMLElement

    if (isRangeMode()) {
      handleRangeClick(clickedDate, container)
    } else {
      handleSingleClick(clickedDate, container)
    }
  }

  const handleSingleClick = (clickedDate: Date, container: HTMLElement) => {
    const current = selectedDate()
    const newDate = (current && isSameDay(current, clickedDate)) ? undefined : clickedDate

    if (isControlled()) {
      setControlledSelected(newDate)
    } else {
      setInternalSelected(newDate)
    }

    if (container) updateSingleUI(container, newDate)

    // Notify parent
    const scope = container?.closest('[bf-s]')
    // @ts-ignore - onselect is set by parent during hydration
    const scopeCallback = scope?.onselect
    const handler = (props as CalendarSingleProps).onSelect || scopeCallback
    handler?.(newDate)
  }

  const handleRangeClick = (clickedDate: Date, container: HTMLElement) => {
    const current = selectedRange()
    let newRange: DateRange | undefined

    if (!current?.from || (current.from && current.to)) {
      // Start new range
      newRange = { from: clickedDate }
    } else {
      // Complete the range
      if (isSameDay(clickedDate, current.from)) {
        // Click same date: clear
        newRange = undefined
      } else if (clickedDate.getTime() < current.from.getTime()) {
        newRange = { from: clickedDate, to: current.from }
      } else {
        newRange = { from: current.from, to: clickedDate }
      }
    }

    setInternalRange(newRange)
    if (container) updateRangeUI(container, newRange)

    // Notify parent
    const scope = container?.closest('[bf-s]')
    // @ts-ignore - onselect is set by parent during hydration
    const scopeCallback = scope?.onselect
    const handler = (props as CalendarRangeProps).onSelect || scopeCallback
    handler?.(newRange)
  }

  // Day button classes helper
  const getDayClasses = (day: CalendarDay, isSelected: boolean, rangePosition?: 'start' | 'end' | 'middle'): string => {
    if (day.isDisabled) {
      return `${dayButtonBaseClasses} ${dayButtonDisabledClasses}`
    }
    if (rangePosition === 'start') {
      return `${dayButtonBaseClasses} ${dayButtonRangeStartClasses}`
    }
    if (rangePosition === 'end') {
      return `${dayButtonBaseClasses} ${dayButtonRangeEndClasses}`
    }
    if (rangePosition === 'middle') {
      return `${dayButtonBaseClasses} ${dayButtonRangeMiddleClasses}`
    }
    if (isSelected) {
      return `${dayButtonBaseClasses} ${dayButtonSelectedClasses}`
    }
    if (day.isOutside) {
      return `${dayButtonBaseClasses} ${dayButtonOutsideClasses}`
    }
    if (day.isToday) {
      return `${dayButtonBaseClasses} ${dayButtonTodayClasses}`
    }
    return `${dayButtonBaseClasses} ${dayButtonDefaultClasses}`
  }

  // Determine range position for a day
  const getRangePosition = (day: CalendarDay): 'start' | 'end' | 'middle' | undefined => {
    if (day.isOutside) return undefined
    const range = selectedRange()
    if (!range?.from) return undefined
    if (isSameDay(day.date, range.from)) {
      // If range has only from (no to), show as full selected, not range-start
      return range.to ? 'start' : undefined
    }
    if (range.to && isSameDay(day.date, range.to)) return 'end'
    if (isInRange(day.date, range)) return 'middle'
    return undefined
  }

  // Render a single month grid
  const renderMonthGrid = (monthOffset: number) => {
    const weeks = getWeeksForMonth(monthOffset)
    const label = getMonthLabel(monthOffset)
    const showPrev = monthOffset === 0
    const showNext = monthOffset === numMonths() - 1

    return (
      <div data-slot="calendar-month">
        <div data-slot="calendar-month-caption" className={monthCaptionClasses}>
          {showPrev ? (
            <button
              data-slot="calendar-nav-prev"
              className={navButtonClasses}
              disabled={isPrevDisabled()}
              aria-label="Go to previous month"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="size-7" />
          )}
          <span data-slot="calendar-month-title" className={monthTitleClasses}>
            {label}
          </span>
          {showNext ? (
            <button
              data-slot="calendar-nav-next"
              className={navButtonClasses}
              disabled={isNextDisabled()}
              aria-label="Go to next month"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="size-7" />
          )}
        </div>

        <table data-slot="calendar-month-grid" role="grid" className="w-full border-collapse">
          <thead>
            <tr>
              {weekdays().map((dayName) => (
                <th key={dayName} data-slot="calendar-weekday" className={weekdayClasses}>
                  {dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={toISODateString(week[0].date)} data-slot="calendar-week">
                {week.map((day) => {
                  const rangePos = isRangeMode() ? getRangePosition(day) : undefined
                  const isSingleSelected = !isRangeMode() && selectedDate() ? isSameDay(selectedDate()!, day.date) : false
                  // For range mode with only from (no to), show from as selected
                  const isRangeOnlyFrom = isRangeMode() && !day.isOutside && selectedRange()?.from && !selectedRange()?.to && isSameDay(day.date, selectedRange()!.from)
                  const isSelected = isSingleSelected || (isRangeOnlyFrom ?? false)

                  return (
                    <td key={toISODateString(day.date)} data-slot="calendar-day" className={dayCellClasses}>
                      <button
                        data-slot="calendar-day-button"
                        className={getDayClasses(day, isSelected, rangePos)}
                        data-date={toISODateString(day.date)}
                        data-today={day.isToday || undefined}
                        data-outside={day.isOutside || undefined}
                        data-disabled={day.isDisabled || undefined}
                        data-current-month={!day.isOutside || undefined}
                        data-selected-single={isSingleSelected || undefined}
                        data-selected-range-start={rangePos === 'start' || undefined}
                        data-selected-range-end={rangePos === 'end' || undefined}
                        data-selected-range-middle={rangePos === 'middle' || undefined}
                        aria-selected={isSelected || rangePos !== undefined || undefined}
                        disabled={day.isDisabled}
                      >
                        {day.date.getDate()}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Month offsets for multi-month rendering
  const monthOffsets = () => Array.from({ length: numMonths() }, (_, i) => i)

  return (
    <div data-slot="calendar" className={`${calendarClasses} ${props.className ?? ''}`} onClick={handleCalendarClick}>
      <div className={numMonths() > 1 ? 'flex gap-4' : ''}>
        {monthOffsets().map(offset => renderMonthGrid(offset))}
      </div>
    </div>
  )
}

export { Calendar }
export type { CalendarProps, CalendarSingleProps, CalendarRangeProps }
