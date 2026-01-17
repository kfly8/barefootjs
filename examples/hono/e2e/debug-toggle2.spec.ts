/**
 * Debug test - check TodoItem initialization
 */
import { test, expect } from '@playwright/test';

test('debug: check TodoItem initialization', async ({ page }) => {
  // Capture console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Wait for microtasks to complete
  await page.waitForTimeout(500);

  // Check TodoItem initialization state
  const state = await page.evaluate(() => {
    const items = document.querySelectorAll('li');
    const result: any[] = [];

    items.forEach((li, i) => {
      const el = li as HTMLElement;
      result.push({
        index: i,
        scopeId: el.dataset.bfScope,
        hasInit: el.hasAttribute('data-bf-init'),
        key: el.dataset.key,
        toggleBtnOnclick: typeof (el.querySelector('.toggle-btn') as any)?.onclick,
        deleteBtnOnclick: typeof (el.querySelector('.delete-btn') as any)?.onclick,
        btnHtml: el.querySelector('.toggle-btn')?.outerHTML.substring(0, 80)
      });
    });

    return result;
  });

  console.log('\n=== TodoItem States ===');
  state.forEach(item => {
    console.log(`Item ${item.index}:`, JSON.stringify(item, null, 2));
  });

  // Check if TodoItem template exists
  const templateCheck = await page.evaluate(() => {
    // Try to access the template registry through the window
    // (this won't work directly, but let's see what we can learn)
    const scripts = document.querySelectorAll('script[type="module"]');
    return Array.from(scripts).map(s => (s as HTMLScriptElement).src);
  });
  console.log('\n=== Loaded scripts ===');
  templateCheck.forEach(s => console.log(' -', s));
});
