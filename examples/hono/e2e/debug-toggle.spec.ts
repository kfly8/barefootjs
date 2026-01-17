/**
 * Debug test - toggle todo done state
 */
import { test, expect } from '@playwright/test';

test('debug: toggle todo done state', async ({ page }) => {
  // Capture console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Intercept fetch
  await page.route('**/api/todos/**', route => {
    console.log(`[FETCH] ${route.request().method()} ${route.request().url()}`);
    route.continue();
  });

  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Check initial state
  console.log('\n=== Initial State ===');
  const firstItem = page.locator('li').first();
  const firstButton = firstItem.locator('button').first();
  const firstButtonText = await firstButton.textContent();
  console.log('First item button text:', firstButtonText);

  // Check if button has onclick
  const hasOnclick = await page.evaluate(() => {
    const btn = document.querySelector('li button');
    console.log('Button element:', btn?.outerHTML.substring(0, 100));
    console.log('Button onclick:', typeof (btn as any)?.onclick);
    return typeof (btn as any)?.onclick === 'function';
  });
  console.log('Button has onclick:', hasOnclick);

  // Click the button
  console.log('\n=== Clicking Done button ===');
  await firstButton.click();

  // Wait a bit
  await page.waitForTimeout(500);

  // Check state after click
  const buttonTextAfter = await firstButton.textContent();
  console.log('Button text after click:', buttonTextAfter);

  // Check done count
  const doneCount = await page.locator('.count').textContent();
  console.log('Done count:', doneCount);
});
