import { test, expect } from '@playwright/test'

/**
 * E2E tests for CSS transitions with list reconciliation.
 *
 * Tests verify that:
 * 1. Add operations animate correctly with fade-in + slide-down
 * 2. Remove operations complete correctly without visual glitches
 * 3. Rapid add/remove operations don't cause flickering
 * 4. Multiple items added at once each animate correctly
 * 5. List order is maintained throughout all operations
 */

test.describe.serial('Animated Todo List - CSS Transitions', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset server state before each test
    await request.post('/api/animated-todos/reset')
    await page.goto('/animated-todos')
    // Wait for initial items to render
    await page.waitForSelector('.animated-item')
  })

  test('displays initial items with animation', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('CSS Transitions E2E Test')

    // Check initial items are displayed
    await expect(page.locator('.animated-item')).toHaveCount(2)
    await expect(page.locator('.animated-item').first()).toContainText('First item')
    await expect(page.locator('.animated-item').nth(1)).toContainText('Second item')

    // Verify item count display
    await expect(page.locator('.item-count .count')).toHaveText('2')
  })

  test('add item animates in at correct position', async ({ page }) => {
    const initialCount = await page.locator('.animated-item').count()

    // Type new item and press Enter
    await page.fill('.add-input', 'New animated item')
    await page.press('.add-input', 'Enter')

    // Wait for new item to appear
    await expect(page.locator('.animated-item')).toHaveCount(initialCount + 1)

    // Verify new item is at the end with correct text
    await expect(page.locator('.animated-item').last()).toContainText('New animated item')

    // Verify animation class is present (item has the animated-item class)
    await expect(page.locator('.animated-item').last()).toHaveCSS('animation-name', 'slideIn')

    // Verify count updated
    await expect(page.locator('.item-count .count')).toHaveText(String(initialCount + 1))
  })

  test('add item via button click works correctly', async ({ page }) => {
    const initialCount = await page.locator('.animated-item').count()

    // Type new item
    await page.fill('.add-input', 'Button added item')

    // Click Add button
    await page.click('.add-btn')

    // Wait for new item to appear
    await expect(page.locator('.animated-item')).toHaveCount(initialCount + 1)

    // Verify new item content
    await expect(page.locator('.animated-item').last()).toContainText('Button added item')

    // Verify input is cleared
    await expect(page.locator('.add-input')).toHaveValue('')
  })

  test('remove item updates list correctly', async ({ page }) => {
    const initialCount = await page.locator('.animated-item').count()

    // Click first Remove button
    await page.locator('.remove-btn').first().click()

    // Wait for item to be removed
    await expect(page.locator('.animated-item')).toHaveCount(initialCount - 1)

    // First item should now be "Second item"
    await expect(page.locator('.animated-item').first()).toContainText('Second item')

    // Verify count updated
    await expect(page.locator('.item-count .count')).toHaveText(String(initialCount - 1))
  })

  test('add multiple items at once - each animates correctly', async ({ page }) => {
    const initialCount = await page.locator('.animated-item').count()

    // Click "Add 3" button
    await page.click('.add-multiple-btn')

    // Wait for all 3 new items to appear
    await expect(page.locator('.animated-item')).toHaveCount(initialCount + 3)

    // Verify all new items have animation
    const newItems = page.locator('.animated-item').filter({ hasText: 'Batch item' })
    await expect(newItems).toHaveCount(3)

    // Each batch item should have animation
    for (let i = 0; i < 3; i++) {
      await expect(newItems.nth(i)).toHaveCSS('animation-name', 'slideIn')
    }

    // Verify count updated
    await expect(page.locator('.item-count .count')).toHaveText(String(initialCount + 3))
  })

  test('clear all items removes entire list', async ({ page }) => {
    // Click "Clear All" button
    await page.click('.remove-all-btn')

    // Wait for all items to be removed
    await expect(page.locator('.animated-item')).toHaveCount(0)

    // Verify count is 0
    await expect(page.locator('.item-count .count')).toHaveText('0')
  })

  test('rapid add/remove operations - no visual glitches', async ({ page }) => {
    // Rapidly add multiple items
    for (let i = 0; i < 3; i++) {
      await page.fill('.add-input', `Rapid item ${i + 1}`)
      await page.press('.add-input', 'Enter')
    }

    // Wait for all items to be added
    await expect(page.locator('.animated-item')).toHaveCount(5) // 2 initial + 3 new

    // Rapidly remove items
    for (let i = 0; i < 2; i++) {
      await page.locator('.remove-btn').first().click()
      // Small delay to let DOM update
      await page.waitForTimeout(50)
    }

    // Verify correct final count
    await expect(page.locator('.animated-item')).toHaveCount(3)

    // Verify remaining items are correct (rapid items minus removed ones)
    const texts = await page.locator('.animated-item .item-text').allTextContents()
    expect(texts.length).toBe(3)
  })

  test('correct order maintained after add operations', async ({ page }) => {
    // Add items in sequence
    await page.fill('.add-input', 'Third item')
    await page.press('.add-input', 'Enter')

    await page.fill('.add-input', 'Fourth item')
    await page.press('.add-input', 'Enter')

    // Wait for items
    await expect(page.locator('.animated-item')).toHaveCount(4)

    // Verify order
    const texts = await page.locator('.animated-item .item-text').allTextContents()
    expect(texts).toEqual(['First item', 'Second item', 'Third item', 'Fourth item'])
  })

  test('correct order maintained after remove operations', async ({ page }) => {
    // Add more items first
    await page.click('.add-multiple-btn')
    await expect(page.locator('.animated-item')).toHaveCount(5)

    // Remove the middle item (Second item)
    const secondItem = page.locator('.animated-item').filter({ hasText: 'Second item' })
    await secondItem.locator('.remove-btn').click()

    // Verify remaining items
    await expect(page.locator('.animated-item')).toHaveCount(4)
    const texts = await page.locator('.animated-item .item-text').allTextContents()

    // Second item should be removed, others intact
    expect(texts[0]).toBe('First item')
    expect(texts).not.toContain('Second item')
  })

  test('animation properties are correctly applied', async ({ page }) => {
    // Add a new item
    await page.fill('.add-input', 'Animation test item')
    await page.press('.add-input', 'Enter')

    // Wait for item
    await expect(page.locator('.animated-item').last()).toContainText('Animation test item')

    // Check animation properties
    const item = page.locator('.animated-item').last()

    // Verify animation-duration (0.3s = 300ms or similar)
    const animationDuration = await item.evaluate(el =>
      getComputedStyle(el).animationDuration
    )
    expect(animationDuration).toBe('0.3s')

    // Verify animation-timing-function
    const animationTiming = await item.evaluate(el =>
      getComputedStyle(el).animationTimingFunction
    )
    expect(animationTiming).toContain('ease-out')
  })

  test('items have correct styling', async ({ page }) => {
    const item = page.locator('.animated-item').first()

    // Check background gradient
    const background = await item.evaluate(el =>
      getComputedStyle(el).backgroundImage
    )
    expect(background).toContain('gradient')

    // Check text color is white
    const color = await item.evaluate(el =>
      getComputedStyle(el).color
    )
    // White in rgb format
    expect(color).toBe('rgb(255, 255, 255)')
  })

  test('add and remove same item in sequence', async ({ page }) => {
    const initialCount = await page.locator('.animated-item').count()

    // Add new item
    await page.fill('.add-input', 'Temporary item')
    await page.press('.add-input', 'Enter')

    // Wait for it to appear
    await expect(page.locator('.animated-item')).toHaveCount(initialCount + 1)

    // Remove it immediately
    await page.locator('.animated-item').last().locator('.remove-btn').click()

    // Verify back to original count
    await expect(page.locator('.animated-item')).toHaveCount(initialCount)

    // Verify "Temporary item" is gone
    await expect(page.locator('.animated-item').filter({ hasText: 'Temporary item' })).toHaveCount(0)
  })

  test('empty list accepts new items correctly', async ({ page }) => {
    // Clear all items
    await page.click('.remove-all-btn')
    await expect(page.locator('.animated-item')).toHaveCount(0)

    // Add item to empty list
    await page.fill('.add-input', 'Fresh start item')
    await page.press('.add-input', 'Enter')

    // Verify item appears with animation
    await expect(page.locator('.animated-item')).toHaveCount(1)
    await expect(page.locator('.animated-item').first()).toContainText('Fresh start item')
    await expect(page.locator('.animated-item').first()).toHaveCSS('animation-name', 'slideIn')
  })
})
