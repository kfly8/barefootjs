import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { findScope, find, $, $c, $t } from '../src/query'
import { hydratedScopes } from '../src/hydration-state'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('findScope', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds scope by component name prefix', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_abc123">content</div>
    `
    const scope = findScope('Counter', 0, null)
    expect(scope).not.toBeNull()
    expect(scope?.getAttribute('bf-s')).toBe('Counter_abc123')
    expect(hydratedScopes.has(scope!)).toBe(true)
  })

  test('returns parent if it is the scope element', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_abc123">content</div>
    `
    const parent = document.querySelector('[bf-s]') as Element
    const scope = findScope('Counter', 0, parent)
    expect(scope).toBe(parent)
  })

  test('skips already initialized scopes', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_1"></div>
      <div bf-s="Counter_2"></div>
    `
    // Mark first scope as already hydrated
    const first = document.querySelector('[bf-s="Counter_1"]')!
    hydratedScopes.add(first)

    const scope = findScope('Counter', 0, null)
    expect(scope?.getAttribute('bf-s')).toBe('Counter_2')
  })

  test('returns null if no matching scope found', () => {
    document.body.innerHTML = `
      <div bf-s="Other_1"></div>
    `
    const scope = findScope('Counter', 0, null)
    expect(scope).toBeNull()
  })

  test('finds scope at specific index', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_1"></div>
      <div bf-s="Counter_2"></div>
      <div bf-s="Counter_3"></div>
    `
    const scope = findScope('Counter', 1, null)
    expect(scope?.getAttribute('bf-s')).toBe('Counter_2')
  })

  test('searches within parent element', () => {
    document.body.innerHTML = `
      <div id="parent">
        <div bf-s="Counter_inside"></div>
      </div>
      <div bf-s="Counter_outside"></div>
    `
    const parent = document.getElementById('parent')!
    const scope = findScope('Counter', 0, parent)
    expect(scope?.getAttribute('bf-s')).toBe('Counter_inside')
  })

  test('without comment flag returns null when no attribute scope exists', () => {
    document.body.innerHTML = `
      <!--bf-scope:FragComp_abc-->
      <div>child 1</div>
      <div>child 2</div>
    `
    // Without comment flag, should NOT fall back to comment-based search
    const scope = findScope('FragComp', 0, null)
    expect(scope).toBeNull()
  })

  test('with comment=true finds comment-based scope', () => {
    document.body.innerHTML = `
      <!--bf-scope:FragComp_abc-->
      <div>child 1</div>
      <div>child 2</div>
    `
    // With comment flag, should find via comment scope marker
    const scope = findScope('FragComp', 0, null, true)
    expect(scope).not.toBeNull()
  })
})

