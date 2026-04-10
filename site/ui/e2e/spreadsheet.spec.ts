import { test, expect } from '@playwright/test'

test.describe('Spreadsheet Block', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => {
      console.log('Page error:', error.message)
    })
    await page.goto('/components/spreadsheet')
  })

  const section = (page: any) =>
    page.locator('[bf-s^="SpreadsheetDemo_"]:not([data-slot])').first()

  test.describe('Initial Render', () => {
    test('renders 20 cells (4 cols × 5 rows)', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.spreadsheet-cell')).toHaveCount(20)
    })

    test('renders column headers', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.col-header')).toHaveCount(4)
    })

    test('renders cell values', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.cell-value').first()).toContainText('Product')
    })

    test('renders computed formula values', async ({ page }) => {
      const s = section(page)
      // D2 = B2 * C2 = 29.99 * 10 = 299.9
      await expect(s.locator('.spreadsheet-cell').nth(7).locator('.cell-value')).toContainText('299.9')
    })

    test('renders SUM formula', async ({ page }) => {
      const s = section(page)
      // D5 is the last cell (index 19)
      await expect(s.locator('.spreadsheet-cell').nth(19).locator('.cell-value')).toContainText('749.65')
    })

    test('shows filled cell count', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.filled-count')).toBeVisible()
    })
  })

  test.describe('Cell Selection', () => {
    test('clicking cell highlights it', async ({ page }) => {
      const s = section(page)
      const cell = s.locator('.spreadsheet-cell').first()
      await cell.click()
      await expect(cell).toHaveClass(/ring-2/)
    })

    test('formula bar shows selected cell ref', async ({ page }) => {
      const s = section(page)
      await s.locator('.spreadsheet-cell').first().click()
      await expect(s.locator('.cell-ref')).toContainText('A1')
    })
  })

  test.describe('Cell Editing', () => {
    test('clicking selected cell enters edit mode', async ({ page }) => {
      const s = section(page)
      const cell = s.locator('.spreadsheet-cell').nth(4) // A2 = Widget
      await cell.click()
      await cell.click()
      await expect(s.locator('.cell-input')).toBeVisible()
    })

    test('editing and pressing Enter commits value', async ({ page }) => {
      const s = section(page)
      const cell = s.locator('.spreadsheet-cell').nth(4) // A2
      await cell.click()
      await cell.click()
      await s.locator('.cell-input').fill('NewProduct')
      await s.locator('.cell-input').press('Enter')
      await expect(cell.locator('.cell-value')).toContainText('NewProduct')
    })

    test('pressing Escape cancels edit', async ({ page }) => {
      const s = section(page)
      const cell = s.locator('.spreadsheet-cell').nth(4) // A2 = Widget
      await cell.click()
      await cell.click()
      await s.locator('.cell-input').fill('Cancelled')
      await s.locator('.cell-input').press('Escape')
      await expect(cell.locator('.cell-value')).toContainText('Widget')
    })
  })

  test.describe('Formula Evaluation', () => {
    test('editing a value updates formula cells', async ({ page }) => {
      const s = section(page)
      // Edit C2 (qty, index 6) from 10 to 20
      const c2 = s.locator('.spreadsheet-cell').nth(6)
      await c2.click()
      await c2.click()
      await s.locator('.cell-input').fill('20')
      await s.locator('.cell-input').press('Enter')
      // D2 = B2 * C2 = 29.99 * 20 = 599.8
      const d2 = s.locator('.spreadsheet-cell').nth(7)
      await expect(d2.locator('.cell-value')).toContainText('599.8')
    })
  })

  test.describe('Clear Cell', () => {
    test('clear button empties selected cell', async ({ page }) => {
      const s = section(page)
      const cell = s.locator('.spreadsheet-cell').nth(4) // A2
      await cell.click()
      await s.locator('.clear-btn').click()
      // Cell should now be empty
      const text = await cell.locator('.cell-value').textContent()
      expect(text?.trim()).toBe('')
    })

    test('clear button is disabled without selection', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.clear-btn')).toBeDisabled()
    })
  })
})
