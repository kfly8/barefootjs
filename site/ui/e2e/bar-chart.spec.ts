import { test, expect } from '@playwright/test'

test.describe('Bar Chart Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/charts/bar-chart')
  })

  test.describe('Preview', () => {
    test('renders an SVG chart', async ({ page }) => {
      const container = page.locator('[data-chart-demo="preview"]')
      await expect(container.locator('svg')).toBeVisible()
    })

    test('renders the correct number of bars', async ({ page }) => {
      const container = page.locator('[data-chart-demo="preview"]')
      const bars = container.locator('rect[data-key="desktop"]')
      await expect(bars).toHaveCount(6)
    })

    test('renders X axis labels', async ({ page }) => {
      const container = page.locator('[data-chart-demo="preview"]')
      const xAxisTexts = container.locator('.chart-x-axis text')
      await expect(xAxisTexts.first()).toHaveText('Jan')
    })
  })

  test.describe('Basic', () => {
    test('renders an SVG with bars', async ({ page }) => {
      const container = page.locator('[data-chart-demo="basic"]')
      await expect(container.locator('svg')).toBeVisible()
      const bars = container.locator('rect[data-key="desktop"]')
      await expect(bars).toHaveCount(6)
    })
  })

  test.describe('Multiple', () => {
    test('renders both desktop and mobile bars', async ({ page }) => {
      const container = page.locator('[data-chart-demo="multiple"]')
      const desktopBars = container.locator('rect[data-key="desktop"]')
      const mobileBars = container.locator('rect[data-key="mobile"]')
      await expect(desktopBars).toHaveCount(6)
      await expect(mobileBars).toHaveCount(6)
    })
  })

  test.describe('Interactive', () => {
    test('switching category updates the chart', async ({ page }) => {
      const section = page.locator('[bf-s^="BarChartInteractiveDemo_"]:not([data-slot])').first()
      const container = page.locator('[data-chart-demo="interactive"]')

      // Initially shows desktop bars
      await expect(container.locator('rect[data-key="desktop"]')).toHaveCount(6)
      await expect(container.locator('rect[data-key="mobile"]')).toHaveCount(0)

      // Click Mobile button
      await section.locator('button:has-text("Mobile")').click()

      // Should now show mobile bars
      await expect(container.locator('rect[data-key="mobile"]')).toHaveCount(6)
      await expect(container.locator('rect[data-key="desktop"]')).toHaveCount(0)
    })
  })

  test.describe('Tooltip', () => {
    test('tooltip appears on bar hover', async ({ page }) => {
      const container = page.locator('[data-chart-demo="preview"]')
      const tooltip = container.locator('.chart-tooltip')

      // Tooltip should be hidden initially
      await expect(tooltip).toHaveCSS('opacity', '0')

      // Hover over a bar
      const bar = container.locator('rect[data-key="desktop"]').first()
      await bar.hover()

      // Tooltip should become visible
      await expect(tooltip).toHaveCSS('opacity', '1')
    })
  })
})
