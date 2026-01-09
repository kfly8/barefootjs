import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Accordion Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/accordion')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Accordion')
    await expect(page.locator('text=A vertically stacked set of interactive headings')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add accordion')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Accordion Rendering', () => {
    test('displays accordion items', async ({ page }) => {
      const accordionItems = page.locator('[data-state]')
      expect(await accordionItems.count()).toBeGreaterThan(0)
    })

    test('displays accordion triggers', async ({ page }) => {
      const triggers = page.locator('button[aria-expanded]')
      expect(await triggers.count()).toBeGreaterThan(0)
    })
  })

  test.describe('Single Open Accordion', () => {
    test('displays single open accordion example', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      await expect(accordion).toBeVisible()
    })

    test('first item is open by default', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).toBeVisible()
    })

    test('clicking another item closes the first', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const secondTrigger = accordion.locator('button:has-text("Is it styled?")')

      // Click second item
      await secondTrigger.click()

      // Second item should be open
      await expect(accordion.locator('text=Yes. It comes with default styles')).toBeVisible()

      // First item content should be hidden
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })

    test('clicking open item closes it', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')

      // First item is open, click to close
      await firstTrigger.click()

      // Content should be hidden
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })
  })

  test.describe('Multiple Open Accordion', () => {
    test('displays multiple open accordion example', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionMultipleOpenDemo_"]').first()
      await expect(accordion).toBeVisible()
    })

    test('first item is open by default', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionMultipleOpenDemo_"]').first()
      await expect(accordion.locator('text=This accordion allows multiple items to be open')).toBeVisible()
    })

    test('can open multiple items simultaneously', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionMultipleOpenDemo_"]').first()
      const secondTrigger = accordion.locator('button:has-text("Second Item")')

      // Click second item to open it
      await secondTrigger.click()

      // Both items should be visible
      await expect(accordion.locator('text=This accordion allows multiple items to be open')).toBeVisible()
      await expect(accordion.locator('text=Each item manages its own open/close state')).toBeVisible()
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays AccordionItem props', async ({ page }) => {
      await expect(page.locator('h3:has-text("AccordionItem")')).toBeVisible()
    })

    test('displays AccordionTrigger props', async ({ page }) => {
      await expect(page.locator('h3:has-text("AccordionTrigger")')).toBeVisible()
    })

    test('displays AccordionContent props', async ({ page }) => {
      await expect(page.locator('h3:has-text("AccordionContent")')).toBeVisible()
    })
  })

  test.describe('Expand/Collapse Animations', () => {
    test('content expands with animation and JS state syncs', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const secondTrigger = accordion.locator('button:has-text("Is it styled?")')
      const secondContent = accordion.locator('[data-bf-scope^="AccordionContent_"]').nth(1)

      // Initially closed
      await expect(secondContent).toHaveAttribute('data-state', 'closed')
      await expect(secondContent).toHaveClass(/grid-rows-\[0fr\]/)

      // Click to open
      await secondTrigger.click()

      // JS state should be "open"
      await expect(secondContent).toHaveAttribute('data-state', 'open')
      await expect(secondContent).toHaveClass(/grid-rows-\[1fr\]/)
      await expect(accordion.locator('text=Yes. It comes with default styles')).toBeVisible()
    })

    test('content collapses with animation and JS state syncs', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
      const firstContent = accordion.locator('[data-bf-scope^="AccordionContent_"]').first()

      // Initially open
      await expect(firstContent).toHaveAttribute('data-state', 'open')
      await expect(firstContent).toHaveClass(/grid-rows-\[1fr\]/)

      // Click to close
      await firstTrigger.click()

      // JS state should be "closed"
      await expect(firstContent).toHaveAttribute('data-state', 'closed')
      await expect(firstContent).toHaveClass(/grid-rows-\[0fr\]/)
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })

    test('rapid clicks result in correct final state', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
      const firstContent = accordion.locator('[data-bf-scope^="AccordionContent_"]').first()

      // Initially open
      await expect(firstContent).toHaveAttribute('data-state', 'open')

      // Rapid clicks (3 clicks = toggle to closed, open, closed)
      await firstTrigger.click()
      await firstTrigger.click()
      await firstTrigger.click()

      // Final state should be closed (odd number of clicks from open)
      await expect(firstContent).toHaveAttribute('data-state', 'closed')
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })

    test('multiple accordion items animate independently', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionMultipleOpenDemo_"]').first()
      const firstContent = accordion.locator('[data-bf-scope^="AccordionContent_"]').first()
      const secondContent = accordion.locator('[data-bf-scope^="AccordionContent_"]').nth(1)
      const secondTrigger = accordion.locator('button:has-text("Second Item")')

      // First is open, second is closed
      await expect(firstContent).toHaveAttribute('data-state', 'open')
      await expect(secondContent).toHaveAttribute('data-state', 'closed')

      // Open second item
      await secondTrigger.click()

      // Both should be open now (multiple open mode)
      await expect(firstContent).toHaveAttribute('data-state', 'open')
      await expect(secondContent).toHaveAttribute('data-state', 'open')

      // Both contents visible
      await expect(accordion.locator('text=This accordion allows multiple items to be open')).toBeVisible()
      await expect(accordion.locator('text=Each item manages its own open/close state')).toBeVisible()
    })

    test('chevron rotates on expand/collapse', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
      const secondTrigger = accordion.locator('button:has-text("Is it styled?")')
      const secondChevron = secondTrigger.locator('svg')

      // Initially closed - no rotation
      await expect(secondChevron).not.toHaveClass(/rotate-180/)

      // Click to open
      await secondTrigger.click()

      // Should be rotated
      await expect(secondChevron).toHaveClass(/rotate-180/)

      // Click another to close second
      const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
      await firstTrigger.click()

      // Second chevron should not be rotated anymore
      await expect(secondChevron).not.toHaveClass(/rotate-180/)
    })
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page - Accordion Link', () => {
  test('displays Accordion component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/accordion"]')).toBeVisible()
    await expect(page.locator('a[href="/components/accordion"] h2')).toContainText('Accordion')
  })

  test('navigates to Accordion page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/accordion"]')
    await expect(page).toHaveURL('/components/accordion')
    await expect(page.locator('h1')).toContainText('Accordion')
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Accordion Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/accordion')
  })

  test('ArrowDown navigates to next accordion trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const secondTrigger = accordion.locator('button:has-text("Is it styled?")')

    // Focus on first trigger
    await firstTrigger.focus()
    await expect(firstTrigger).toBeFocused()

    // Press ArrowDown to go to next trigger
    await page.keyboard.press('ArrowDown')

    // Second trigger should be focused
    await expect(secondTrigger).toBeFocused()
  })

  test('ArrowUp navigates to previous accordion trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const secondTrigger = accordion.locator('button:has-text("Is it styled?")')

    // Focus on second trigger
    await secondTrigger.focus()
    await expect(secondTrigger).toBeFocused()

    // Press ArrowUp to go to previous trigger
    await page.keyboard.press('ArrowUp')

    // First trigger should be focused
    await expect(firstTrigger).toBeFocused()
  })

  test('ArrowDown wraps from last to first trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const thirdTrigger = accordion.locator('button:has-text("Is it animated?")')

    // Focus on last trigger
    await thirdTrigger.focus()
    await expect(thirdTrigger).toBeFocused()

    // Press ArrowDown to wrap to first
    await page.keyboard.press('ArrowDown')

    // First trigger should be focused
    await expect(firstTrigger).toBeFocused()
  })

  test('ArrowUp wraps from first to last trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const thirdTrigger = accordion.locator('button:has-text("Is it animated?")')

    // Focus on first trigger
    await firstTrigger.focus()
    await expect(firstTrigger).toBeFocused()

    // Press ArrowUp to wrap to last
    await page.keyboard.press('ArrowUp')

    // Last trigger should be focused
    await expect(thirdTrigger).toBeFocused()
  })

  test('Home key navigates to first trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const thirdTrigger = accordion.locator('button:has-text("Is it animated?")')

    // Focus on last trigger
    await thirdTrigger.focus()

    // Press Home to go to first
    await page.keyboard.press('Home')

    // First trigger should be focused
    await expect(firstTrigger).toBeFocused()
  })

  test('End key navigates to last trigger', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')
    const thirdTrigger = accordion.locator('button:has-text("Is it animated?")')

    // Focus on first trigger
    await firstTrigger.focus()

    // Press End to go to last
    await page.keyboard.press('End')

    // Last trigger should be focused
    await expect(thirdTrigger).toBeFocused()
  })

  test('Enter/Space toggles accordion content', async ({ page }) => {
    const accordion = page.locator('[data-bf-scope^="AccordionSingleOpenDemo_"]').first()
    const secondTrigger = accordion.locator('button:has-text("Is it styled?")')

    // Focus on second trigger and press Enter
    await secondTrigger.focus()
    await page.keyboard.press('Enter')

    // Second content should be visible
    await expect(accordion.locator('text=Yes. It comes with default styles')).toBeVisible()
  })
})
