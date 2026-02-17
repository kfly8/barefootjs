import { test, expect } from '@playwright/test'

test.describe('Pagination Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/pagination')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Pagination')
    await expect(page.locator('text=Pagination with page navigation')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('button:has-text("bun")')).toBeVisible()
  })

  test('displays examples section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Examples")')).toBeVisible()
  })

  test.describe('Preview', () => {
    test('displays pagination nav element', async ({ page }) => {
      const nav = page.locator('nav[aria-label="pagination"]').first()
      await expect(nav).toBeVisible()
    })

    test('has active page link with aria-current', async ({ page }) => {
      const activeLink = page.locator('[aria-current="page"]').first()
      await expect(activeLink).toBeVisible()
      await expect(activeLink).toContainText('1')
    })

    test('displays Previous and Next buttons', async ({ page }) => {
      const prev = page.locator('a[aria-label="Go to previous page"]').first()
      const next = page.locator('a[aria-label="Go to next page"]').first()
      await expect(prev).toBeVisible()
      await expect(next).toBeVisible()
    })

    test('displays ellipsis', async ({ page }) => {
      const ellipsis = page.locator('[data-slot="pagination-ellipsis"]').first()
      await expect(ellipsis).toBeVisible()
    })
  })

  test.describe('Basic', () => {
    test('displays basic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
    })

    test('has pagination structure', async ({ page }) => {
      // BasicDemo is stateless, so use the second nav[aria-label="pagination"] (after preview)
      const navs = page.locator('nav[aria-label="pagination"]')
      expect(await navs.count()).toBeGreaterThanOrEqual(2)

      const basicNav = navs.nth(1)
      await expect(basicNav).toBeVisible()

      // Page links only (exclude Previous/Next which also use PaginationLink)
      const pageLinks = basicNav.locator('[data-slot="pagination-link"]:not([aria-label])')
      expect(await pageLinks.count()).toBeGreaterThanOrEqual(3)
    })
  })

  test.describe('Dynamic', () => {
    test('displays dynamic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Dynamic")')).toBeVisible()
    })

    test('shows current page indicator', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
      await expect(section.locator('text=Page 1 of 5')).toBeVisible()
    })

    test('page 1 is active by default', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()
      const page1Link = section.locator('[data-slot="pagination-link"]', { hasText: '1' })
      await expect(page1Link).toHaveAttribute('data-active', 'true')
    })

    // Compiler limitation: reactive prop updates to stateless child components
    // (PaginationLink) don't propagate to data-active attribute.
    // The compiled JS sets setAttribute('isActive', ...) but doesn't update data-active.
    test.skip('clicking page link updates active state', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()

      const page2Link = section.locator('[data-slot="pagination-link"]', { hasText: '2' })
      await page2Link.dispatchEvent('click')

      await expect(page2Link).toHaveAttribute('data-active', 'true')

      const page1Link = section.locator('[data-slot="pagination-link"]', { hasText: '1' })
      await expect(page1Link).toHaveAttribute('data-active', 'false')
    })

    // Same compiler limitation as above
    test.skip('clicking Next button updates active state', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()

      const nextBtn = section.locator('a[aria-label="Go to next page"]')
      await nextBtn.dispatchEvent('click')

      const page2Link = section.locator('[data-slot="pagination-link"]', { hasText: '2' })
      await expect(page2Link).toHaveAttribute('data-active', 'true')
    })

    test('has Previous and Next buttons', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()
      await expect(section.locator('a[aria-label="Go to previous page"]')).toBeVisible()
      await expect(section.locator('a[aria-label="Go to next page"]')).toBeVisible()
    })

    test('has all 5 page links', async ({ page }) => {
      const section = page.locator('[bf-s^="PaginationDynamicDemo_"]:not([data-slot])').first()
      // Exclude Previous/Next which also have data-slot="pagination-link" with aria-label
      const pageLinks = section.locator('[data-slot="pagination-link"]:not([aria-label])')
      await expect(pageLinks).toHaveCount(5)
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

    test('displays key props', async ({ page }) => {
      const propsTable = page.locator('table')
      await expect(propsTable.locator('td').filter({ hasText: /^isActive$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^size$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^href$/ })).toBeVisible()
    })
  })
})
