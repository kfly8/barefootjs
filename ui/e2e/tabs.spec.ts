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

test.describe('Tabs Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/tabs')
  })

  test('ArrowRight navigates to next tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
    const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
    const passwordTab = tabs.locator('button[role="tab"]:has-text("Password")')

    // Focus on first tab
    await accountTab.focus()
    await expect(accountTab).toBeFocused()

    // Press ArrowRight to go to next tab
    await page.keyboard.press('ArrowRight')

    // Password tab should be focused and selected
    await expect(passwordTab).toBeFocused()
    await expect(passwordTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ArrowLeft navigates to previous tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
    const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
    const passwordTab = tabs.locator('button[role="tab"]:has-text("Password")')

    // First switch to Password tab
    await passwordTab.click()
    await passwordTab.focus()
    await expect(passwordTab).toBeFocused()

    // Press ArrowLeft to go back to Account tab
    await page.keyboard.press('ArrowLeft')

    // Account tab should be focused and selected
    await expect(accountTab).toBeFocused()
    await expect(accountTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ArrowRight wraps from last to first tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
    const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
    const passwordTab = tabs.locator('button[role="tab"]:has-text("Password")')

    // Focus on last tab (Password)
    await passwordTab.click()
    await passwordTab.focus()

    // Press ArrowRight to wrap to first tab
    await page.keyboard.press('ArrowRight')

    // Account tab should be focused
    await expect(accountTab).toBeFocused()
  })

  test('ArrowLeft wraps from first to last tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsBasicDemo"]').first()
    const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
    const passwordTab = tabs.locator('button[role="tab"]:has-text("Password")')

    // Focus on first tab (Account)
    await accountTab.focus()

    // Press ArrowLeft to wrap to last tab
    await page.keyboard.press('ArrowLeft')

    // Password tab should be focused
    await expect(passwordTab).toBeFocused()
  })

  test('Home key navigates to first tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsMultipleDemo"]').first()
    const notificationsTab = tabs.locator('button[role="tab"]:has-text("Notifications")')
    const overviewTab = tabs.locator('button[role="tab"]:has-text("Overview")')

    // Switch to last tab and focus
    await notificationsTab.click()
    await notificationsTab.focus()

    // Press Home to go to first tab
    await page.keyboard.press('Home')

    // Overview tab should be focused
    await expect(overviewTab).toBeFocused()
  })

  test('End key navigates to last tab', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsMultipleDemo"]').first()
    const notificationsTab = tabs.locator('button[role="tab"]:has-text("Notifications")')
    const overviewTab = tabs.locator('button[role="tab"]:has-text("Overview")')

    // Focus on first tab
    await overviewTab.focus()

    // Press End to go to last tab
    await page.keyboard.press('End')

    // Notifications tab should be focused
    await expect(notificationsTab).toBeFocused()
  })

  test('keyboard navigation skips disabled tabs', async ({ page }) => {
    const tabs = page.locator('[data-bf-scope="TabsDisabledDemo"]').first()
    const activeTab = tabs.locator('button[role="tab"]:has-text("Active")')
    const anotherTab = tabs.locator('button[role="tab"]:has-text("Another")')

    // Focus on Active tab
    await activeTab.click()
    await activeTab.focus()

    // Press ArrowRight - should skip Disabled and go to Another
    await page.keyboard.press('ArrowRight')

    await expect(anotherTab).toBeFocused()
  })
})
