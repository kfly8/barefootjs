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

  /**
   * Props Reactivity Comparison Tests
   *
   * Verifies SolidJS-style reactivity rules:
   * - props.xxx pattern: maintains reactivity
   * - destructured props: loses reactivity (captures initial value)
   */
  test.describe('Props Reactivity Comparison', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseUrl}/props-reactivity`)
    })

    test.describe('Initial State', () => {
      test('both children display initial values correctly', async ({ page }) => {
        const propsStyle = page.locator('.props-style-child')
        const destructuredStyle = page.locator('.destructured-style-child')

        // Initial count is 1
        await expect(page.locator('.parent-count')).toContainText('1')

        // Both show raw value = 1
        await expect(propsStyle.locator('.child-raw-value')).toHaveText('1')
        await expect(destructuredStyle.locator('.child-raw-value')).toHaveText('1')

        // Both show computed value = 10 (1 * 10)
        await expect(propsStyle.locator('.child-computed-value')).toHaveText('10')
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')
      })
    })

    test.describe('Props Style (SolidJS-style)', () => {
      test('raw value updates when parent changes', async ({ page }) => {
        const propsStyle = page.locator('.props-style-child')

        await page.click('.btn-increment')
        await expect(propsStyle.locator('.child-raw-value')).toHaveText('2')

        await page.click('.btn-increment')
        await expect(propsStyle.locator('.child-raw-value')).toHaveText('3')
      })

      test('computed value (createMemo) updates when parent changes', async ({ page }) => {
        const propsStyle = page.locator('.props-style-child')

        await page.click('.btn-increment')
        // 2 * 10 = 20
        await expect(propsStyle.locator('.child-computed-value')).toHaveText('20')

        await page.click('.btn-increment')
        // 3 * 10 = 30
        await expect(propsStyle.locator('.child-computed-value')).toHaveText('30')
      })
    })

    test.describe('Destructured Style (loses reactivity)', () => {
      test('raw value updates when parent changes (SSR re-render)', async ({ page }) => {
        const destructuredStyle = page.locator('.destructured-style-child')

        // Raw value updates because it's passed as a prop to the element
        await page.click('.btn-increment')
        await expect(destructuredStyle.locator('.child-raw-value')).toHaveText('2')
      })

      test('computed value (createMemo) does NOT update - captures initial value', async ({ page }) => {
        const destructuredStyle = page.locator('.destructured-style-child')

        // Initial computed value
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')

        // After increment, computed value should still be 10 (captured at initial render)
        await page.click('.btn-increment')
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')

        // After another increment, still 10
        await page.click('.btn-increment')
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')
      })
    })

    test.describe('Comparison', () => {
      test('props style updates, destructured style stays at initial value', async ({ page }) => {
        const propsStyle = page.locator('.props-style-child')
        const destructuredStyle = page.locator('.destructured-style-child')

        // Increment to 2
        await page.click('.btn-increment')

        // Props style: computed value updates to 20
        await expect(propsStyle.locator('.child-computed-value')).toHaveText('20')

        // Destructured style: computed value stays at 10 (initial)
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')

        // Increment to 3
        await page.click('.btn-increment')

        // Props style: computed value updates to 30
        await expect(propsStyle.locator('.child-computed-value')).toHaveText('30')

        // Destructured style: still 10
        await expect(destructuredStyle.locator('.child-computed-value')).toHaveText('10')
      })
    })
  })
}
