/**
 * Spreadsheet Reference Page (/components/spreadsheet)
 */

import { SpreadsheetDemo } from '@/components/spreadsheet-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/client'
import { Input } from '@/components/ui/input'

const COLS = ['A', 'B', 'C']
const ROWS = [1, 2, 3]

function Spreadsheet() {
  const [cells, setCells] = createSignal({})
  const [editing, setEditing] = createSignal(null)

  return (
    <table>
      {ROWS.map(row => (
        <tr key={row}>
          {COLS.map(col => (
            <td key={col} onDblClick={() => setEditing(col + row)}>
              {editing() === col + row
                ? <Input value={cells()[col + row] ?? ''} />
                : <span>{cells()[col + row] ?? ''}</span>}
            </td>
          ))}
        </tr>
      ))}
    </table>
  )
}`

export function SpreadsheetRefPage() {
  return (
    <DocPage slug="spreadsheet" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Spreadsheet"
          description="A spreadsheet grid with cell editing, formula evaluation, selection highlighting, and computed statistics."
          {...getNavLinks('spreadsheet')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <SpreadsheetDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">2D Nested Loops</h3>
              <p className="text-sm text-muted-foreground">
                Rows and columns are rendered with nested .map() loops. Inner loop param
                expressions are wrapped as signal accessors for per-cell reactivity.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Loop Root Dynamic Class</h3>
              <p className="text-sm text-muted-foreground">
                Selected cell gets a ring highlight via dynamic className on the loop root
                td element. Tests loop root reactive attribute updates.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Cell Editing with Conditional</h3>
              <p className="text-sm text-muted-foreground">
                Double-click a cell to enter edit mode. The conditional switches between
                an Input component and a plain div — tests conditional rendering inside
                nested loops.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Formula Evaluation</h3>
              <p className="text-sm text-muted-foreground">
                Cells can contain formulas (=B2*C2, =SUM(D2:D4)). A createMemo evaluates
                all formulas when any cell changes, creating a cross-cell reactive dependency.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
