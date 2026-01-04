"use client"

/**
 * AnimatedTodoList Component
 *
 * Demonstrates CSS transitions with list reconciliation.
 * - Add: fade-in + slide-down animation
 * - Remove: fade-out + slide-up animation (using CSS animation)
 * - Items maintain animation state during rapid operations
 */

import { createSignal } from '@barefootjs/dom'

type Todo = {
  id: number
  text: string
  isNew?: boolean
}

type Props = {
  initialTodos?: Array<{ id: number; text: string }>
}

function AnimatedTodoList({ initialTodos = [] }: Props) {
  const [todos, setTodos] = createSignal<Todo[]>(initialTodos)
  const [nextId, setNextId] = createSignal(
    (() => {
      const ids = initialTodos.map(t => t.id)
      return ids.length > 0 ? Math.max(...ids) + 1 : 1
    })()
  )

  const handleAdd = (text: string) => {
    if (!text.trim()) return
    const newId = nextId()
    const newTodo: Todo = { id: newId, text: text.trim(), isNew: true }
    setNextId(newId + 1)
    setTodos([...todos(), newTodo])
    // Clear isNew flag after animation completes (300ms)
    setTimeout(() => {
      setTodos(todos().map(t => t.id === newId ? { ...t, isNew: false } : t))
    }, 350)
  }

  const handleRemove = (id: number) => {
    setTodos(todos().filter(t => t.id !== id))
  }

  const handleAddMultiple = () => {
    const startId = nextId()
    const newTodos: Todo[] = []
    const newIds: number[] = []
    for (let i = 0; i < 3; i++) {
      const id = startId + i
      newIds.push(id)
      newTodos.push({ id, text: `Batch item ${id}`, isNew: true })
    }
    setNextId(startId + 3)
    setTodos([...todos(), ...newTodos])
    // Clear isNew flags after animation completes (300ms)
    setTimeout(() => {
      setTodos(todos().map(t => newIds.includes(t.id) ? { ...t, isNew: false } : t))
    }, 350)
  }

  const handleRemoveAll = () => {
    setTodos([])
  }

  return (
    <div class="animated-todo-container">
      <h2>Animated Todo List</h2>
      <p class="item-count">
        Items: <span class="count">{todos().length}</span>
      </p>

      <div class="add-controls">
        <input
          type="text"
          class="add-input"
          placeholder="Add new item..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.isComposing) {
              handleAdd(e.target.value)
              e.target.value = ''
            }
          }}
        />
        <button class="add-btn" onClick={(e) => {
          const controls = e.target.closest('.add-controls')
          const input = controls?.querySelector('.add-input')
          if (input) {
            handleAdd(input.value)
            input.value = ''
          }
        }}>
          Add
        </button>
        <button class="add-multiple-btn" onClick={() => handleAddMultiple()}>
          Add 3
        </button>
        <button class="remove-all-btn" onClick={() => handleRemoveAll()}>
          Clear All
        </button>
      </div>

      <ul class="animated-list">
        {todos().map(todo => (
          <li key={todo.id} class={todo.isNew ? 'animated-item is-new' : 'animated-item'}>
            <span class="item-text">{todo.text}</span>
            <button class="remove-btn" onClick={() => handleRemove(todo.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AnimatedTodoList
