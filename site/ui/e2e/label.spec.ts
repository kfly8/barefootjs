import { test, expect } from '@playwright/test'

test.describe('Label Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/label')
  })

  test.describe('Preview', () => {
    test('displays label with data-slot', async ({ page }) => {
      const label = page.locator('label[data-slot="label"]').first()
      await expect(label).toBeVisible()
    })
  })

  test.describe('Form Example', () => {
    test('has labels with for attribute', async ({ page }) => {
      const nameLabel = page.locator('label[data-slot="label"][for="label-name"]')
      await expect(nameLabel).toBeVisible()
      await expect(nameLabel).toContainText('Name')

      const emailLabel = page.locator('label[data-slot="label"][for="label-email"]')
      await expect(emailLabel).toBeVisible()
      await expect(emailLabel).toContainText('Email')
    })

    test('labels are associated with inputs via for/id', async ({ page }) => {
      const nameInput = page.locator('input#label-name')
      await expect(nameInput).toBeVisible()

      const emailInput = page.locator('input#label-email')
      await expect(emailInput).toBeVisible()
    })
  })

  test.describe('Disabled Example', () => {
    test('shows disabled input', async ({ page }) => {
      const input = page.locator('input#label-disabled')
      await expect(input).toBeDisabled()
    })

    test('label has disabled styling via group', async ({ page }) => {
      const label = page.locator('label[data-slot="label"][for="label-disabled"]')
      await expect(label).toBeVisible()
      await expect(label).toContainText('Disabled field')
    })
  })
})
