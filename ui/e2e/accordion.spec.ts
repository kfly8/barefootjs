import { test, expect } from '@playwright/test'

test.describe('Accordion Documentation Page', () => {
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
      const accordion = page.locator('[data-bf-scope="AccordionSingleOpenDemo"]').first()
      await expect(accordion).toBeVisible()
    })

    test('first item is open by default', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionSingleOpenDemo"]').first()
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).toBeVisible()
    })

    test('clicking another item closes the first', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionSingleOpenDemo"]').first()
      const secondTrigger = accordion.locator('button:has-text("Is it styled?")')

      // Click second item
      await secondTrigger.click()

      // Second item should be open
      await expect(accordion.locator('text=Yes. It comes with default styles')).toBeVisible()

      // First item content should be hidden
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })

    test('clicking open item closes it', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionSingleOpenDemo"]').first()
      const firstTrigger = accordion.locator('button:has-text("Is it accessible?")')

      // First item is open, click to close
      await firstTrigger.click()

      // Content should be hidden
      await expect(accordion.locator('text=Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeVisible()
    })
  })

  test.describe('Multiple Open Accordion', () => {
    test('displays multiple open accordion example', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionMultipleOpenDemo"]').first()
      await expect(accordion).toBeVisible()
    })

    test('first item is open by default', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionMultipleOpenDemo"]').first()
      await expect(accordion.locator('text=This accordion allows multiple items to be open')).toBeVisible()
    })

    test('can open multiple items simultaneously', async ({ page }) => {
      const accordion = page.locator('[data-bf-scope="AccordionMultipleOpenDemo"]').first()
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
})

test.describe('Home Page - Accordion Link', () => {
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
