/**
 * BarefootJS Runtime - Browser-compatible minimal runtime
 */

export function signal(initialValue) {
  let value = initialValue
  const get = () => value
  const set = (valueOrFn) => {
    value = typeof valueOrFn === 'function' ? valueOrFn(value) : valueOrFn
  }
  return [get, set]
}
