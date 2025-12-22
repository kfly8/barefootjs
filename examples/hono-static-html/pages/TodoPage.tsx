/**
 * Todo Page
 */
import TodoApp from './components/TodoApp'

type Props = {
  initialTodos: Array<{ id: number; text: string; done: boolean }>
}

function TodoPage({ initialTodos }: Props) {
  return (
    <div>
      <TodoApp initialTodos={initialTodos} />
      <p><a href="/">← Back</a></p>
    </div>
  )
}

export default TodoPage
