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
    const newTodo: Todo = { id: nextId(), text: text.trim() }
    setNextId(nextId() + 1)
    setTodos([...todos(), newTodo])
  }

  const handleRemove = (id: number) => {
    setTodos(todos().filter(t => t.id !== id))
  }

  const handleAddMultiple = () => {
    const newTodos: Todo[] = []
    for (let i = 0; i < 3; i++) {
      newTodos.push({ id: nextId() + i, text: `Batch item ${nextId() + i}` })
    }
    setNextId(nextId() + 3)
    setTodos([...todos(), ...newTodos])
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
          <li key={todo.id} class="animated-item">
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
