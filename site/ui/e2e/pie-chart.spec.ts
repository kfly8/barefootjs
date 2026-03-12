import { test, expect } from '@playwright/test'

test.describe('Pie Chart Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/charts/pie-chart')
  })

  test.describe('Preview', () => {
    const scope = '[bf-s^="PieChartPreviewDemo_"]:not([data-slot])'

    test('renders an SVG chart', async ({ page }) => {
      const container = page.locator(scope)
      await expect(container.locator('svg')).toBeVisible()
    })

    test('renders the correct number of slices', async ({ page }) => {
      const container = page.locator(scope)
      const slices = container.locator('path[data-key="visitors"]')
      await expect(slices).toHaveCount(5)
    })

    test('slices have correct data attributes', async ({ page }) => {
      const container = page.locator(scope)
      const slice = container.locator('path[data-name="chrome"]')
      await expect(slice).toHaveAttribute('data-value', '275')
    })
  })

  test.describe('Playground', () => {
    test('renders chart in playground preview', async ({ page }) => {
      const preview = page.locator('[data-pie-chart-preview]')
      await expect(preview).toBeVisible()
      await expect(preview.locator('svg').first()).toBeVisible()
    })

    test('renders 5 pie slices in playground', async ({ page }) => {
      const preview = page.locator('[data-pie-chart-preview]')
      const paths = preview.locator('path[data-key="visitors"]')
      await expect(paths).toHaveCount(5)
    })

    test('changing innerRadius updates the chart', async ({ page }) => {
      const preview = page.locator('[data-pie-chart-preview]')
      const path = preview.locator('path[data-key="visitors"]').first()

      // Get initial d attribute
      const initialD = await path.getAttribute('d')

      // Open the innerRadius select (first combobox in playground)
      const playgroundSection = page.locator('[data-pie-chart-preview]').locator('..').locator('..')
      const innerRadiusSelect = playgroundSection.locator('button[role="combobox"]').first()
      await innerRadiusSelect.click()
      await page.locator('[role="option"]:has-text("0.4")').click()

      // d attribute should change (donut shape)
      const updatedD = await path.getAttribute('d')
      expect(updatedD).not.toBe(initialD)
    })
  })

  test.describe('Basic', () => {
    test('renders an SVG with pie slices', async ({ page }) => {
      const container = page.locator('[bf-s^="PieChartBasicDemo_"]:not([data-slot])')
      await expect(container.locator('svg')).toBeVisible()
      const slices = container.locator('path[data-key="visitors"]')
      await expect(slices).toHaveCount(5)
    })
  })

  test.describe('Donut', () => {
    test('renders a donut chart with inner radius', async ({ page }) => {
      const container = page.locator('[bf-s^="PieChartDonutDemo_"]:not([data-slot])')
      const slices = container.locator('path[data-key="visitors"]')
      await expect(slices).toHaveCount(5)
    })
  })

  test.describe('Interactive', () => {
    test('switching metric updates the chart', async ({ page }) => {
      const section = page.locator('[bf-s^="PieChartInteractiveDemo_"]:not([data-slot])').first()

      // Initially shows visitors data
      await expect(section.locator('path[data-key="visitors"]')).toHaveCount(5)

      // Click Sessions button
      await section.locator('button:has-text("Sessions")').click()

      // Should now show sessions data
      await expect(section.locator('path[data-key="sessions"]')).toHaveCount(5)
      await expect(section.locator('path[data-key="visitors"]')).toHaveCount(0)
    })
  })

  test.describe('Tooltip', () => {
    test('tooltip appears on slice hover', async ({ page }) => {
      const container = page.locator('[bf-s^="PieChartPreviewDemo_"]:not([data-slot])')
      const tooltip = container.locator('.chart-tooltip')

      // Tooltip should be hidden initially
      await expect(tooltip).toHaveCSS('opacity', '0')

      // Hover over a slice
      const slice = container.locator('path[data-name="chrome"]')
      await slice.hover()

      // Tooltip should become visible
      await expect(tooltip).toHaveCSS('opacity', '1')
    })
  })
})
