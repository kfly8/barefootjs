/**
 * Counter コンポーネント
 *
 * このファイルからコンパイラが：
 * - サーバー用コンポーネント（Hono JSX）
 * - クライアント用JS（インタラクティブ化）
 * を生成する
 */

import { signal } from 'barefoot'

function Counter() {
  const [count, setCount] = signal(0)

  return (
    <div>
      <p class="counter">{count()}</p>
      <p class="doubled">doubled: {count() * 2}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
      <button onClick={() => setCount(n => n - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

export default Counter
