import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Tooltip Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/tooltip')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tooltip')
    await expect(page.locator('text=A popup that displays contextual information')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add tooltip')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test('displays features section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Features")')).toBeVisible()
    await expect(page.locator('strong:has-text("Hover trigger")')).toBeVisible()
    await expect(page.locator('strong:has-text("Focus trigger")')).toBeVisible()
    await expect(page.locator('strong:has-text("Placement options")')).toBeVisible()
  })

  test.describe('Basic Tooltip', () => {
    test('shows tooltip on hover', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="TooltipBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-tooltip-trigger]')
      const tooltip = basicDemo.locator('[role="tooltip"]')

      // Initially hidden
      await expect(tooltip).not.toBeVisible()

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('This is a tooltip')
    })

    test('hides tooltip on mouse leave', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="TooltipBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-tooltip-trigger]')
      const tooltip = basicDemo.locator('[role="tooltip"]')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toBeVisible()

      // Move mouse away to hide
      await page.mouse.move(0, 0)
      await expect(tooltip).not.toBeVisible()
    })

    test('has correct accessibility attributes', async ({ page }) => {
      const basicDemo = page.locator('[data-bf-scope^="TooltipBasicDemo_"]').first()
      const trigger = basicDemo.locator('[data-tooltip-trigger]')
      const tooltip = basicDemo.locator('[role="tooltip"]')

      // Check aria-describedby
      await expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-basic')

      // Check tooltip has correct id
      await expect(tooltip).toHaveAttribute('id', 'tooltip-basic')
    })
  })

  test.describe('Button with Hover Support', () => {
    test('shows tooltip on hover', async ({ page }) => {
      const buttonDemo = page.locator('[data-bf-scope^="TooltipButtonDemo_"]').first()
      const trigger = buttonDemo.locator('[data-tooltip-trigger]')
      const tooltip = buttonDemo.locator('[role="tooltip"]')

      // Initially hidden
      await expect(tooltip).not.toBeVisible()

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('Keyboard accessible tooltip')
    })

    test('hides tooltip on mouse leave', async ({ page }) => {
      const buttonDemo = page.locator('[data-bf-scope^="TooltipButtonDemo_"]').first()
      const trigger = buttonDemo.locator('[data-tooltip-trigger]')
      const tooltip = buttonDemo.locator('[role="tooltip"]')

      // Hover to show
      await trigger.hover()
      await expect(tooltip).toBeVisible()

      // Move mouse away to hide
      await page.mouse.move(0, 0)
      await expect(tooltip).not.toBeVisible()
    })
  })

  test.describe('Placement Options', () => {
    test('top placement shows tooltip above trigger', async ({ page }) => {
      const topDemo = page.locator('[data-bf-scope^="TooltipTopDemo_"]').first()
      const trigger = topDemo.locator('[data-tooltip-trigger]')
      const tooltip = topDemo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('Top placement')
    })

    test('right placement shows tooltip to the right', async ({ page }) => {
      const rightDemo = page.locator('[data-bf-scope^="TooltipRightDemo_"]').first()
      const trigger = rightDemo.locator('[data-tooltip-trigger]')
      const tooltip = rightDemo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('Right placement')
    })

    test('bottom placement shows tooltip below trigger', async ({ page }) => {
      const bottomDemo = page.locator('[data-bf-scope^="TooltipBottomDemo_"]').first()
      const trigger = bottomDemo.locator('[data-tooltip-trigger]')
      const tooltip = bottomDemo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('Bottom placement')
    })

    test('left placement shows tooltip to the left', async ({ page }) => {
      const leftDemo = page.locator('[data-bf-scope^="TooltipLeftDemo_"]').first()
      const trigger = leftDemo.locator('[data-tooltip-trigger]')
      const tooltip = leftDemo.locator('[role="tooltip"]')

      await trigger.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText('Left placement')
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays TooltipTrigger props', async ({ page }) => {
      await expect(page.locator('h3:has-text("TooltipTrigger")')).toBeVisible()
    })

    test('displays TooltipContent props', async ({ page }) => {
      await expect(page.locator('h3:has-text("TooltipContent")')).toBeVisible()
    })
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Tooltip with Delay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/tooltip')
  })

  test('does not show tooltip before delay duration', async ({ page }) => {
    const delayDemo = page.locator('[data-bf-scope^="TooltipDelayDemo_"]').first()
    const trigger = delayDemo.locator('[data-tooltip-trigger]')
    const tooltip = delayDemo.locator('[role="tooltip"]')

    // Initially hidden
    await expect(tooltip).not.toBeVisible()

    // Hover and immediately check - should NOT be visible yet
    await trigger.hover()
    await expect(tooltip).not.toBeVisible()

    // Wait for delay + buffer
    await page.waitForTimeout(800)
    await expect(tooltip).toBeVisible()
  })

  test('cancels open timer on mouse leave before delay', async ({ page }) => {
    const delayDemo = page.locator('[data-bf-scope^="TooltipDelayDemo_"]').first()
    const trigger = delayDemo.locator('[data-tooltip-trigger]')
    const tooltip = delayDemo.locator('[role="tooltip"]')

    // Hover briefly then leave
    await trigger.hover()
    await page.waitForTimeout(300) // Less than 700ms delay
    await page.mouse.move(0, 0)

    // Wait past original delay - should still not appear
    await page.waitForTimeout(500)
    await expect(tooltip).not.toBeVisible()
  })

  test('immediate tooltip shows without delay when delayDuration is 0', async ({ page }) => {
    const noDelayDemo = page.locator('[data-bf-scope^="TooltipNoDelayDemo_"]').first()
    const trigger = noDelayDemo.locator('[data-tooltip-trigger]')
    const tooltip = noDelayDemo.locator('[role="tooltip"]')

    // Initially hidden
    await expect(tooltip).not.toBeVisible()

    // Hover and immediately check - should be visible
    await trigger.hover()
    await expect(tooltip).toBeVisible()
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page - Tooltip Link', () => {
  test('displays Tooltip component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/tooltip"]')).toBeVisible()
    await expect(page.locator('a[href="/components/tooltip"] h2')).toContainText('Tooltip')
  })

  test('navigates to Tooltip page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/tooltip"]')
    await expect(page).toHaveURL('/components/tooltip')
    await expect(page.locator('h1')).toContainText('Tooltip')
  })
})
