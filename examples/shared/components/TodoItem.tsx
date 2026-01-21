"use client"
/**
 * TodoItem Component
 * Displays and edits individual todo items
 */

type Todo = {
  id: number
  text: string
  done: boolean
  editing: boolean
}

type Props = {
  todo: Todo
  onToggle: () => void
  onDelete: () => void
  onStartEdit: () => void
  onFinishEdit: (text: string) => void
}

function TodoItem({ todo, onToggle, onDelete, onStartEdit, onFinishEdit }: Props) {
  return (
    <li className={todo.done ? 'todo-item done' : 'todo-item'}>
      {todo.editing ? (
        <input
          type="text"
          className="todo-input"
          value={todo.text}
          autofocus
          onBlur={(e) => onFinishEdit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && onFinishEdit(e.target.value)}
        />
      ) : (
        <span className="todo-text" onClick={() => onStartEdit()}>
          {todo.text}
        </span>
      )}
      <button className="toggle-btn" onClick={() => onToggle()}>
        {todo.done ? 'Undo' : 'Done'}
      </button>
      <button className="delete-btn" onClick={() => onDelete()}>
        Delete
      </button>
    </li>
  )
}

export default TodoItem
