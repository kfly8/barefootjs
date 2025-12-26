import { useRequestContext } from 'hono/jsx-renderer'
import manifest from './manifest.json'

export function Preview({ children, "data-key": __dataKey, __listIndex }: { children: any; "data-key"?: string | number; __listIndex?: number }) {

  // Try to get request context for script deduplication
  // Falls back to always outputting scripts when inside Suspense boundaries
  let __outputScripts: Set<string> | null = null
  let __needsBarefoot = true
  let __needsThis = true
  try {
    const c = useRequestContext()
    __outputScripts = c.get('bfOutputScripts') || new Set<string>()
    __needsBarefoot = !__outputScripts.has('__barefoot__')
    __needsThis = !__outputScripts.has('Preview')
    if (__needsBarefoot) __outputScripts.add('__barefoot__')
    if (__needsThis) __outputScripts.add('Preview')
    c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Inside Suspense boundary - context unavailable
    // Always output scripts (browser will deduplicate)
  }

  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['Preview']?.clientJs

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  let __isRoot = true
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', 'Preview')
    }
  } catch {
    // Inside Suspense boundary - treat as root
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  if (typeof children !== 'function') __hydrateProps['children'] = children
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  return (
    <>
      {__needsBarefoot && __barefootSrc && <script type="module" src={`/static/${__barefootSrc}`} />}
      {__needsThis && __thisSrc && <script type="module" src={`/static/${__thisSrc}`} />}
      {__isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="Preview"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
      <div {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})} data-bf-scope="Preview" data-bf="0" className="flex flex-wrap items-center gap-4 p-6 border border-zinc-800 rounded-lg bg-zinc-900">{typeof children === 'function' ? children() : children}</div>
    </>
  )
}
