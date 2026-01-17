/**
 * Debug test - trace through AddTodoForm initialization
 */
import { test, expect } from '@playwright/test';

test('debug: trace AddTodoForm init', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Navigate to todo page
  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Inject debugging directly
  await page.evaluate(() => {
    console.log('=== Tracing AddTodoForm initialization ===');

    // Check if initAddTodoForm was called by looking at data-bf-init
    const addFormScope = document.querySelector('[data-bf-scope*="_slot_5"]');
    console.log('AddTodoForm scope:', addFormScope?.getAttribute('data-bf-scope'));
    console.log('Has data-bf-init?', addFormScope?.hasAttribute('data-bf-init'));

    // Check the button
    const btn = addFormScope?.querySelector('[data-bf="slot_1"]') as HTMLButtonElement;
    console.log('Button found:', !!btn);
    console.log('Button onclick:', btn?.onclick);

    // Check if hydrate was registered
    // The hydrate function runs on DOMContentLoaded, let's check if it completed
    console.log('\n=== Checking hydration state ===');

    // Try to manually call initAddTodoForm to see if there are errors
    console.log('\n=== Testing manual init ===');
    try {
      // Import the module dynamically
      const domModule = (window as any).__barefootDom;
      console.log('__barefootDom exists:', !!domModule);

      // Check if findScope is working
      if (addFormScope) {
        console.log('Calling findScope simulation...');
        const scopeId = (addFormScope as HTMLElement).dataset.bfScope;
        console.log('Scope ID:', scopeId);
        console.log('Starts with AddTodoForm_:', scopeId?.startsWith('AddTodoForm_'));
        console.log('Contains _slot_:', scopeId?.includes('_slot_'));
        console.log('Is document:', addFormScope === document);
      }
    } catch (e: any) {
      console.log('Error during manual init test:', e.message);
    }

    // Look for any JavaScript errors in the page
    console.log('\n=== Window errors ===');
    console.log('window.onerror:', typeof window.onerror);
  });

  // Check if hydrate calls completed successfully
  await page.evaluate(() => {
    console.log('\n=== Module script status ===');
    const scripts = document.querySelectorAll('script[type="module"]');
    scripts.forEach(s => {
      console.log('Script:', (s as HTMLScriptElement).src);
    });

    // Try to check if TodoApp was initialized
    const todoAppScope = document.querySelector('[data-bf-scope^="TodoApp_"]');
    console.log('\nTodoApp scope:', todoAppScope?.getAttribute('data-bf-scope'));
    console.log('TodoApp has data-bf-init:', todoAppScope?.hasAttribute('data-bf-init'));

    // Check if Count displays are updated (would prove TodoApp init ran)
    const count = document.querySelector('.count')?.textContent;
    const total = document.querySelector('.total')?.textContent;
    console.log('Count display:', count, '/', total);
  });

  // Wait and try to interact
  const input = page.locator('.new-todo-input');
  await input.fill('Test Input');
  await page.waitForTimeout(100);

  // Try clicking the button with force
  const btn = page.locator('.add-btn');
  await btn.click();

  await page.waitForTimeout(500);

  // Check result
  const inputValueAfter = await input.inputValue();
  console.log('Input value after click:', inputValueAfter || '(empty)');

  const itemCount = await page.locator('.todo-list li').count();
  console.log('Item count:', itemCount);
});
