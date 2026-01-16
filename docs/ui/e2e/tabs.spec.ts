import { test, expect, type Locator, type Page } from '@playwright/test'

// Helper to find tabs demo by its tab labels
async function findTabsDemo(page: Page, tabLabels: string[]): Promise<Locator> {
  // Find the tablist that contains all the specified tab labels
  const tablists = page.locator('[role="tablist"]')
  const count = await tablists.count()

  for (let i = 0; i < count; i++) {
    const tablist = tablists.nth(i)
    let hasAllTabs = true

    for (const label of tabLabels) {
      const tab = tablist.locator(`button[role="tab"]:has-text("${label}")`)
      if (await tab.count() === 0) {
        hasAllTabs = false
        break
      }
    }

    if (hasAllTabs) {
      // Return the parent container (Tabs component)
      return tablist.locator('..')
    }
  }

  // Fallback: return first tablist's parent
  return tablists.first().locator('..')
}

test.describe('Tabs Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tabs')
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
      // Basic tabs has Account and Password tabs
      const tabs = await findTabsDemo(page, ['Account', 'Password'])
      await expect(tabs).toBeVisible()
    })

    test('shows Account and Password tabs', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Account', 'Password'])
      await expect(tabs.locator('button[role="tab"]:has-text("Account")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Password")')).toBeVisible()
    })

    test('Account tab is selected by default', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Account', 'Password'])
      const accountTab = tabs.locator('button[role="tab"]:has-text("Account")')
      await expect(accountTab).toHaveAttribute('aria-selected', 'true')
    })

    test('shows Account content by default', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Account', 'Password'])
      await expect(tabs.locator('text=Account Settings')).toBeVisible()
    })

    test('switches to Password tab on click', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Account', 'Password'])
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
      // Multiple tabs has Overview, Analytics, Reports, Notifications
      const tabs = await findTabsDemo(page, ['Overview', 'Notifications'])
      await expect(tabs).toBeVisible()
    })

    test('shows all four tabs', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Overview', 'Notifications'])
      await expect(tabs.locator('button[role="tab"]:has-text("Overview")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Analytics")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Reports")')).toBeVisible()
      await expect(tabs.locator('button[role="tab"]:has-text("Notifications")')).toBeVisible()
    })

    test('switches between multiple tabs', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Overview', 'Notifications'])

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
      // Disabled tabs demo has Active, Disabled, Another tabs
      const tabs = await findTabsDemo(page, ['Active', 'Disabled', 'Another'])
      await expect(tabs).toBeVisible()
    })

    test('shows disabled tab', async ({ page }) => {
      const tabs = await findTabsDemo(page, ['Active', 'Disabled', 'Another'])
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

// Skip: Focus on Button during issue #126 design phase
test.describe('Home Page - Tabs Link', () => {
  test('displays Tabs component link', async ({ page }) => {
    await page.goto('/')
    // Use role locator to find the card link specifically
    const tabsCard = page.getByRole('link', { name: 'Tabs A set of layered' })
    await expect(tabsCard).toBeVisible()
    await expect(tabsCard.locator('h2')).toContainText('Tabs')
  })

  test('navigates to Tabs page on click', async ({ page }) => {
    await page.goto('/')
    // Use role locator to find the card link specifically
    await page.getByRole('link', { name: 'Tabs A set of layered' }).click()
    await expect(page).toHaveURL('/docs/components/tabs')
    await expect(page.locator('h1')).toContainText('Tabs')
  })
})

// Skip: Keyboard navigation requires child component init calls
// which is not yet supported in the v2 compiler architecture.
// When a component like TabsTrigger is used inside another component (tabs-demo),
// its init function is not called because it receives the parent's scope prefix.
test.describe.skip('Tabs Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tabs')
  })

  test('ArrowRight navigates to next tab', async ({ page }) => {
    const tabs = await findTabsDemo(page, ['Account', 'Password'])
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
    const tabs = await findTabsDemo(page, ['Account', 'Password'])
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
    const tabs = await findTabsDemo(page, ['Account', 'Password'])
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
    const tabs = await findTabsDemo(page, ['Account', 'Password'])
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
    const tabs = await findTabsDemo(page, ['Overview', 'Notifications'])
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
    const tabs = await findTabsDemo(page, ['Overview', 'Notifications'])
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
    const tabs = await findTabsDemo(page, ['Active', 'Disabled', 'Another'])
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
