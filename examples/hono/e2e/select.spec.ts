import { test, expect } from '@playwright/test'

test.describe('Select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select')
  })

  test('displays initial value', async ({ page }) => {
    const select = page.locator('.select')
    await expect(select).toHaveValue('option-a')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-a')
  })

  test('changes value on selection', async ({ page }) => {
    const select = page.locator('.select')

    await select.selectOption('option-b')
    await expect(select).toHaveValue('option-b')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-b')
  })

  test('syncs display with selection', async ({ page }) => {
    const select = page.locator('.select')

    await select.selectOption('option-c')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-c')

    await select.selectOption('option-a')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-a')
  })

  test('cycles through all options', async ({ page }) => {
    const select = page.locator('.select')

    // Option A (initial)
    await expect(select).toHaveValue('option-a')

    // Option B
    await select.selectOption('option-b')
    await expect(select).toHaveValue('option-b')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-b')

    // Option C
    await select.selectOption('option-c')
    await expect(select).toHaveValue('option-c')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-c')

    // Back to Option A
    await select.selectOption('option-a')
    await expect(select).toHaveValue('option-a')
    await expect(page.locator('.selected-value')).toContainText('Selected: option-a')
  })
})