describe('find', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds element within scope', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_1">
        <button bf="btn1">Click</button>
      </div>
    `
    const scope = document.querySelector('[bf-s]')
    const btn = find(scope, '[bf="btn1"]')
    expect(btn).not.toBeNull()
    expect(btn?.textContent).toBe('Click')
  })

  test('returns scope if it matches selector', () => {
    document.body.innerHTML = `
      <button bf-s="Button_1" bf="root">Click</button>
    `
    const scope = document.querySelector('[bf-s]')
    const el = find(scope, '[bf="root"]')
    expect(el).toBe(scope)
  })

  test('excludes elements in nested scopes', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_1">
        <div bf-s="Child_1">
          <button bf="btn1">Nested</button>
        </div>
      </div>
    `
    const parentScope = document.querySelector('[bf-s="Parent_1"]')
    const btn = find(parentScope, '[bf="btn1"]')
    expect(btn).toBeNull()
  })

  test('returns null for null scope', () => {
    const el = find(null, '[bf="btn1"]')
    expect(el).toBeNull()
  })

  test('returns null if element not found', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_1"></div>
    `
    const scope = document.querySelector('[bf-s]')
    const el = find(scope, '[bf="nonexistent"]')
    expect(el).toBeNull()
  })

  test('finds child scope element before matching scope itself', () => {
    // AccordionTrigger case: parent scope also matches the suffix selector,
    // but we want the child scope (ChevronDownIcon) returned first
    document.body.innerHTML = `
      <div bf-s="AccordionTrigger_abc_s0">
        <span bf-s="AccordionTrigger_abc_s0_s0">icon</span>
      </div>
    `
    const scope = document.querySelector('[bf-s="AccordionTrigger_abc_s0"]')
    const el = find(scope, '[bf-s$="_s0"]')
    expect(el).not.toBeNull()
    expect(el?.textContent).toBe('icon')
  })

  test('returns scope itself when looking for scope selector and no child matches', () => {
    // ButtonDemo case: scope element IS the slot element (no children)
    document.body.innerHTML = `
      <button bf-s="ButtonDemo_xyz_s1">click</button>
    `
    const scope = document.querySelector('[bf-s]')
    const el = find(scope, '[bf-s$="_s1"]')
    expect(el).toBe(scope)
  })

  test('prioritizes child scope over self-match for scope selectors', () => {
    // Both parent and child match the suffix selector, child should be returned
    document.body.innerHTML = `
      <div bf-s="Parent_abc_s0">
        <div bf-s="Parent_abc_s0_s0">child</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc_s0"]')
    const el = find(scope, '[bf-s$="_s0"]')
    expect(el?.textContent).toBe('child')
    expect(el).not.toBe(scope)
  })

  describe('with portals', () => {
    test('finds element in portal owned by scope', () => {
      document.body.innerHTML = `
        <div bf-s="Dialog_abc123">
          <button bf="trigger">Open</button>
        </div>
        <div bf-po="Dialog_abc123">
          <input bf="input" />
        </div>
      `
      const scope = document.querySelector('[bf-s]')
      const input = find(scope, '[bf="input"]')
      expect(input).not.toBeNull()
      expect(input?.tagName.toLowerCase()).toBe('input')
    })

    test('prioritizes scope over portal for same selector', () => {
      document.body.innerHTML = `
        <div bf-s="Test_1">
          <span bf="item">Scope</span>
        </div>
        <div bf-po="Test_1">
          <span bf="item">Portal</span>
        </div>
      `
      const scope = document.querySelector('[bf-s]')
      const item = find(scope, '[bf="item"]')
      expect(item?.textContent).toBe('Scope')
    })

    test('finds element in portal when not in scope', () => {
      document.body.innerHTML = `
        <div bf-s="Dialog_xyz">
          <button bf="trigger">Open</button>
        </div>
        <div bf-po="Dialog_xyz">
          <div class="content">
            <input bf="email" type="email" />
            <button bf="submit">Submit</button>
          </div>
        </div>
      `
      const scope = document.querySelector('[bf-s]')
      const email = find(scope, '[bf="email"]')
      const submit = find(scope, '[bf="submit"]')
      expect(email).not.toBeNull()
      expect(submit).not.toBeNull()
      expect(email?.getAttribute('type')).toBe('email')
    })

    test('does not find element in portal owned by different scope', () => {
      document.body.innerHTML = `
        <div bf-s="Dialog_1">
          <button bf="trigger">Open</button>
        </div>
        <div bf-po="Dialog_2">
          <input bf="input" />
        </div>
      `
      const scope = document.querySelector('[bf-s="Dialog_1"]')
      const input = find(scope, '[bf="input"]')
      expect(input).toBeNull()
    })

    test('finds multiple elements across multiple portals', () => {
      document.body.innerHTML = `
        <div bf-s="Dialog_multi">
          <button bf="trigger">Open</button>
        </div>
        <div bf-po="Dialog_multi">
          <div bf="overlay" class="overlay"></div>
        </div>
        <div bf-po="Dialog_multi">
          <div bf="content" class="content"></div>
        </div>
      `
      const scope = document.querySelector('[bf-s]')
      const overlay = find(scope, '[bf="overlay"]')
      const content = find(scope, '[bf="content"]')
      expect(overlay).not.toBeNull()
      expect(content).not.toBeNull()
    })

    test('finds portal element itself when it matches selector', () => {
      document.body.innerHTML = `
        <div bf-s="Dialog_self">
          <button bf="trigger">Open</button>
        </div>
        <div bf-po="Dialog_self" bf="portal-root"></div>
      `
      const scope = document.querySelector('[bf-s]')
      const portalRoot = find(scope, '[bf="portal-root"]')
      expect(portalRoot).not.toBeNull()
      expect(portalRoot?.getAttribute('bf-po')).toBe('Dialog_self')
    })
  })
})

