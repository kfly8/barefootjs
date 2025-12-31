import { test, expect } from '@playwright/test'

test.describe('Card Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/card')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Card')
    await expect(page.locator('text=Displays a card with header, content, and footer')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add card')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Card Preview', () => {
    test('displays preview card with all sub-components', async ({ page }) => {
      // Check that preview card has all parts
      await expect(page.locator('text=Card Title').first()).toBeVisible()
      await expect(page.locator('text=Card Description').first()).toBeVisible()
      await expect(page.locator('text=Card Content').first()).toBeVisible()
      await expect(page.locator('text=Card Footer').first()).toBeVisible()
    })
  })

  test.describe('Card Examples', () => {
    test('displays Simple example', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
      await expect(page.locator('p:has-text("You have 3 unread messages")')).toBeVisible()
    })

    test('displays With Footer example', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Create project' })).toBeVisible()
      await expect(page.locator('p:has-text("Deploy your new project")')).toBeVisible()
      // Check footer has a button
      await expect(page.locator('button:has-text("Create")')).toBeVisible()
    })

    test('displays Minimal example', async ({ page }) => {
      await expect(page.locator('p:has-text("A simple card with only content")')).toBeVisible()
    })
  })

  test.describe('Children Composition', () => {
    test('CardHeader contains CardTitle and CardDescription', async ({ page }) => {
      // Verify composition: CardHeader should contain both title and description
      // Card is a Server Component, so we use text-based selectors
      const card = page.locator('.w-\\[350px\\]').first()
      await expect(card.locator('h3:has-text("Card Title")')).toBeVisible()
      await expect(card.locator('p:has-text("Card Description")')).toBeVisible()
    })

    test('Card contains nested sub-components', async ({ page }) => {
      // Verify composition: Card contains header, content, and footer areas
      // Card is a Server Component, so no data-bf-scope attributes
      const card = page.locator('.w-\\[350px\\]').first()
      // Card structure includes title, description, and content
      await expect(card.locator('text=Card Title')).toBeVisible()
      await expect(card.locator('text=Card Description')).toBeVisible()
      await expect(card.locator('text=Card Content')).toBeVisible()
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays all sub-component sections', async ({ page }) => {
      await expect(page.locator('h3:has-text("Card")').first()).toBeVisible()
      await expect(page.locator('h3:has-text("CardHeader")')).toBeVisible()
      await expect(page.locator('h3:has-text("CardTitle")')).toBeVisible()
      await expect(page.locator('h3:has-text("CardDescription")')).toBeVisible()
      await expect(page.locator('h3:has-text("CardContent")')).toBeVisible()
      await expect(page.locator('h3:has-text("CardFooter")')).toBeVisible()
    })

    test('displays props table headers', async ({ page }) => {
      await expect(page.locator('th:has-text("Prop")').first()).toBeVisible()
      await expect(page.locator('th:has-text("Type")').first()).toBeVisible()
      await expect(page.locator('th:has-text("Description")').first()).toBeVisible()
    })
  })
})
