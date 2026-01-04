"use client"
/**
 * DropdownDemo Components
 *
 * Interactive demos for Dropdown component.
 * Used in dropdown documentation page.
 *
 * Note: Due to BarefootJS compiler limitations, we explicitly write out each
 * DropdownItem instead of using .map() over a local array. Local variables
 * are not preserved during compilation.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
} from './Dropdown'

/**
 * Basic dropdown demo
 */
export function DropdownBasicDemo() {
  const [open, setOpen] = createSignal(false)
  const [value, setValue] = createSignal('')

  // Computed display label based on selected value (includes placeholder)
  const displayLabel = createMemo(() =>
    value() === '' ? 'Select a fruit' :
    value() === 'apple' ? 'Apple' :
    value() === 'banana' ? 'Banana' :
    value() === 'cherry' ? 'Cherry' :
    value() === 'grape' ? 'Grape' : 'Select a fruit'
  )

  // Computed selected states for each item
  const isAppleSelected = createMemo(() => value() === 'apple')
  const isBananaSelected = createMemo(() => value() === 'banana')
  const isCherrySelected = createMemo(() => value() === 'cherry')
  const isGrapeSelected = createMemo(() => value() === 'grape')

  const handleSelect = (optionValue: string) => {
    setValue(optionValue)
    setOpen(false)
  }

  return (
    <div class="relative inline-block">
      <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
        {displayLabel()}
      </DropdownTrigger>
      <DropdownContent open={open()} onClose={() => setOpen(false)}>
        <DropdownItem
          value="apple"
          selected={isAppleSelected()}
          onClick={() => handleSelect('apple')}
        >
          Apple
        </DropdownItem>
        <DropdownItem
          value="banana"
          selected={isBananaSelected()}
          onClick={() => handleSelect('banana')}
        >
          Banana
        </DropdownItem>
        <DropdownItem
          value="cherry"
          selected={isCherrySelected()}
          onClick={() => handleSelect('cherry')}
        >
          Cherry
        </DropdownItem>
        <DropdownItem
          value="grape"
          selected={isGrapeSelected()}
          onClick={() => handleSelect('grape')}
        >
          Grape
        </DropdownItem>
      </DropdownContent>
    </div>
  )
}

/**
 * Dropdown with default value demo
 */
export function DropdownWithDefaultDemo() {
  const [open, setOpen] = createSignal(false)
  const [value, setValue] = createSignal('medium')

  // Computed display label based on selected value (simple ternary chain)
  const displayLabel = createMemo(() =>
    value() === 'small' ? 'Small' :
    value() === 'medium' ? 'Medium' :
    value() === 'large' ? 'Large' :
    value() === 'xlarge' ? 'Extra Large' : ''
  )

  // Computed selected states for each item
  const isSmallSelected = createMemo(() => value() === 'small')
  const isMediumSelected = createMemo(() => value() === 'medium')
  const isLargeSelected = createMemo(() => value() === 'large')
  const isXlargeSelected = createMemo(() => value() === 'xlarge')

  const handleSelect = (optionValue: string) => {
    setValue(optionValue)
    setOpen(false)
  }

  return (
    <div class="relative inline-block">
      <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
        {displayLabel()}
      </DropdownTrigger>
      <DropdownContent open={open()} onClose={() => setOpen(false)}>
        <DropdownItem
          value="small"
          selected={isSmallSelected()}
          onClick={() => handleSelect('small')}
        >
          Small
        </DropdownItem>
        <DropdownItem
          value="medium"
          selected={isMediumSelected()}
          onClick={() => handleSelect('medium')}
        >
          Medium
        </DropdownItem>
        <DropdownItem
          value="large"
          selected={isLargeSelected()}
          onClick={() => handleSelect('large')}
        >
          Large
        </DropdownItem>
        <DropdownItem
          value="xlarge"
          selected={isXlargeSelected()}
          onClick={() => handleSelect('xlarge')}
        >
          Extra Large
        </DropdownItem>
      </DropdownContent>
    </div>
  )
}

/**
 * Disabled dropdown demo
 */
export function DropdownDisabledDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <DropdownTrigger open={open()} onClick={() => setOpen(!open())} disabled>
        <DropdownLabel>Disabled</DropdownLabel>
      </DropdownTrigger>
      <DropdownContent open={open()} onClose={() => setOpen(false)}>
        <DropdownItem value="option1" onClick={() => {}}>
          Option 1
        </DropdownItem>
      </DropdownContent>
    </div>
  )
}

/**
 * Dropdown inside CSS transformed parent demo
 *
 * Tests that dropdown positioning works correctly when parent has CSS transforms.
 * CSS transforms create a new containing block for fixed/absolute positioned descendants,
 * which can affect positioning calculations.
 */
export function DropdownWithTransformDemo() {
  const [open, setOpen] = createSignal(false)
  const [value, setValue] = createSignal('')

  const displayLabel = createMemo(() =>
    value() === '' ? 'Select option' :
    value() === 'option1' ? 'Option 1' :
    value() === 'option2' ? 'Option 2' :
    value() === 'option3' ? 'Option 3' : 'Select option'
  )

  const isOption1Selected = createMemo(() => value() === 'option1')
  const isOption2Selected = createMemo(() => value() === 'option2')
  const isOption3Selected = createMemo(() => value() === 'option3')

  const handleSelect = (optionValue: string) => {
    setValue(optionValue)
    setOpen(false)
  }

  return (
    <div class="relative inline-block">
      <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
        {displayLabel()}
      </DropdownTrigger>
      <DropdownContent open={open()} onClose={() => setOpen(false)}>
        <DropdownItem
          value="option1"
          selected={isOption1Selected()}
          onClick={() => handleSelect('option1')}
        >
          Option 1
        </DropdownItem>
        <DropdownItem
          value="option2"
          selected={isOption2Selected()}
          onClick={() => handleSelect('option2')}
        >
          Option 2
        </DropdownItem>
        <DropdownItem
          value="option3"
          selected={isOption3Selected()}
          onClick={() => handleSelect('option3')}
        >
          Option 3
        </DropdownItem>
      </DropdownContent>
    </div>
  )
}
