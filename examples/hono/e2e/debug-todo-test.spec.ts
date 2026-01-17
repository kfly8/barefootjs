/**
 * Debug test for TodoApp "adds a new todo" failure
 *
 * Run with: cd examples/hono && bunx playwright test /tmp/debug-todo-test.spec.ts --headed
 */
import { test, expect } from '@playwright/test';

test('debug: adds a new todo', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[BROWSER ${msg.type()}]`, text);
  });

  // Navigate to todo page
  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // 1. Check initial state
  console.log('\n=== Initial State ===');
  const initialItems = await page.locator('.todo-list li').count();
  console.log('Initial todo count:', initialItems);

  // List all items with their keys
  const items = page.locator('.todo-list li');
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const key = await items.nth(i).getAttribute('data-key');
    const scope = await items.nth(i).getAttribute('data-bf-scope');
    const text = await items.nth(i).textContent();
    console.log(`  Item ${i}: key=${key}, scope=${scope}, text=${text?.substring(0, 30)}`);
  }

  // 2. Check template registry in browser
  console.log('\n=== Template Check ===');
  await page.evaluate(() => {
    // Try to access the template registry via window if exposed
    console.log('Checking templates...');
    const scripts = document.querySelectorAll('script[type="module"]');
    console.log('Module scripts:', scripts.length);
    scripts.forEach(s => console.log(' -', (s as HTMLScriptElement).src));
  });

  // 3. Fill and submit the form
  console.log('\n=== Adding New Todo ===');
  const input = page.locator('.new-todo-input');
  await input.fill('Debug Test Todo');
  console.log('Filled input');

  // Check input value
  const inputValue = await input.inputValue();
  console.log('Input value:', inputValue);

  // Click add button
  const addButton = page.locator('.add-btn');
  await addButton.click();
  console.log('Clicked add button');

  // Wait a bit for async operation
  await page.waitForTimeout(1000);

  // 4. Check after adding
  console.log('\n=== After Adding ===');
  const afterItems = await page.locator('.todo-list li').count();
  console.log('Todo count after add:', afterItems);

  // List all items
  const itemsAfter = page.locator('.todo-list li');
  const countAfter = await itemsAfter.count();
  for (let i = 0; i < countAfter; i++) {
    const key = await itemsAfter.nth(i).getAttribute('data-key');
    const scope = await itemsAfter.nth(i).getAttribute('data-bf-scope');
    const text = await itemsAfter.nth(i).textContent();
    console.log(`  Item ${i}: key=${key}, scope=${scope}, text=${text?.substring(0, 30)}`);
  }

  // 5. Check for errors
  console.log('\n=== Checking for Errors ===');
  const errors = await page.evaluate(() => {
    return (window as any).__barefootErrors || [];
  });
  console.log('Errors:', errors);

  // Check if input was cleared (indicates form submission worked)
  const inputValueAfter = await input.inputValue();
  console.log('Input value after submit:', inputValueAfter || '(empty)');

  // 6. Get todo list HTML for inspection
  const todoListHtml = await page.locator('.todo-list').innerHTML();
  console.log('\n=== Todo List HTML ===');
  console.log(todoListHtml.substring(0, 500));

  // The actual assertion
  expect(afterItems).toBe(initialItems + 1);
});
