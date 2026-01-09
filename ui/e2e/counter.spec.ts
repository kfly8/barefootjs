import { test, expect } from '@playwright/test'

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Counter Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/counter')
  })

  test('displays page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Counter')
    await expect(page.locator('text=A numeric input with increment and decrement')).toBeVisible()
  })

  test('displays installation section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Installation")')).toBeVisible()
    await expect(page.locator('text=bunx barefoot add counter')).toBeVisible()
  })

  test('displays usage section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Usage")')).toBeVisible()
  })

  test.describe('Counter Rendering', () => {
    test('displays counter elements with increment/decrement buttons', async ({ page }) => {
      const incrementButtons = page.locator('button[aria-label="Increment"]')
      const decrementButtons = page.locator('button[aria-label="Decrement"]')
      await expect(incrementButtons.first()).toBeVisible()
      await expect(decrementButtons.first()).toBeVisible()
    })
  })

  test.describe('Interactive Counter', () => {
    test('displays interactive counter', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterInteractiveDemo_"]').first()
      await expect(counter).toBeVisible()
    })

    test('shows initial value of 0', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterInteractiveDemo_"]').first()
      await expect(counter.locator('.tabular-nums')).toContainText('0')
    })

    test('increments count on plus button click', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterInteractiveDemo_"]').first()
      const incrementButton = counter.locator('button[aria-label="Increment"]')
      const valueDisplay = counter.locator('.tabular-nums')

      await incrementButton.click()
      await expect(valueDisplay).toContainText('1')

      await incrementButton.click()
      await expect(valueDisplay).toContainText('2')
    })

    test('decrements count on minus button click', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterInteractiveDemo_"]').first()
      const incrementButton = counter.locator('button[aria-label="Increment"]')
      const decrementButton = counter.locator('button[aria-label="Decrement"]')
      const valueDisplay = counter.locator('.tabular-nums')

      // First increment to 2
      await incrementButton.click()
      await incrementButton.click()
      await expect(valueDisplay).toContainText('2')

      // Then decrement
      await decrementButton.click()
      await expect(valueDisplay).toContainText('1')
    })
  })

  test.describe('Derived State (Memo)', () => {
    test('displays derived counter example', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterDerivedDemo_"]').first()
      await expect(counter).toBeVisible()
    })

    test('shows doubled value', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterDerivedDemo_"]').first()
      await expect(counter.locator('text=Doubled:')).toBeVisible()
    })

    test('shows is even indicator', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterDerivedDemo_"]').first()
      await expect(counter.locator('text=Is even:')).toBeVisible()
    })

    test('updates derived values on increment', async ({ page }) => {
      const counter = page.locator('[data-bf-scope^="CounterDerivedDemo_"]').first()
      const incrementButton = counter.locator('button[aria-label="Increment"]')

      // Initial: 0, doubled: 0, is even: Yes
      await expect(counter.locator('text=Doubled: 0')).toBeVisible()
      await expect(counter.locator('text=Is even: Yes')).toBeVisible()

      // After increment: 1, doubled: 2, is even: No
      await incrementButton.click()
      await expect(counter.locator('text=Doubled: 2')).toBeVisible()
      await expect(counter.locator('text=Is even: No')).toBeVisible()
    })
  })

  test.describe('Disabled State', () => {
    test('displays disabled counter', async ({ page }) => {
      const disabledButtons = page.locator('button[aria-label="Increment"][disabled], button[aria-label="Decrement"][disabled]')
      expect(await disabledButtons.count()).toBeGreaterThan(0)
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
      await expect(propsTable.locator('td').filter({ hasText: /^value$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^disabled$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onIncrement$/ })).toBeVisible()
      await expect(propsTable.locator('td').filter({ hasText: /^onDecrement$/ })).toBeVisible()
    })
  })
})

// Skip: Focus on Button during issue #126 design phase
test.describe.skip('Home Page - Counter Link', () => {
  test('displays Counter component link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href="/components/counter"]')).toBeVisible()
    await expect(page.locator('a[href="/components/counter"] h2')).toContainText('Counter')
  })

  test('navigates to Counter page on click', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/components/counter"]')
    await expect(page).toHaveURL('/components/counter')
    await expect(page.locator('h1')).toContainText('Counter')
  })
})