describe('$c', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('returns direct child scope only, not nested grandchild with same suffix', () => {
    // Regression: suffix match [bf-s$="_s3"] was matching grandchild
    // Demo_abc_s4_s3 in addition to the intended Demo_abc_s3
    document.body.innerHTML = `
      <div bf-s="Demo_abc">
        <div bf-s="Demo_abc_s3">direct child</div>
        <div bf-s="Demo_abc_s4">
          <div bf-s="Demo_abc_s4_s3">nested grandchild</div>
        </div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')!
    const result = $c(scope, 's3')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('bf-s')).toBe('Demo_abc_s3')
  })

  test('finds child scope by slot ID', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_xyz">
        <div bf-s="Parent_xyz_s1">slot content</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_xyz"]')!
    const result = $c(scope, 's1')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('bf-s')).toBe('Parent_xyz_s1')
  })

  test('finds child scope by component name prefix', () => {
    document.body.innerHTML = `
      <div bf-s="App_root">
        <div bf-s="Counter_abc123">counter</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="App_root"]')!
    const result = $c(scope, 'Counter')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('bf-s')).toBe('Counter_abc123')
  })

  test('returns null for null scope', () => {
    const result = $c(null, 's0')
    expect(result).toBeNull()
  })

  test('strips ^ prefix defensively for slot IDs', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="~DialogTrigger_Parent_abc_s0">trigger</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')!
    // Even if ^ accidentally reaches $c, it should still find the element
    const result = $c(scope, '^s0')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('bf-s')).toBe('~DialogTrigger_Parent_abc_s0')
  })

  test('strips ^ prefix defensively for component name IDs', () => {
    document.body.innerHTML = `
      <div bf-s="App_root">
        <div bf-s="~Counter_abc123">counter</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="App_root"]')!
    // ^ prefix on component name should be stripped
    const result = $c(scope, '^Counter')
    expect(result).not.toBeNull()
    expect(result?.getAttribute('bf-s')).toBe('~Counter_abc123')
  })
})

describe('$ (parent-owned slots)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds ^-prefixed slot inside child scope', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="~Child_xyz">
          <button bf="^s3">Click</button>
        </div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    const btn = $(scope, '^s3')
    expect(btn).not.toBeNull()
    expect(btn?.textContent).toBe('Click')
  })

  test('finds ^-prefixed slot in deeply nested child scopes', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="~Child_xyz">
          <div bf-s="~GrandChild_def">
            <input bf="^s5" type="text" />
          </div>
        </div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    const input = $(scope, '^s5')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('type')).toBe('text')
  })

  test('finds ^-prefixed slot in portals', () => {
    document.body.innerHTML = `
      <div bf-s="Dialog_abc">
        <button bf="s0">Open</button>
      </div>
      <div bf-po="Dialog_abc">
        <button bf="^s2">Close</button>
      </div>
    `
    const scope = document.querySelector('[bf-s="Dialog_abc"]')
    const closeBtn = $(scope, '^s2')
    expect(closeBtn).not.toBeNull()
    expect(closeBtn?.textContent).toBe('Close')
  })

  test('does NOT find regular slot in child scope (existing behavior preserved)', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="~Child_xyz">
          <button bf="s3">Click</button>
        </div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    const btn = $(scope, 's3')
    expect(btn).toBeNull()
  })

  test('returns null for null scope with ^-prefixed slot', () => {
    const el = $(null, '^s0')
    expect(el).toBeNull()
  })
})

describe('$ (batch mode)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('returns array for 2+ IDs', () => {
    document.body.innerHTML = `
      <div bf-s="Demo_abc">
        <button bf="s0">btn0</button>
        <input bf="s1" />
        <span bf="s2">text</span>
      </div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')
    const [el0, el1, el2] = $(scope, 's0', 's1', 's2') as (Element | null)[]
    expect(el0?.textContent).toBe('btn0')
    expect(el1?.tagName.toLowerCase()).toBe('input')
    expect(el2?.textContent).toBe('text')
  })

  test('batch with mix of regular and ^-prefixed IDs', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <button bf="s0">regular</button>
        <div bf-s="~Child_xyz">
          <span bf="^s1">parent-owned</span>
        </div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    const [el0, el1] = $(scope, 's0', '^s1') as (Element | null)[]
    expect(el0?.textContent).toBe('regular')
    expect(el1?.textContent).toBe('parent-owned')
  })

  test('batch with null scope returns array of nulls', () => {
    const results = $(null, 's0', 's1') as (Element | null)[]
    expect(results).toEqual([null, null])
  })

  test('batch with missing elements returns null for those slots', () => {
    document.body.innerHTML = `
      <div bf-s="Demo_abc">
        <button bf="s0">exists</button>
      </div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')
    const [el0, el1] = $(scope, 's0', 's1') as (Element | null)[]
    expect(el0?.textContent).toBe('exists')
    expect(el1).toBeNull()
  })
})

describe('$t (single mode)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds text node after comment marker', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_abc"><!--bf:s0-->42<!--/--></div>
    `
    const scope = document.querySelector('[bf-s="Counter_abc"]')
    const textNode = $t(scope, 's0')
    expect(textNode).not.toBeNull()
    expect(textNode?.nodeValue).toBe('42')
  })

  test('creates text node when none exists after marker', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_abc"><!--bf:s0--><!--/--></div>
    `
    const scope = document.querySelector('[bf-s="Counter_abc"]')
    const textNode = $t(scope, 's0')
    expect(textNode).not.toBeNull()
    expect(textNode?.nodeValue).toBe('')
  })

  test('returns null for null scope', () => {
    expect($t(null, 's0')).toBeNull()
  })

  test('returns null for missing marker', () => {
    document.body.innerHTML = `
      <div bf-s="Counter_abc">no markers here</div>
    `
    const scope = document.querySelector('[bf-s="Counter_abc"]')
    expect($t(scope, 's0')).toBeNull()
  })

  test('does not find marker inside nested child scope', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="Child_xyz"><!--bf:s0-->nested<!--/--></div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    expect($t(scope, 's0')).toBeNull()
  })

  test('finds ^-prefixed marker (parent-owned)', () => {
    document.body.innerHTML = `
      <div bf-s="Parent_abc">
        <div bf-s="~Child_xyz"><!--bf:^s1-->owned<!--/--></div>
      </div>
    `
    const scope = document.querySelector('[bf-s="Parent_abc"]')
    const textNode = $t(scope, '^s1')
    expect(textNode).not.toBeNull()
    expect(textNode?.nodeValue).toBe('owned')
  })
})

describe('$t (batch mode)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds multiple text nodes in single TreeWalker pass', () => {
    document.body.innerHTML = `
      <div bf-s="Demo_abc">
        <p><!--bf:s0-->hello<!--/--></p>
        <p><!--bf:s1-->world<!--/--></p>
      </div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')
    const [t0, t1] = $t(scope, 's0', 's1') as (Text | null)[]
    expect(t0?.nodeValue).toBe('hello')
    expect(t1?.nodeValue).toBe('world')
  })

  test('batch with null scope returns array of nulls', () => {
    const results = $t(null, 's0', 's1') as (Text | null)[]
    expect(results).toEqual([null, null])
  })

  test('batch with missing markers returns null for those slots', () => {
    document.body.innerHTML = `
      <div bf-s="Demo_abc">
        <p><!--bf:s0-->found<!--/--></p>
      </div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')
    const [t0, t1] = $t(scope, 's0', 's1') as (Text | null)[]
    expect(t0?.nodeValue).toBe('found')
    expect(t1).toBeNull()
  })

  test('batch creates text nodes when none exist after markers', () => {
    document.body.innerHTML = `
      <div bf-s="Demo_abc"><!--bf:s0--><!--/--><!--bf:s1--><!--/--></div>
    `
    const scope = document.querySelector('[bf-s="Demo_abc"]')
    const [t0, t1] = $t(scope, 's0', 's1') as (Text | null)[]
    expect(t0).not.toBeNull()
    expect(t0?.nodeValue).toBe('')
    expect(t1).not.toBeNull()
    expect(t1?.nodeValue).toBe('')
  })
})

describe('$c (batch mode)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('finds multiple child scopes by slot ID', () => {
    document.body.innerHTML = `
      <div bf-s="App_abc">
        <div bf-s="App_abc_s0">child0</div>
        <div bf-s="App_abc_s1">child1</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="App_abc"]')!
    const [c0, c1] = $c(scope, 's0', 's1') as (Element | null)[]
    expect(c0?.textContent).toBe('child0')
    expect(c1?.textContent).toBe('child1')
  })

  test('batch with mix of slot IDs and component names', () => {
    document.body.innerHTML = `
      <div bf-s="App_abc">
        <div bf-s="App_abc_s0">slot</div>
        <div bf-s="~Counter_xyz">counter</div>
      </div>
    `
    const scope = document.querySelector('[bf-s="App_abc"]')!
    const [c0, c1] = $c(scope, 's0', 'Counter') as (Element | null)[]
    expect(c0?.textContent).toBe('slot')
    expect(c1?.textContent).toBe('counter')
  })

  test('batch with null scope returns array of nulls', () => {
    const results = $c(null, 's0', 's1') as (Element | null)[]
    expect(results).toEqual([null, null])
  })
})
