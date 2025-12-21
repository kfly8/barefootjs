/**
 * AddTodoForm コンポーネント
 * 新しいTodoを追加するフォーム
 */

import { signal } from 'barefoot'

type Props = {
  onAdd: (text: string) => void
}

function AddTodoForm({ onAdd }: Props) {
  const [newText, setNewText] = signal('')

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
        placeholder="新しいTodoを入力..."
        value={newText()}
        onInput={(e) => setNewText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && handleAdd()}
      />
      <button class="add-btn" onClick={() => handleAdd()}>
        追加
      </button>
    </div>
  )
}

export default AddTodoForm
