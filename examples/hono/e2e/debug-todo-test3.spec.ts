/**
 * Debug test - deep dive into AddTodoForm initialization
 */
import { test, expect } from '@playwright/test';

test('debug: deep dive AddTodoForm', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Navigate to todo page
  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Deep debug
  await page.evaluate(() => {
    console.log('=== Deep Debug AddTodoForm ===');

    // 1. Check all data-bf-scope elements
    const scopes = document.querySelectorAll('[data-bf-scope]');
    console.log('All scopes:');
    scopes.forEach(s => {
      console.log(' -', s.getAttribute('data-bf-scope'), s.tagName);
    });

    // 2. Find AddTodoForm scope (contains "_slot_5" or "AddTodoForm")
    const addFormScope = document.querySelector('[data-bf-scope*="_slot_5"]') ||
                         document.querySelector('[data-bf-scope^="AddTodoForm"]');
    console.log('\nAddTodoForm scope:', addFormScope?.getAttribute('data-bf-scope'));

    if (addFormScope) {
      // 3. Check children with data-bf
      const children = addFormScope.querySelectorAll('[data-bf]');
      console.log('Children with data-bf:');
      children.forEach(c => {
        console.log(' -', c.getAttribute('data-bf'), c.tagName, c.className);
      });

      // 4. Find slot_0 and slot_1
      const slot0 = addFormScope.querySelector('[data-bf="slot_0"]');
      const slot1 = addFormScope.querySelector('[data-bf="slot_1"]');
      console.log('\nslot_0:', slot0?.tagName);
      console.log('slot_1:', slot1?.tagName);

      // 5. Check onclick on slot_1 (button)
      if (slot1) {
        console.log('\nslot_1.onclick:', slot1.onclick);
        console.log('typeof slot_1.onclick:', typeof slot1.onclick);

        // Try to manually call onclick
        console.log('Trying manual onclick call...');
        try {
          if (typeof slot1.onclick === 'function') {
            // Don't actually call it, just confirm it's a function
            console.log('onclick IS a function');
          } else {
            console.log('onclick is NOT a function, it is:', slot1.onclick);
          }
        } catch (e: any) {
          console.log('Error checking onclick:', e.message);
        }
      }

      // 6. Check event listeners via getEventListeners if available (Chrome DevTools only)
      // This won't work in Playwright, but let's log the element's properties
      console.log('\nButton properties:');
      if (slot1) {
        const btn = slot1 as HTMLButtonElement;
        console.log(' onclick:', btn.onclick);
        console.log(' addEventListener exists:', typeof btn.addEventListener);
      }
    }

    // 7. Check for errors during hydration
    console.log('\n=== Looking for hydration errors ===');

    // Check if hydrate function was called
    console.log('Checking window for barefoot state...');

    // Check script execution order
    const scripts = document.querySelectorAll('script[type="module"]');
    console.log('Module scripts in DOM:');
    scripts.forEach((s, i) => {
      console.log(` ${i}:`, (s as HTMLScriptElement).src);
    });
  });

  // Check if we can get more info about why onclick isn't working
  await page.evaluate(() => {
    console.log('\n=== Testing button click programmatically ===');
    const btn = document.querySelector('.add-btn') as HTMLButtonElement;
    if (btn) {
      console.log('Found button by class');
      console.log('Button HTML:', btn.outerHTML.substring(0, 100));

      // Try to dispatch click event
      console.log('Dispatching click event...');
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      console.log('Click event dispatched');
    }
  });

  // Wait and check if anything happened
  await page.waitForTimeout(500);

  // Check input value
  const inputValue = await page.locator('.new-todo-input').inputValue();
  console.log('Input value after programmatic click:', inputValue || '(empty)');
});
