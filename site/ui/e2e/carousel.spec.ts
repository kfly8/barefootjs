import { test, expect } from '@playwright/test'

test.describe('Carousel Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/carousel')
  })

  test.describe('Preview', () => {
    test('renders carousel with region role', async ({ page }) => {
      const carousel = page.locator('[data-slot="carousel"]').first()

      await expect(carousel).toBeVisible()
      await expect(carousel).toHaveAttribute('role', 'region')
      await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
    })

    test('renders carousel items with slide role', async ({ page }) => {
      const items = page.locator('[data-slot="carousel"]').first().locator('[data-slot="carousel-item"]')

      await expect(items.first()).toHaveAttribute('role', 'group')
      await expect(items.first()).toHaveAttribute('aria-roledescription', 'slide')
    })

    test('has prev and next buttons', async ({ page }) => {
      const carousel = page.locator('[data-slot="carousel"]').first()
      const prevBtn = carousel.locator('[data-slot="carousel-previous"]')
      const nextBtn = carousel.locator('[data-slot="carousel-next"]')

      await expect(prevBtn).toBeVisible()
      await expect(nextBtn).toBeVisible()
    })

    test('clicking next navigates to next slide', async ({ page }) => {
      const carousel = page.locator('[data-slot="carousel"]').first()
      const nextBtn = carousel.locator('[data-slot="carousel-next"]')

      // Wait for embla to initialize
      await page.waitForTimeout(500)

      // Click next
      await nextBtn.click()
      await page.waitForTimeout(300)

      // Previous button should now be enabled
      const prevBtn = carousel.locator('[data-slot="carousel-previous"]')
      await expect(prevBtn).not.toBeDisabled()
    })
  })

  test.describe('Sizes', () => {
    test('renders items with basis-1/3 class', async ({ page }) => {
      // Second carousel on the page is the Sizes demo
      const carousel = page.locator('[data-slot="carousel"]').nth(1)
      const items = carousel.locator('[data-slot="carousel-item"]')

      await expect(items.first()).toHaveClass(/basis-1\/3/)
    })
  })

  test.describe('Orientation', () => {
    test('vertical carousel has correct orientation', async ({ page }) => {
      const verticalCarousel = page.locator('[data-slot="carousel"][data-orientation="vertical"]')

      await expect(verticalCarousel).toBeVisible()
    })

    test('vertical carousel content uses flex-col', async ({ page }) => {
      const verticalCarousel = page.locator('[data-slot="carousel"][data-orientation="vertical"]')
      const content = verticalCarousel.locator('[data-slot="carousel-content"]')

      await expect(content).toHaveClass(/flex-col/)
    })

    test('clicking next in vertical carousel navigates', async ({ page }) => {
      const verticalCarousel = page.locator('[data-slot="carousel"][data-orientation="vertical"]')
      const nextBtn = verticalCarousel.locator('[data-slot="carousel-next"]')
      const prevBtn = verticalCarousel.locator('[data-slot="carousel-previous"]')

      // Wait for embla to initialize
      await page.waitForTimeout(500)

      // Previous should be disabled initially
      await expect(prevBtn).toBeDisabled()

      // Click next
      await nextBtn.click()
      await page.waitForTimeout(300)

      // Previous should now be enabled
      await expect(prevBtn).not.toBeDisabled()
    })
  })
})
