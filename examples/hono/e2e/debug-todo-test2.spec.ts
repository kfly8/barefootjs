/**
 * Debug test for TodoApp - check onAdd prop passing
 */
import { test, expect } from '@playwright/test';

test('debug: check onAdd prop and form submission', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Navigate to todo page
  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Inject debugging code
  await page.evaluate(() => {
    // Find the AddTodoForm scope
    const addFormScope = document.querySelector('[data-bf-scope*="AddTodoForm"], [data-bf-scope*="_slot_5"]');
    console.log('AddTodoForm scope element:', addFormScope?.getAttribute('data-bf-scope'));

    // Check if the button has onclick handler
    const addBtn = document.querySelector('.add-btn');
    console.log('Add button found:', !!addBtn);
    console.log('Add button onclick:', typeof (addBtn as any)?.onclick);

    // Check input handler
    const input = document.querySelector('.new-todo-input');
    console.log('Input found:', !!input);
    console.log('Input oninput:', typeof (input as any)?.oninput);
    console.log('Input onkeydown:', typeof (input as any)?.onkeydown);

    // Check slot references
    const slot0 = addFormScope?.querySelector('[data-bf="slot_0"]');
    const slot1 = addFormScope?.querySelector('[data-bf="slot_1"]');
    console.log('slot_0 (input):', !!slot0);
    console.log('slot_1 (button):', !!slot1);
  });

  // Add debugging wrapper for fetch
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      console.log('[FETCH START]', args[0], args[1]?.method);
      try {
        const response = await originalFetch.apply(this, args);
        console.log('[FETCH DONE]', args[0], response.status);
        return response;
      } catch (e: any) {
        console.error('[FETCH ERROR]', e.message);
        throw e;
      }
    };
    console.log('Fetch interceptor installed');
  });

  // Fill the input
  const input = page.locator('.new-todo-input');
  await input.fill('Test New Todo');
  console.log('Filled input');

  // Wait a moment
  await page.waitForTimeout(100);

  // Check input value
  const valueBeforeClick = await input.inputValue();
  console.log('Value before click:', valueBeforeClick);

  // Click with request interception
  const [request] = await Promise.all([
    page.waitForRequest(req => req.url().includes('/api/todos') && req.method() === 'POST', { timeout: 5000 }).catch(() => null),
    page.locator('.add-btn').click()
  ]);

  if (request) {
    console.log('API request made:', request.url(), request.method());
    const postData = request.postData();
    console.log('POST data:', postData);
  } else {
    console.log('NO API REQUEST MADE!');
  }

  // Wait for potential response
  await page.waitForTimeout(1000);

  // Check final state
  const valueAfterClick = await input.inputValue();
  console.log('Value after click:', valueAfterClick);

  const itemCount = await page.locator('.todo-list li').count();
  console.log('Final item count:', itemCount);

  // Check for any JS errors
  const errors = await page.evaluate(() => {
    return (window as any).__jsErrors || [];
  });
  if (errors.length > 0) {
    console.log('JS Errors:', errors);
  }
});
