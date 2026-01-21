"use client"
/**
 * TodoItem Component
 * Displays and edits individual todo items
 * Follows TodoMVC HTML structure and styling conventions
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
    <li className={todo.done ? (todo.editing ? 'completed editing' : 'completed') : (todo.editing ? 'editing' : '')}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle()}
        />
        <label onDoubleClick={() => onStartEdit()}>
          {todo.text}
        </label>
        <button className="destroy" onClick={() => onDelete()}></button>
      </div>
      <input
        className="edit"
        value={todo.text}
        autofocus
        onBlur={(e) => onFinishEdit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && onFinishEdit(e.target.value)}
      />
    </li>
  )
}

export default TodoItem
