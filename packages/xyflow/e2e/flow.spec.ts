import { test, expect } from '@playwright/test'

test.describe('Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders 4 nodes', async ({ page }) => {
    const container = page.locator('#basic')
    const nodes = container.locator('.bf-flow__node')
    await expect(nodes).toHaveCount(4)
  })

  test('nodes have correct labels', async ({ page }) => {
    const container = page.locator('#basic')
    await expect(container.locator('.bf-flow__node', { hasText: 'Start' })).toBeVisible()
    await expect(container.locator('.bf-flow__node', { hasText: 'Process A' })).toBeVisible()
    await expect(container.locator('.bf-flow__node', { hasText: 'Process B' })).toBeVisible()
    await expect(container.locator('.bf-flow__node', { hasText: 'End' })).toBeVisible()
  })

  test('renders 3 edge paths', async ({ page }) => {
    const container = page.locator('#basic')
    const edges = container.locator('.bf-flow__edge')
    await expect(edges).toHaveCount(3)
  })

  test('edge paths have valid d attribute', async ({ page }) => {
    const container = page.locator('#basic')
    const firstEdge = container.locator('.bf-flow__edge').first()
    const d = await firstEdge.getAttribute('d')
    expect(d).toBeTruthy()
    expect(d).toContain('M') // SVG path must start with M
  })

  test('nodes are positioned via CSS transform', async ({ page }) => {
    const container = page.locator('#basic')
    const startNode = container.locator('.bf-flow__node[data-id="1"]')
    const style = await startNode.getAttribute('style')
    expect(style).toContain('translate(0px, 0px)')
  })

  test('viewport element is in DOM', async ({ page }) => {
    const container = page.locator('#basic')
    const viewport = container.locator('.bf-flow__viewport')
    await expect(viewport).toBeAttached()
  })

  // Selection is handled by XYDrag (selectNodesOnDrag: true), not click.
  // D3's pointer capture means Playwright click/dispatchEvent doesn't
  // trigger the same code path. Needs drag-based selection tests.
  test.skip('click node to select (requires drag integration)', () => {})
  test.skip('click another node deselects previous (requires drag integration)', () => {})
})

test.describe('Flow with Plugins', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders background SVG pattern', async ({ page }) => {
    const container = page.locator('#plugins')
    // Background SVG has a <pattern> element inside <defs>
    const pattern = container.locator('svg pattern')
    await expect(pattern).toHaveCount(1)
  })

  test('renders controls panel', async ({ page }) => {
    const container = page.locator('#plugins')
    const controls = container.locator('.bf-flow__controls')
    await expect(controls).toBeVisible()
  })

  test('controls has 3 buttons (zoom in, zoom out, fit)', async ({ page }) => {
    const container = page.locator('#plugins')
    const buttons = container.locator('.bf-flow__controls-button')
    await expect(buttons).toHaveCount(3)
  })

  test('renders 4 nodes and 4 edges', async ({ page }) => {
    const container = page.locator('#plugins')
    await expect(container.locator('.bf-flow__node')).toHaveCount(4)
    await expect(container.locator('.bf-flow__edge')).toHaveCount(4)
  })
})

test.describe('Stress Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders 20 nodes', async ({ page }) => {
    const container = page.locator('#stress')
    await expect(container.locator('.bf-flow__node')).toHaveCount(20)
  })

  test('renders 31 edges', async ({ page }) => {
    const container = page.locator('#stress')
    await expect(container.locator('.bf-flow__edge')).toHaveCount(31)
  })

  test('first node has label "Node 1"', async ({ page }) => {
    const container = page.locator('#stress')
    const node = container.locator('.bf-flow__node[data-id="n0-0"]')
    await expect(node).toHaveText('Node 1')
  })

  test('last node has label "Node 20"', async ({ page }) => {
    const container = page.locator('#stress')
    const node = container.locator('.bf-flow__node[data-id="n3-4"]')
    await expect(node).toHaveText('Node 20')
  })

  test('controls rendered at top-right', async ({ page }) => {
    const container = page.locator('#stress')
    const controls = container.locator('.bf-flow__controls')
    await expect(controls).toBeVisible()
  })
})
