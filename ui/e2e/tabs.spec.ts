import { test, expect } from '@playwright/test'

test.describe('Tabs Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/tabs')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tabs')
    await expect(page.locator('text=A set of layered sections of content')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add tabs')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Tabs Rendering', () => {
    test('displays tab list', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]')
      await expect(tablist.first()).toBeVisible()
    })

    test('displays tab triggers', async ({ page }) => {
      const triggers = page.locator('[role="tab"]')
      expect(await triggers.count()).toBeGreaterThan(0)
    })
  })

  test.describe('Basic Tabs', () => {
    test('displays basic tabs example', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
      await expect(tabs).toBeVisible()
    })

    test('shows Account and Password tabs', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
      await expect(tabs.locator('button[role="tab"]:has-text("Account")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Password")')).toBeVisible()
    })

    test('Account tab is selected by default', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
      const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
      await expect(accountTab).toHaveAttribute('aria-selected', 'true')
    })

    test('shows Account content by default', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
      await expect(tabs.locator('text=Account Settings')).toBeVisible()
    })

    test('switches to Password tab on click', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
      const passwordTab = tabs.locator('button[role="tab"]:has-text("Password")')

      await passwordTab.click()

      // Password tab should be selected
      await expect(passwordTab).toHaveAttribute('aria-selected', 'true')

      // Password content should be visible
      await expect(tabs.locator('text=Password Settings')).toBeVisible()

      // Account content should be hidden
      await expect(tabs.locator('text=Account Settings')).not.toBeVisible()
    })
  })

  test.describe('Multiple Tabs', () => {
    test('displays multiple tabs example', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsMultipleDemo"]').first()
      await expect(tabs).toBeVisible()
    })

    test('shows all four tabs', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsMultipleDemo"]').first()
      await expect(tabs.locator('button[role="tab"]:has-text("Overview")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Analytics")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Reports")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Notifications")')).toBeVisible()
    })

    test('switches between multiple tabs', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsMultipleDemo"]').first()

      // Click Analytics
      await tabs.locator('button[role="tab"]:has-text("Analytics")').click()
      await expect(tabs.locator('text=Analytics content goes here')).toBeVisible()

      // Click Reports
      await tabs.locator('button[role="tab"]:has-text("Reports")').click()
      await expect(tabs.locator('text=Reports content goes here')).toBeVisible()

      // Click Notifications
      await tabs.locator('button[role="tab"]:has-text("Notifications")').click()
      await expect(tabs.locator('text=Notifications content goes here')).toBeVisible()
    })
  })

  test.describe('Disabled Tab', () => {
    test('displays disabled tabs example', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsDisabledDemo"]').first()
      await expect(tabs).toBeVisible()
    })

    test('shows disabled tab', async ({ page }) => {
      const tabs = page.locator('[data-bf-scope="TabsDisabledDemo"]').first()
      const disabledTab = tabs.locator('button[role="tab"]:has-text("Disabled")')
      await expect(disabledTab).toBeDisabled()
    })
  })

  test.describe('API Reference', () => {
    test('displays API Reference section', async ({ page }) => {
      await expect(page.locator('h2:has-text("API Reference")')).toBeVisible()
    })

    test('displays Tabs props', async ({ page }) => {
      await expect(page.locator('h3').filter({ hasText: /^Tabs$/ })).toBeVisible()
    })

    test('displays TabsTrigger props', async ({ page }) => {
      await expect(page.locator('h3:has-text("TabsTrigger")')).toBeVisible()
    })

    test('displays TabsContent props', async ({ page }) => {
      await expect(page.locator('h3:has-text("TabsContent")')).toBeVisible()
    })
  })
})

test.describe('Home Page - Tabs Link', () => {
  test('displays Tabs component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/tabs"]')).toBeVisible()
    await expect(page.locator('a[href="/components/tabs"] h2')).toContainText('Tabs')
  })

  test('navigates to Tabs page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/tabs"]')
    await expect(page).toHaveURL('/components/tabs')
    await expect(page.locator('h1')).toContainText('Tabs')
  })
})
