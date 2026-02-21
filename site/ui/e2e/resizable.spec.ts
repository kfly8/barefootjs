import { test, expect } from '@playwright/test'

test.describe('Resizable Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/resizable')
  })

  test.describe('Resizable Rendering', () => {
    test('displays resizable panel groups', async ({ page }) => {
      const groups = page.locator('[data-slot="resizable-panel-group"]')
      await expect(groups.first()).toBeVisible()
    })

    test('has multiple examples', async ({ page }) => {
      const groups = page.locator('[data-slot="resizable-panel-group"]')
      // Preview + Horizontal + Vertical + With Handle + Three Panels
      expect(await groups.count()).toBeGreaterThanOrEqual(4)
    })
  })

  test.describe('Preview (Horizontal Demo)', () => {
    test('displays two panels', async ({ page }) => {
      const group = page.locator('[data-slot="resizable-panel-group"]').first()
      await expect(group).toBeVisible()
      await expect(group.locator('text=One')).toBeVisible()
      await expect(group.locator('text=Two')).toBeVisible()
    })

    test('has resize handle', async ({ page }) => {
      const group = page.locator('[data-slot="resizable-panel-group"]').first()
      const handle = group.locator('[data-slot="resizable-handle"]')
      // Handle is w-px (1px wide) so may not pass toBeVisible, check attached instead
      await expect(handle).toBeAttached()
    })

    test('handle has separator role', async ({ page }) => {
      const group = page.locator('[data-slot="resizable-panel-group"]').first()
      const handle = group.locator('[role="separator"]')
      await expect(handle).toBeAttached()
    })

    test('panels have initial sizes', async ({ page }) => {
      const group = page.locator('[data-slot="resizable-panel-group"]').first()
      const panels = group.locator('[data-slot="resizable-panel"]')
      await expect(panels).toHaveCount(2)

      // Both panels should have data-default-size attribute
      const size1 = await panels.first().getAttribute('data-default-size')
      const size2 = await panels.last().getAttribute('data-default-size')
      expect(size1).toBe('50')
      expect(size2).toBe('50')
    })
  })

  test.describe('Vertical Demo', () => {
    test('displays vertical layout', async ({ page }) => {
      await expect(page.locator('h3:has-text("Vertical")')).toBeVisible()
      const group = page.locator('[data-panel-group-direction="vertical"]')
      await expect(group.first()).toBeVisible()
    })

    test('has vertical direction', async ({ page }) => {
      const group = page.locator('[data-panel-group-direction="vertical"]')
      await expect(group.first()).toBeVisible()
    })
  })

  test.describe('With Handle Demo', () => {
    test('displays grip dots', async ({ page }) => {
      await expect(page.locator('h3:has-text("With Handle")')).toBeVisible()

      // Should have SVG grip icon inside a handle
      const handles = page.locator('[data-slot="resizable-handle"] svg')
      expect(await handles.count()).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Three Panels Demo', () => {
    test('displays three panels with handles', async ({ page }) => {
      await expect(page.locator('h3:has-text("Three Panels")')).toBeVisible()

      // The three-panel demo has 3 panels and 2 handles
      // Find a group with 3 panels
      const groups = page.locator('[data-slot="resizable-panel-group"][data-panel-group-direction="horizontal"]')
      const groupCount = await groups.count()

      // Find the one with 3 panels (three-panel demo)
      let threePanelGroup = null
      for (let i = 0; i < groupCount; i++) {
        const group = groups.nth(i)
        const panelCount = await group.locator('[data-slot="resizable-panel"]').count()
        if (panelCount === 3) {
          threePanelGroup = group
          break
        }
      }
      expect(threePanelGroup).toBeTruthy()
      const panels = threePanelGroup!.locator('[data-slot="resizable-panel"]')
      await expect(panels).toHaveCount(3)

      const handles = threePanelGroup!.locator('[data-slot="resizable-handle"]')
      await expect(handles).toHaveCount(2)
    })

    test('panels show correct labels', async ({ page }) => {
      await expect(page.locator('text=Sidebar').first()).toBeVisible()
      await expect(page.locator('text=Content').first()).toBeVisible()
      await expect(page.locator('text=Aside').first()).toBeVisible()
    })
  })

  test.describe('Keyboard Support', () => {
    test('handle is focusable', async ({ page }) => {
      const handle = page.locator('[data-slot="resizable-handle"]').first()
      await expect(handle).toHaveAttribute('tabindex', '0')
    })
  })

})
