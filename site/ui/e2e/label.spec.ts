import { test, expect } from '@playwright/test'

test.describe('Label Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/label')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Label')
    await expect(page.locator('text=Renders an accessible label associated with controls')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test.describe('Preview', () => {
    test('displays label with data-slot', async ({ page }) => {
      const label = page.locator('label[data-slot="label"]').first()
      await expect(label).toBeVisible()
      await expect(label).toContainText('Your email address')
    })
  })

  test.describe('Form Example', () => {
    test('displays form example heading', async ({ page }) => {
      await expect(page.locator('h3:has-text("Form")')).toBeVisible()
    })

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
    test('displays disabled example heading', async ({ page }) => {
      await expect(page.locator('h3:has-text("Disabled")')).toBeVisible()
    })

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
      await expect(propsTable.locator('td').filter({ hasText: /^for$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^className$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^children$/ })).toBeVisible()
    })
  })
})
