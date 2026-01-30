/**
 * ReactiveProps E2E Tests
 *
 * Verifies reactivity model documented in spec/compiler.md:
 * - Signal access via getter calls: count()
 * - createMemo reactive derivation
 * - Parent-to-child reactive props propagation
 * - Callback props from child to parent
 */

import { test, expect } from '@playwright/test'

/**
 * Run reactive props E2E tests.
 *
 * @param baseUrl - The base URL of the server
 */
export function reactivePropsTests(baseUrl: string) {
  test.describe('Reactivity Model', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/reactive-props`)
    })

    test.describe('Signal Access (count())', () => {
      test('displays initial count of 0', async ({ page }) => {
        await expect(page.locator('.parent-count')).toContainText('0')
      })

      test('updates when signal changes', async ({ page }) => {
        await page.click('.btn-parent-increment')
        await expect(page.locator('.parent-count')).toContainText('1')

        await page.click('.btn-parent-increment')
        await expect(page.locator('.parent-count')).toContainText('2')
      })
    })

    test.describe('createMemo (doubled())', () => {
      test('displays initial doubled value of 0', async ({ page }) => {
        await expect(page.locator('.parent-doubled')).toContainText('0')
      })

      test('updates when dependent signal changes', async ({ page }) => {
        await page.click('.btn-parent-increment')
        await expect(page.locator('.parent-doubled')).toContainText('2')

        await page.click('.btn-parent-increment')
        await expect(page.locator('.parent-doubled')).toContainText('4')
      })
    })

    test.describe('Parent-to-Child Props', () => {
      test('child receives initial prop value', async ({ page }) => {
        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })
        await expect(childA.locator('.child-value')).toHaveText('0')
      })

      test('child updates when parent signal changes', async ({ page }) => {
        await page.click('.btn-parent-increment')

        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })
        await expect(childA.locator('.child-value')).toHaveText('1')
      })

      test('multiple children receive different reactive props', async ({ page }) => {
        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })
        const childB = page.locator('.reactive-child').filter({ hasText: 'Child B' })

        // Initial state
        await expect(childA.locator('.child-value')).toHaveText('0')
        await expect(childB.locator('.child-value')).toHaveText('0')

        // After increment
        await page.click('.btn-parent-increment')
        await expect(childA.locator('.child-value')).toHaveText('1')
        await expect(childB.locator('.child-value')).toHaveText('2') // doubled
      })
    })

    test.describe('Callback Props (child to parent)', () => {
      test('child can trigger parent state change', async ({ page }) => {
        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })

        await childA.locator('.btn-child-increment').click()
        await expect(page.locator('.parent-count')).toContainText('1')
      })

      test('all children share same callback effect', async ({ page }) => {
        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })
        const childB = page.locator('.reactive-child').filter({ hasText: 'Child B' })

        await childA.locator('.btn-child-increment').click()
        await childB.locator('.btn-child-increment').click()

        await expect(page.locator('.parent-count')).toContainText('2')
        await expect(childA.locator('.child-value')).toHaveText('2')
        await expect(childB.locator('.child-value')).toHaveText('4') // doubled
      })
    })

    test.describe('Full Reactivity Chain', () => {
      test('parent -> child -> callback -> parent -> all children', async ({ page }) => {
        const childA = page.locator('.reactive-child').filter({ hasText: 'Child A' })
        const childB = page.locator('.reactive-child').filter({ hasText: 'Child B' })

        // Increment via parent button
        await page.click('.btn-parent-increment')

        // Verify all update
        await expect(page.locator('.parent-count')).toContainText('1')
        await expect(page.locator('.parent-doubled')).toContainText('2')
        await expect(childA.locator('.child-value')).toHaveText('1')
        await expect(childB.locator('.child-value')).toHaveText('2')

        // Increment via child A button
        await childA.locator('.btn-child-increment').click()

        // Verify all update again
        await expect(page.locator('.parent-count')).toContainText('2')
        await expect(page.locator('.parent-doubled')).toContainText('4')
        await expect(childA.locator('.child-value')).toHaveText('2')
        await expect(childB.locator('.child-value')).toHaveText('4')
      })
    })
  })
}
