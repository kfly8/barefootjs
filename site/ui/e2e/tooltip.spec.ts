import { test, expect } from '@playwright/test'

test.describe('Tooltip Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tooltip')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tooltip')
    await expect(page.locator('text=A popup that displays contextual information')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Basic Tooltip', () => {
    test('shows tooltip on hover', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipBasicDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Initially closed
      await expect(tooltip).toHaveAttribute('data-state', 'closed')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('This is a tooltip')
    })

    test('hides tooltip on mouse leave', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipBasicDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')

      // Move mouse away to hide
      await page.mouse.move(0, 0)
      await expect(tooltip).toHaveAttribute('data-state', 'closed')
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipBasicDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Check aria-describedby on trigger
      await expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-basic')

      // Check tooltip has correct id
      await expect(tooltip).toHaveAttribute('id', 'tooltip-basic')
    })
  })

  test.describe('Button Focus', () => {
    test('shows tooltip on hover', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipButtonDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Initially closed
      await expect(tooltip).toHaveAttribute('data-state', 'closed')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('Keyboard accessible tooltip')
    })

    test('hides tooltip on mouse leave', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipButtonDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')

      // Move mouse away to hide
      await page.mouse.move(0, 0)
      await expect(tooltip).toHaveAttribute('data-state', 'closed')
    })
  })

  test.describe('Icon Buttons', () => {
    test('shows tooltip on icon button hover', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipIconDemo_"]:not([data-slot])').first()
      const tooltips = demo.locator('[data-slot="tooltip"]')
      const firstTooltip = demo.locator('[role="tooltip"]').first()

      // Hover first icon button
      await tooltips.first().hover()
      await expect(firstTooltip).toHaveAttribute('data-state', 'open')
      await expect(firstTooltip).toContainText('Bold')
    })
  })

  test.describe('Placement Options', () => {
    test('top placement shows tooltip above trigger', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipTopDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('Top placement')
    })

    test('right placement shows tooltip to the right', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipRightDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('Right placement')
    })

    test('bottom placement shows tooltip below trigger', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipBottomDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('Bottom placement')
    })

    test('left placement shows tooltip to the left', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipLeftDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
      await expect(tooltip).toContainText('Left placement')
    })
  })

  test.describe('Delay', () => {
    test('does not show tooltip before delay duration', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipDelayDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Initially closed
      await expect(tooltip).toHaveAttribute('data-state', 'closed')

      // Hover and immediately check - should NOT be open yet
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'closed')

      // Wait for delay + buffer
      await page.waitForTimeout(800)
      await expect(tooltip).toHaveAttribute('data-state', 'open')
    })

    test('cancels open timer on mouse leave before delay', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipDelayDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Hover briefly then leave by hovering on page header
      await trigger.hover()
      await page.waitForTimeout(300) // Less than 700ms delay
      await page.locator('h1').hover()

      // Wait past original delay - should still not appear
      await page.waitForTimeout(600)
      await expect(tooltip).toHaveAttribute('data-state', 'closed')
    })

    test('immediate tooltip shows without delay when delayDuration is 0', async ({ page }) => {
      const demo = page.locator('[bf-s^="TooltipNoDelayDemo_"]:not([data-slot])').first()
      const trigger = demo.locator('[data-slot="tooltip"]')
      const tooltip = demo.locator('[role="tooltip"]')

      // Initially closed
      await expect(tooltip).toHaveAttribute('data-state', 'closed')

      // Hover and immediately check - should be open
      await trigger.hover()
      await expect(tooltip).toHaveAttribute('data-state', 'open')
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays props table headers', async ({ page }) => {
      await expect(page.locator('th:has-text("Prop")')).toBeVisible()
      await expect(page.locator('th:has-text("Type")')).toBeVisible()
      await expect(page.locator('th:has-text("Default")')).toBeVisible()
      await expect(page.locator('th:has-text("Description")')).toBeVisible()
    })

    test('displays all props', async ({ page }) => {
      const propsTable = page.locator('table')
      await expect(propsTable.locator('td').filter({ hasText: /^content$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^placement$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^delayDuration$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^closeDelay$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^id$/ })).toBeVisible()
    })
  })
})

test.describe('Navigation - Tooltip Link', () => {
  test('displays Tooltip link in sidebar navigation', async ({ page }) => {
    await page.goto('/docs/components/tooltip')
    await expect(page.locator('nav a[href="/docs/components/tooltip"]').last()).toBeVisible()
  })

  test('navigates to Tooltip page from sidebar', async ({ page }) => {
    await page.goto('/docs/components/switch')
    await page.locator('nav a[href="/docs/components/tooltip"]').last().click()
    await expect(page).toHaveURL('/docs/components/tooltip')
    await expect(page.locator('h1')).toContainText('Tooltip')
  })
})
