import { test, expect } from '@playwright/test'

test.describe('Switch Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/switch')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Switch')
    await expect(page.locator('text=A control that allows the user to toggle')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add switch')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Switch Rendering', () => {
    test('displays switch elements', async ({ page }) => {
      const switches = page.locator('button[role="switch"]')
      await expect(switches.first()).toBeVisible()
    })

    test('has multiple switch examples', async ({ page }) => {
      const switches = page.locator('button[role="switch"]')
      expect(await switches.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Interactive Toggle', () => {
    test('displays interactive switch', async ({ page }) => {
      const interactiveSwitch = page.locator('[data-bf-scope="SwitchInteractiveDemo"]').first()
      await expect(interactiveSwitch).toBeVisible()
    })

    test('shows initial Off state', async ({ page }) => {
      const interactiveSwitch = page.locator('[data-bf-scope="SwitchInteractiveDemo"]').first()
      await expect(interactiveSwitch.locator('text=Off')).toBeVisible()
    })

    test('toggles to On state on click', async ({ page }) => {
      const interactiveSwitch = page.locator('[data-bf-scope="SwitchInteractiveDemo"]').first()
      const switchButton = interactiveSwitch.locator('button[role="switch"]')

      await switchButton.click()
      await expect(interactiveSwitch.locator('text=On')).toBeVisible()
    })
  })

  test.describe('Disabled State', () => {
    test('displays disabled switches', async ({ page }) => {
      const disabledSwitches = page.locator('button[role="switch"][disabled]')
      await expect(disabledSwitches).toHaveCount(2)
    })
  })

  test.describe('Settings Panel', () => {
    test('displays settings panel example', async ({ page }) => {
      await expect(page.locator('[data-bf-scope="SwitchSettingsPanelDemo"]').first()).toBeVisible()
    })

    test('shows Wi-Fi, Bluetooth, and Notifications toggles', async ({ page }) => {
      const settingsPanel = page.locator('[data-bf-scope="SwitchSettingsPanelDemo"]').first()
      await expect(settingsPanel.locator('text=Wi-Fi')).toBeVisible()
      await expect(settingsPanel.locator('text=Bluetooth')).toBeVisible()
      await expect(settingsPanel.locator('text=Notifications')).toBeVisible()
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
      await expect(propsTable.locator('td').filter({ hasText: /^checked$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onCheckedChange$/ })).toBeVisible()
    })
  })
})

test.describe('Home Page - Switch Link', () => {
  test('displays Switch component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/switch"]')).toBeVisible()
    await expect(page.locator('a[href="/components/switch"] h2')).toContainText('Switch')
  })

  test('navigates to Switch page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/switch"]')
    await expect(page).toHaveURL('/components/switch')
    await expect(page.locator('h1')).toContainText('Switch')
  })
})
