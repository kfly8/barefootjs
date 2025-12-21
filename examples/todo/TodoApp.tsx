/**
 * BarefootJS TodoApp
 *
 * メインコンポーネント - 状態管理と子コンポーネントの統合
 */

import { signal } from 'barefoot'
import TodoItem from './TodoItem'
import AddTodoForm from './AddTodoForm'

type Todo = {
  id: number
  text: string
  done: boolean
  editing: boolean
}

function TodoApp() {
  const [todos, setTodos] = signal<Todo[]>([
    { id: 1, text: 'プロジェクトのセットアップ', done: false, editing: false },
    { id: 2, text: 'コンポーネントを作成', done: false, editing: false },
    { id: 3, text: 'テストを書く', done: true, editing: false },
  ])

  const [nextId, setNextId] = signal(4)

  const handleAdd = (text: string) => {
    setTodos([...todos(), { id: nextId(), text, done: false, editing: false }])
    setNextId(nextId() + 1)
  }

  const handleToggle = (id: number) => {
    setTodos(todos().map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const handleDelete = (id: number) => {
    setTodos(todos().filter(t => t.id !== id))
  }

  const handleStartEdit = (id: number) => {
    setTodos(todos().map(t => t.id === id ? { ...t, editing: true } : t))
  }

  const handleFinishEdit = (id: number, text: string) => {
    setTodos(todos().map(t => t.id === id ? { ...t, text: text.trim() || t.text, editing: false } : t))
  }

  return (
    <div>
      <h1>BarefootJS Todo</h1>

      <p class="status">
        完了: <span class="count">{todos().filter(t => t.done).length}</span> / <span class="total">{todos().length}</span>
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
