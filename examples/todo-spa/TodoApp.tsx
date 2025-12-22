/**
 * BarefootJS TodoApp SPA
 *
 * Main component - fetches todos from API using createEffect
 */

import { createSignal, createEffect } from 'barefoot'
import TodoItem from './TodoItem'
import AddTodoForm from './AddTodoForm'

type Todo = {
  id: number
  text: string
  done: boolean
  editing: boolean
}

function TodoApp() {
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  // Fetch todos from API on mount
  createEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => {
        setTodos(data.map((t: any) => ({ ...t, editing: false })))
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load todos: ' + err.message)
        setLoading(false)
      })
  })

  const handleAdd = async (text: string) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const newTodo = await res.json()
      setTodos([...todos(), { ...newTodo, editing: false }])
    } catch (err: any) {
      setError('Failed to add todo: ' + err.message)
    }
  }

  const handleToggle = async (id: number) => {
    const todo = todos().find(t => t.id === id)
    if (!todo) return

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !todo.done }),
      })
      const updatedTodo = await res.json()
      setTodos(todos().map(t => t.id === id ? { ...updatedTodo, editing: t.editing } : t))
    } catch (err: any) {
      setError('Failed to update todo: ' + err.message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      setTodos(todos().filter(t => t.id !== id))
    } catch (err: any) {
      setError('Failed to delete todo: ' + err.message)
    }
  }

  const handleStartEdit = (id: number) => {
    setTodos(todos().map(t => t.id === id ? { ...t, editing: true } : t))
  }

  const handleFinishEdit = async (id: number, text: string) => {
    const trimmedText = text.trim()
    if (!trimmedText) {
      setTodos(todos().map(t => t.id === id ? { ...t, editing: false } : t))
      return
    }

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText }),
      })
      const updatedTodo = await res.json()
      setTodos(todos().map(t => t.id === id ? { ...updatedTodo, editing: false } : t))
    } catch (err: any) {
      setError('Failed to update todo: ' + err.message)
    }
  }

  return (
    <div>
      <div class="loading">Loading todos...</div>
      
      <div class="content hidden">
        <div class="error" style="display: none;"></div>

        <p class="status">
          Done: <span class="count">0</span> / <span class="total">0</span>
        </p>

        <AddTodoForm onAdd={handleAdd} />

        <ul class="todo-list">
          {todos().map(todo => (
            <TodoItem
              todo={todo}
              onToggle={() => handleToggle(todo.id)}
              onDelete={() => handleDelete(todo.id)}
              onStartEdit={() => handleStartEdit(todo.id)}
              onFinishEdit={(text) => handleFinishEdit(todo.id, text)}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

export default TodoApp
