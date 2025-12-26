/**
 * Async Counter Wrapper
 *
 * Plain async component that wraps a BarefootJS component.
 * Scripts are automatically included by the component itself.
 */

import Counter from './dist/Counter'

// Simulate async data fetching
async function fetchData(): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return 'Data loaded from server'
}

export async function AsyncCounterWrapper() {
  const message = await fetchData()

  return (
    <div>
      <h2>Async Counter (Wrapper Pattern)</h2>
      <p>{message}</p>
      <Counter />
    </div>
  )
}
