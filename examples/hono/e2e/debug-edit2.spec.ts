/**
 * Debug test - trace edit flow in detail
 */
import { test, expect } from '@playwright/test';

test('debug: trace edit flow', async ({ page }) => {
  // Capture console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Intercept API calls
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`[REQUEST] ${req.method()} ${req.url()}`);
      if (req.postData()) {
        console.log(`  Body: ${req.postData()}`);
      }
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const body = await res.text().catch(() => 'failed to read');
      console.log(`[RESPONSE] ${res.status()} ${res.url()}`);
      console.log(`  Body: ${body.substring(0, 200)}`);
    }
  });

  await page.goto('/todos');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  console.log('\n=== Initial State ===');
  let state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => {
      const el = li as HTMLElement;
      return {
        index: i,
        key: el.dataset.key,
        scopeId: el.dataset.bfScope,
        text: el.querySelector('.todo-text span')?.textContent || '(no span)',
        hasInput: !!el.querySelector('input'),
        editing: el.querySelector('input') ? true : false
      };
    });
  });
  console.log(JSON.stringify(state, null, 2));

  // Click to edit
  console.log('\n=== Clicking "Setup project" ===');
  await page.click('text=Setup project');
  await page.waitForTimeout(500);

  state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => {
      const el = li as HTMLElement;
      const input = el.querySelector('input') as HTMLInputElement;
      return {
        index: i,
        key: el.dataset.key,
        scopeId: el.dataset.bfScope,
        text: el.querySelector('.todo-text span')?.textContent || '(no span)',
        hasInput: !!input,
        inputValue: input?.value
      };
    });
  });
  console.log(JSON.stringify(state, null, 2));

  // Type new text
  console.log('\n=== Typing "Updated project setup" ===');
  const input = page.locator('li input').first();
  await input.fill('Updated project setup');
  await page.waitForTimeout(100);

  // Check input value before submit
  const inputValueBefore = await input.inputValue();
  console.log('Input value before Enter:', inputValueBefore);

  // Press Enter
  console.log('\n=== Pressing Enter ===');
  await input.press('Enter');

  // Wait for API
  await page.waitForTimeout(2000);

  console.log('\n=== Final State ===');
  state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    return Array.from(items).map((li, i) => {
      const el = li as HTMLElement;
      const input = el.querySelector('input') as HTMLInputElement;
      return {
        index: i,
        key: el.dataset.key,
        scopeId: el.dataset.bfScope,
        text: el.querySelector('.todo-text span')?.textContent || '(no span)',
        hasInput: !!input,
        inputValue: input?.value
      };
    });
  });
  console.log(JSON.stringify(state, null, 2));

  // First item text
  const firstText = await page.locator('li').first().textContent();
  console.log('\nFirst item full text:', firstText);
});
