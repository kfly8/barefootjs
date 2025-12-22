/**
 * BarefootJS TodoApp for Hono with SSR
 *
 * Main component - renders initial todos from server, then uses API for updates
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

type Props = {
  initialTodos?: Array<{ id: number; text: string; done: boolean }>
}

function TodoApp({ initialTodos = [] }: Props) {
  const [todos, setTodos] = createSignal<Todo[]>(
    initialTodos.map(t => ({ ...t, editing: false }))
  )

  const handleAdd = async (text: string) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const newTodo = await res.json()
      setTodos([...todos(), { ...newTodo, editing: false }])
    } catch (err) {
      console.error('Failed to add todo:', err)
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
    } catch (err) {
      console.error('Failed to update todo:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      setTodos(todos().filter(t => t.id !== id))
    } catch (err) {
      console.error('Failed to delete todo:', err)
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
    } catch (err) {
      console.error('Failed to update todo:', err)
    }
  }

  return (
    <div>
      <h1>BarefootJS Todo (SSR + API)</h1>

      <p class="status">
        Done: <span class="count">{todos().filter(t => t.done).length}</span> / <span class="total">{todos().length}</span>
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
  )
}

export default TodoApp
