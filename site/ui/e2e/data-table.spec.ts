import { test, expect } from '@playwright/test'

test.describe('Data Table Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/data-table')
  })

  test.describe('Sorting (Preview)', () => {
    test('renders table with sort buttons', async ({ page }) => {
      const sortButtons = page.locator('[data-slot="data-table-column-header"]')

      // Preview uses 2 sort buttons (Status, Amount), plus Sorting example reuses same demo = 4
      const count = await sortButtons.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    test('clicking Amount header cycles through 3 sort states', async ({ page }) => {
      // First sort button pair on the page (preview section)
      const amountHeader = page.locator('[data-slot="data-table-column-header"]').filter({ hasText: 'Amount' }).first()

      const firstTable = page.locator('[data-slot="table"]').first()
      const rows = firstTable.locator('[data-slot="table-body"] [data-slot="table-row"]')
      const firstAmountCell = rows.first().locator('[data-slot="table-cell"]').last()

      // Original unsorted order: first row is PAY001 ($316.00)
      await expect(firstAmountCell).toHaveText('$316.00')

      // Click 1: sort ascending — lowest amount first
      await amountHeader.click()
      await expect(firstAmountCell).toHaveText('$242.00')

      // Click 2: sort descending — highest amount first
      await amountHeader.click()
      await expect(firstAmountCell).toHaveText('$874.00')

      // Click 3: reset to unsorted — back to original order
      await amountHeader.click()
      await expect(firstAmountCell).toHaveText('$316.00')
    })
  })

  test.describe('Filtering', () => {
    test('renders filter input', async ({ page }) => {
      const input = page.locator('input[placeholder="Filter emails..."]')

      await expect(input).toBeVisible()
    })

    test('filtering narrows displayed rows', async ({ page }) => {
      const input = page.locator('input[placeholder="Filter emails..."]')

      // Type a filter that matches fewer rows
      await input.fill('ken')

      // Wait for reactive update
      await page.waitForTimeout(200)

      // The filtered table (second table) should show fewer rows
      const filteringSection = input.locator('..')
      const rows = filteringSection.locator('[data-slot="table-body"] [data-slot="table-row"]')
      const count = await rows.count()
      expect(count).toBeLessThanOrEqual(5)
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Pagination', () => {
    test('pagination controls are visible', async ({ page }) => {
      const pagination = page.locator('[data-slot="data-table-pagination"]')

      await expect(pagination).toBeVisible()
    })
  })

  test.describe('Row Selection', () => {
    test('renders checkboxes', async ({ page }) => {
      // The selection demo has checkboxes (select-all + rows)
      const checkboxes = page.locator('button[role="checkbox"]')
      const count = await checkboxes.count()
      expect(count).toBeGreaterThanOrEqual(6) // 1 select-all + 5 rows
    })

    test('clicking row checkbox selects it', async ({ page }) => {
      // Find the checkboxes in the selection demo (last group of checkboxes)
      const allCheckboxes = page.locator('button[role="checkbox"]')
      const totalCount = await allCheckboxes.count()

      // Click the second-to-last group's first non-select-all checkbox
      // The selection demo's checkboxes are the last 6 (1 header + 5 rows)
      const rowCheckbox = allCheckboxes.nth(totalCount - 5) // First row checkbox in selection demo

      await rowCheckbox.click()

      // Should show "1 of 5 row(s) selected."
      await expect(page.locator('text=1 of 5 row(s) selected.')).toBeVisible()
    })

    test('select-all checkbox toggles all rows', async ({ page }) => {
      const allCheckboxes = page.locator('button[role="checkbox"]')
      const totalCount = await allCheckboxes.count()

      // Select-all checkbox is the first one in the selection demo group
      const selectAll = allCheckboxes.nth(totalCount - 6)

      // Click select all
      await selectAll.click()

      // Should show "5 of 5 row(s) selected."
      await expect(page.locator('text=5 of 5 row(s) selected.')).toBeVisible()

      // Click again to deselect all
      await selectAll.click()
      await expect(page.locator('text=0 of 5 row(s) selected.')).toBeVisible()
    })
  })
})
