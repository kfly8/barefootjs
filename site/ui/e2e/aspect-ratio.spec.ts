import { test, expect } from '@playwright/test'

test.describe('Aspect Ratio Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/aspect-ratio')
  })

  test.describe('Preview', () => {
    test('renders image with aspect ratio container', async ({ page }) => {
      const container = page.locator('[data-slot="aspect-ratio"]').first()

      await expect(container).toBeVisible()
    })

    test('image is present inside container', async ({ page }) => {
      const container = page.locator('[data-slot="aspect-ratio"]').first()
      const img = container.locator('img')

      await expect(img).toBeVisible()
    })
  })

  test.describe('Basic', () => {
    test('renders multiple aspect ratio containers', async ({ page }) => {
      const containers = page.locator('[data-slot="aspect-ratio"]')

      // Preview (1) + Basic (3) = 4 containers
      await expect(containers).toHaveCount(4)
    })
  })
})
