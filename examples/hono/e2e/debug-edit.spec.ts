/**
 * Debug test - edit todo text
 */
import { test, expect } from '@playwright/test';

test('debug: edit todo text', async ({ page }) => {
  // Capture console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Initial state
  console.log('\n=== Initial State ===');
  let state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => ({
      index: i,
      key: (li as HTMLElement).dataset.key,
      text: li.textContent?.trim(),
      hasInput: !!li.querySelector('input')
    }));
  });
  state.forEach(item => console.log(`Item ${item.index}: key=${item.key}, hasInput=${item.hasInput}, text="${item.text?.substring(0, 30)}"`));

  // Click to enter edit mode
  console.log('\n=== Clicking to enter edit mode ===');
  await page.click('text=Setup project');
  await page.waitForTimeout(500);

  state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => ({
      index: i,
      key: (li as HTMLElement).dataset.key,
      text: li.textContent?.trim(),
      hasInput: !!li.querySelector('input'),
      inputValue: (li.querySelector('input') as HTMLInputElement)?.value
    }));
  });
  state.forEach(item => console.log(`Item ${item.index}: key=${item.key}, hasInput=${item.hasInput}, inputValue="${item.inputValue}", text="${item.text?.substring(0, 30)}"`));

  // Fill and submit
  console.log('\n=== Filling and pressing Enter ===');
  const input = page.locator('li input').first();
  await input.fill('Updated project setup');
  await page.waitForTimeout(100);
  await input.press('Enter');

  // Wait for API and re-render
  await page.waitForTimeout(1000);

  console.log('\n=== After submit ===');
  state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => ({
      index: i,
      key: (li as HTMLElement).dataset.key,
      scopeId: (li as HTMLElement).dataset.bfScope,
      text: li.textContent?.trim(),
      hasInput: !!li.querySelector('input'),
      inputValue: (li.querySelector('input') as HTMLInputElement)?.value,
      spanText: li.querySelector('.todo-text span')?.textContent
    }));
  });
  state.forEach(item => console.log(`Item ${item.index}: key=${item.key}, scope=${item.scopeId}, hasInput=${item.hasInput}, spanText="${item.spanText}", text="${item.text?.substring(0, 40)}"`));

  // Check first item
  const firstItemText = await page.locator('li').first().textContent();
  console.log('\nFirst item full text:', firstItemText);
});
