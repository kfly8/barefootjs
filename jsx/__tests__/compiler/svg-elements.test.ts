/**
 * SVG Elements Support Test
 *
 * ## Overview
 * Tests for SVG elements in JSX with proper namespace and attribute handling.
 *
 * ## Supported Patterns
 * - Basic SVG elements (svg, path, circle, rect, etc.)
 * - camelCase attributes (viewBox, strokeWidth, fillOpacity, etc.)
 * - Dynamic attributes on SVG elements
 * - Events on SVG elements
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('SVG Elements Support', () => {
  it('basic svg element', async () => {
    const source = `
      function Component() {
        return (
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="red" />
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // SVG should have xmlns attribute
    expect(component.serverJsx).toContain('xmlns="http://www.w3.org/2000/svg"')
    // Should contain circle element
    expect(component.serverJsx).toContain('<circle')
    expect(component.serverJsx).toContain('cx="50"')
  })

  it('svg with viewBox (camelCase)', async () => {
    const source = `
      function Component() {
        return (
          <svg viewBox="0 0 100 100" width="50" height="50">
            <rect x="10" y="10" width="80" height="80" />
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // viewBox should be preserved as camelCase
    expect(component.serverJsx).toContain('viewBox="0 0 100 100"')
    expect(component.serverJsx).toContain('<rect')
  })

  it('svg with stroke attributes', async () => {
    const source = `
      function Component() {
        return (
          <svg viewBox="0 0 100 100">
            <path
              d="M10 10 L90 90"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // stroke attributes should be preserved
    expect(component.serverJsx).toContain('strokeWidth="2"')
    expect(component.serverJsx).toContain('strokeLinecap="round"')
  })

  it('svg with dynamic attributes', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [color, setColor] = createSignal('red')
        return (
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="40" fill={color()} />
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Should have data-bf for dynamic element
    expect(component.serverJsx).toContain('data-bf=')
    expect(component.serverJsx).toContain('<circle')
  })

  it('svg with events', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [clicked, setClicked] = createSignal(false)
        return (
          <svg width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="blue"
              onClick={() => setClicked(true)}
            />
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Should have data-bf for interactive element
    expect(component.serverJsx).toContain('data-bf=')
    // Should generate click handler
    expect(component.clientJs).toContain('onclick')
  })

  it('nested svg groups', async () => {
    const source = `
      function Component() {
        return (
          <svg viewBox="0 0 100 100">
            <g transform="translate(10, 10)">
              <circle cx="20" cy="20" r="10" />
              <rect x="40" y="10" width="20" height="20" />
            </g>
          </svg>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.serverJsx).toContain('<g')
    expect(component.serverJsx).toContain('transform="translate(10, 10)"')
    expect(component.serverJsx).toContain('<circle')
    expect(component.serverJsx).toContain('<rect')
  })
})
