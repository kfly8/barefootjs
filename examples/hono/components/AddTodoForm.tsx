/**
 * AddTodoForm Component
 * Form to add new todos
 */

import { createSignal } from '@barefootjs/dom'

type Props = {
  onAdd: (text: string) => void
}

function AddTodoForm({ onAdd }: Props) {
  const [newText, setNewText] = createSignal('')

  const handleAdd = () => {
    if (newText().trim()) {
      onAdd(newText().trim())
      setNewText('')
    }
  }

  return (
    <div class="add-form">
      <input
        type="text"
        class="new-todo-input"
        placeholder="Enter new todo..."
        value={newText()}
        onInput={(e) => setNewText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && handleAdd()}
      />
      <button class="add-btn" onClick={() => handleAdd()}>
        Add
      </button>
    </div>
  )
}

export default AddTodoForm
