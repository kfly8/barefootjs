/**
 * Debug test - check why hydrate isn't running
 */
import { test, expect } from '@playwright/test';

test('debug: why hydrate not running', async ({ page }) => {
  // Capture all console messages
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}`);
  });

  // Navigate
  await page.goto('/todos');
  await page.waitForLoadState('networkidle');

  // Wait a bit for any async operations
  await page.waitForTimeout(500);

  // Print all logs
  console.log('\n=== Browser Console ===');
  logs.forEach(log => console.log(log));

  // Now check the state
  const state = await page.evaluate(() => {
    const result: Record<string, any> = {};

    // Check scopes
    const scopes = document.querySelectorAll('[data-bf-scope]');
    result.scopeCount = scopes.length;
    result.scopes = Array.from(scopes).map(s => ({
      id: s.getAttribute('data-bf-scope'),
      tag: s.tagName,
      hasInit: s.hasAttribute('data-bf-init')
    }));

    // Specifically check TodoApp
    const todoApp = document.querySelector('[data-bf-scope^="TodoApp_"]');
    if (todoApp) {
      result.todoApp = {
        scopeId: todoApp.getAttribute('data-bf-scope'),
        hasInit: todoApp.hasAttribute('data-bf-init'),
        parentScope: todoApp.parentElement?.closest('[data-bf-scope]')?.getAttribute('data-bf-scope') || null
      };
    } else {
      result.todoApp = null;
    }

    // Check if scripts loaded
    result.moduleScripts = Array.from(document.querySelectorAll('script[type="module"]'))
      .map(s => (s as HTMLScriptElement).src);

    // Check if props script exists
    result.propsScripts = Array.from(document.querySelectorAll('script[data-bf-props]'))
      .map(s => (s as HTMLScriptElement).getAttribute('data-bf-props'));

    return result;
  });

  console.log('\n=== DOM State ===');
  console.log('Scope count:', state.scopeCount);
  console.log('TodoApp:', JSON.stringify(state.todoApp, null, 2));
  console.log('Scopes:', JSON.stringify(state.scopes, null, 2));
  console.log('Module scripts:', state.moduleScripts);
  console.log('Props scripts:', state.propsScripts);

  // Try to manually trigger hydration
  console.log('\n=== Manual hydration test ===');
  const manualResult = await page.evaluate(() => {
    const scopeEl = document.querySelector('[data-bf-scope^="TodoApp_"]');
    if (!scopeEl) return { error: 'No TodoApp scope found' };

    const instanceId = (scopeEl as HTMLElement).dataset.bfScope;
    const propsEl = document.querySelector(`script[data-bf-props="${instanceId}"]`);
    const props = propsEl ? JSON.parse(propsEl.textContent || '{}') : {};

    return {
      instanceId,
      hasPropsEl: !!propsEl,
      props,
      parentHasScope: !!scopeEl.parentElement?.closest('[data-bf-scope]')
    };
  });

  console.log('Manual result:', JSON.stringify(manualResult, null, 2));
});
