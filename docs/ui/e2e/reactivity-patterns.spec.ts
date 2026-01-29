import { test, expect } from '@playwright/test'

/**
 * E2E tests to verify the reactivity model documented in spec/compiler.md
 *
 * These tests verify that:
 * 1. Signal getter calls are reactive
 * 2. Props in JSX are reactive (via createEffect)
 * 3. Props in memo/effect are reactive (auto-transformed to props.xxx)
 * 4. Child component props with getters are reactive
 */

test.describe('Reactivity Patterns', () => {
  test.describe('Signal Reactivity', () => {
    test('signal getter in JSX updates when signal changes', async ({ page }) => {
      await page.goto('/docs/components/checkbox#form')

      // Find the Form section with multiple checkboxes
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo"]')
      const checkboxes = section.locator('[data-slot="checkbox"]')
      const selectedText = section.locator('text=/Selected:/')

      // Initial state - Desktop is checked by default
      await expect(selectedText).toContainText('Desktop')

      // Click Mobile checkbox
      const mobileCheckbox = checkboxes.first()
      await mobileCheckbox.dispatchEvent('click')

      // Verify selection updated
      await expect(selectedText).toContainText('Mobile')
      await expect(selectedText).toContainText('Desktop')
    })
  })

  test.describe('Props Reactivity (Parent → Child)', () => {
    test('child component updates when parent signal changes via getter', async ({ page }) => {
      await page.goto('/docs/components/checkbox#form')

      // The CheckboxFormDemo passes `checked={desktop()}` to Checkbox
      // This tests that parent signal changes flow to child via getter
      const section = page.locator('[data-bf-scope^="CheckboxFormDemo_"]:not([data-slot])').first()
      const checkboxes = section.locator('[data-slot="checkbox"]')

      // Desktop checkbox (second one) should be checked initially
      const desktopCheckbox = checkboxes.nth(1)
      await expect(desktopCheckbox).toHaveAttribute('aria-checked', 'true')

      // Click to toggle off
      await desktopCheckbox.dispatchEvent('click')
      await expect(desktopCheckbox).toHaveAttribute('aria-checked', 'false')

      // Verify the selected text updated (props reactivity working)
      const selectedText = section.locator('text=/Selected:/')
      await expect(selectedText).not.toContainText('Desktop')
    })
  })

  test.describe('Memo Reactivity', () => {
    test('memo updates when dependency signal changes', async ({ page }) => {
      // The checkbox component uses:
      // const isControlled = createMemo(() => props.checked !== undefined)
      // const isChecked = createMemo(() => isControlled() ? controlledChecked() : internalChecked())

      await page.goto('/docs/components/checkbox')

      // Use the terms demo at the top (CheckboxTermsDemo)
      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo"]')
      const checkbox = section.locator('[data-slot="checkbox"]')

      // This checkbox is controlled (checked prop is passed)
      // The isControlled memo should return true
      // The isChecked memo should track controlledChecked

      // Click to verify memo chain updates correctly
      await checkbox.dispatchEvent('click')
      await expect(checkbox).toHaveAttribute('data-state', 'checked')

      await checkbox.dispatchEvent('click')
      await expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })
  })

  test.describe('Uncontrolled Mode (Internal State)', () => {
    test('uncontrolled checkbox uses internal signal', async ({ page }) => {
      await page.goto('/docs/components/checkbox#with-text')

      // The uncontrolled checkbox has no `checked` prop
      // It should use internalChecked signal
      const section = page.locator('[data-bf-scope^="CheckboxWithTextDemo"]')
      const checkbox = section.locator('[data-slot="checkbox"]')

      // Initial state
      await expect(checkbox).toHaveAttribute('aria-checked', 'false')

      // Click - internal state should update
      // Use dispatchEvent to avoid label double-trigger issue
      await checkbox.dispatchEvent('click')
      await expect(checkbox).toHaveAttribute('aria-checked', 'true')
      await expect(checkbox.locator('svg')).toBeVisible()

      // Toggle back
      await checkbox.dispatchEvent('click')
      await expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  test.describe('JSX Expression Reactivity', () => {
    test('conditional JSX updates based on signal', async ({ page }) => {
      await page.goto('/docs/components/checkbox#form')

      const section = page.locator('[data-bf-scope^="CheckboxFormDemo"]')
      const checkboxes = section.locator('[data-slot="checkbox"]')
      const selectedText = section.locator('text=/Selected:/')

      // Initial: Desktop is selected
      await expect(selectedText).toContainText('Desktop')

      // Click Email checkbox (third one)
      const emailCheckbox = checkboxes.nth(2)
      await emailCheckbox.dispatchEvent('click')

      // Verify both Desktop and Email are now shown
      await expect(selectedText).toContainText('Desktop')
      await expect(selectedText).toContainText('Email')
    })
  })

  test.describe('Attribute Reactivity', () => {
    test('aria-checked attribute updates reactively', async ({ page }) => {
      await page.goto('/docs/components/checkbox')

      // Get first checkbox (terms demo)
      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo"]')
      const checkbox = section.locator('[data-slot="checkbox"]')

      const initialState = await checkbox.getAttribute('aria-checked')
      expect(initialState).toBe('false')

      // Click to toggle
      await checkbox.dispatchEvent('click')

      const newState = await checkbox.getAttribute('aria-checked')
      expect(newState).toBe('true')
    })

    test('data-state attribute updates reactively', async ({ page }) => {
      await page.goto('/docs/components/checkbox')

      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo"]')
      const checkbox = section.locator('[data-slot="checkbox"]')

      await expect(checkbox).toHaveAttribute('data-state', 'unchecked')

      await checkbox.dispatchEvent('click')

      await expect(checkbox).toHaveAttribute('data-state', 'checked')
    })
  })

  test.describe('Button State Binding', () => {
    test('button disabled state updates based on checkbox', async ({ page }) => {
      await page.goto('/docs/components/checkbox')

      const section = page.locator('[data-bf-scope^="CheckboxTermsDemo"]')
      const checkbox = section.locator('[data-slot="checkbox"]')
      const button = section.locator('button:has-text("Continue")')

      // Button should be disabled initially
      await expect(button).toBeDisabled()

      // Check the checkbox
      await checkbox.dispatchEvent('click')

      // Button should now be enabled
      await expect(button).toBeEnabled()

      // Uncheck
      await checkbox.dispatchEvent('click')

      // Button should be disabled again
      await expect(button).toBeDisabled()
    })
  })
})
