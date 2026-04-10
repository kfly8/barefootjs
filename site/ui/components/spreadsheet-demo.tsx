"use client"
/**
 * SpreadsheetDemo
 *
 * Spreadsheet grid with cell editing, formulas, selection, and stats.
 *
 * Compiler stress targets:
 * - Dynamic loop with per-item conditional (edit vs view mode)
 * - Cross-cell formula evaluation via memo chain
 * - Controlled input inside conditional branch
 * - Per-item signal updates (cell value changes)
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Button } from '@ui/components/ui/button'
import { Input } from '@ui/components/ui/input'
import { Badge } from '@ui/components/ui/badge'

// --- Types ---

type CellValue = string | number
type Cell = {
  id: string
  value: CellValue
  formula: string | null
}

// --- Helpers ---

const COLS = ['A', 'B', 'C', 'D']
const ROWS = [1, 2, 3, 4, 5]

function cellId(col: string, row: number): string {
  return `${col}${row}`
}

function formatValue(v: CellValue): string {
  if (typeof v === 'number') return v.toLocaleString()
  return String(v)
}

function initialCells(): Cell[] {
  const data: Record<string, { value: CellValue; formula: string | null }> = {
    A1: { value: 'Product', formula: null }, B1: { value: 'Price', formula: null },
    C1: { value: 'Qty', formula: null }, D1: { value: 'Total', formula: null },
    A2: { value: 'Widget', formula: null }, B2: { value: 29.99, formula: null },
    C2: { value: 10, formula: null }, D2: { value: 299.9, formula: '=B2*C2' },
    A3: { value: 'Gadget', formula: null }, B3: { value: 49.99, formula: null },
    C3: { value: 5, formula: null }, D3: { value: 249.95, formula: '=B3*C3' },
    A4: { value: 'Doohickey', formula: null }, B4: { value: 9.99, formula: null },
    C4: { value: 20, formula: null }, D4: { value: 199.8, formula: '=B4*C4' },
    A5: { value: 'Total', formula: null }, B5: { value: '', formula: null },
    C5: { value: '', formula: null }, D5: { value: 749.65, formula: '=SUM(D2:D4)' },
  }
  const cells: Cell[] = []
  for (const row of ROWS) {
    for (const col of COLS) {
      const id = cellId(col, row)
      const d = data[id] || { value: '', formula: null }
      cells.push({ id, value: d.value, formula: d.formula })
    }
  }
  return cells
}

// Simple formula evaluator
function evaluateFormulas(cells: Cell[]): Record<string, CellValue> {
  const byId: Record<string, Cell> = {}
  for (const c of cells) byId[c.id] = c

  const result: Record<string, CellValue> = {}
  for (const c of cells) {
    if (!c.formula) { result[c.id] = c.value; continue }
    const expr = c.formula.slice(1)
    // =SUM(X1:X3)
    const sumMatch = expr.match(/^SUM\(([A-D])(\d+):([A-D])(\d+)\)$/)
    if (sumMatch) {
      let sum = 0
      for (let r = parseInt(sumMatch[2], 10); r <= parseInt(sumMatch[4], 10); r++) {
        const v = byId[cellId(sumMatch[1], r)]?.value
        if (typeof v === 'number') sum += v
      }
      result[c.id] = Math.round(sum * 100) / 100
      continue
    }
    // =X1*Y1
    const mulMatch = expr.match(/^([A-D])(\d+)\*([A-D])(\d+)$/)
    if (mulMatch) {
      const a = byId[cellId(mulMatch[1], parseInt(mulMatch[2], 10))]?.value
      const b = byId[cellId(mulMatch[3], parseInt(mulMatch[4], 10))]?.value
      result[c.id] = typeof a === 'number' && typeof b === 'number' ? Math.round(a * b * 100) / 100 : 0
      continue
    }
    result[c.id] = c.formula
  }
  return result
}

// --- Component ---

export function SpreadsheetDemo() {
  const [cells, setCells] = createSignal<Cell[]>(initialCells())
  const [selectedCell, setSelectedCell] = createSignal<string | null>(null)
  const [editingCell, setEditingCell] = createSignal<string | null>(null)
  const [editValue, setEditValue] = createSignal('')

  // Computed values: evaluate all formulas
  const computed = createMemo(() => evaluateFormulas(cells()))

  // Stats
  const filledCount = createMemo(() => {
    const c = computed()
    return Object.values(c).filter(v => v !== '' && v !== null && v !== undefined).length
  })

  const numericSum = createMemo(() => {
    const c = computed()
    return Object.values(c).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0)
  })

  // Cell interaction
  const selectCell = (id: string) => {
    if (editingCell() === id) return
    setSelectedCell(id)
    setEditingCell(null)
  }

  const startEditing = (id: string) => {
    const cell = cells().find(c => c.id === id)
    setEditingCell(id)
    setSelectedCell(id)
    setEditValue(cell?.formula || String(cell?.value ?? ''))
  }

  const commitEdit = () => {
    const id = editingCell()
    if (!id) return
    const raw = editValue()
    let value: CellValue = raw
    let formula: string | null = null
    if (raw.startsWith('=')) {
      formula = raw
      value = 0 // will be computed
    } else {
      const num = parseFloat(raw)
      if (!isNaN(num) && String(num) === raw) value = num
    }
    setCells(prev => prev.map(c => c.id === id ? { ...c, value, formula } : c))
    setEditingCell(null)
  }

  const cancelEdit = () => setEditingCell(null)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  const clearCell = () => {
    const id = selectedCell()
    if (!id) return
    setCells(prev => prev.map(c => c.id === id ? { ...c, value: '', formula: null } : c))
  }

  // Get column index for grid layout
  const colIndex = (id: string) => COLS.indexOf(id[0])

  return (
    <div className="spreadsheet-page w-full max-w-3xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Spreadsheet</h2>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="filled-count">{filledCount()} cells</Badge>
          <Button variant="outline" size="sm" className="clear-btn" onClick={clearCell} disabled={!selectedCell()}>
            Clear Cell
          </Button>
        </div>
      </div>

      {/* Formula bar */}
      <div className="formula-bar flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/30 text-sm">
        <span className="cell-ref font-mono font-medium w-8">{selectedCell() || ''}</span>
        <span className="text-muted-foreground">|</span>
        <span className="cell-formula flex-1 font-mono text-muted-foreground">
          {selectedCell() ? (cells().find(c => c.id === selectedCell())?.formula || formatValue(computed()[selectedCell()!] ?? '')) : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="spreadsheet-grid border rounded-lg overflow-hidden">
        <div className="grid" style="grid-template-columns: 40px repeat(4, 1fr)">
          {/* Column headers */}
          <div className="p-2 border-r border-b bg-muted/50 text-center text-xs text-muted-foreground" />
          {COLS.map(col => (
            <div key={col} className="col-header p-2 border-r border-b bg-muted/50 text-center text-xs font-medium">{col}</div>
          ))}
          {/* Row headers (static) */}
          {ROWS.map(row => (
            <div key={row} className="row-header p-2 border-r border-b bg-muted/30 text-center text-xs text-muted-foreground font-medium" style={`grid-column: 1; grid-row: ${row + 1}`}>
              {row}
            </div>
          ))}
          {/* Cells: flat dynamic loop */}
          {cells().map(cell => (
            <div
              key={cell.id}
              className={`spreadsheet-cell border-r border-b p-0 h-9 cursor-pointer ${selectedCell() === cell.id ? 'ring-2 ring-primary ring-inset bg-primary/5' : 'hover:bg-accent/30'}`}
              style={`grid-column: ${colIndex(cell.id) + 2}; grid-row: ${parseInt(cell.id.slice(1), 10) + 1}`}
              onClick={() => selectedCell() === cell.id ? startEditing(cell.id) : selectCell(cell.id)}
            >
              {editingCell() === cell.id ? (
                <Input
                  value={editValue()}
                  onInput={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitEdit}
                  className="cell-input h-full w-full border-0 rounded-none text-sm px-2 focus-visible:ring-0"
                  ref={(el) => requestAnimationFrame(() => el.focus())}
                />
              ) : (
                <div className="cell-value px-2 py-1.5 truncate text-sm">
                  {formatValue(computed()[cell.id] ?? '')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar flex gap-4 text-xs text-muted-foreground">
        <span className="sum-display">Sum: {numericSum().toLocaleString()}</span>
      </div>
    </div>
  )
}
