import { useRequestContext } from 'hono/jsx-renderer'
import manifest from './manifest.json'

export function PropRow({ name, type, defaultValue, description, "data-key": __dataKey, __listIndex }: { name: unknown; type: unknown; defaultValue: unknown; description: unknown; "data-key"?: string | number; __listIndex?: number }) {

  // Try to get request context for script deduplication
  // Falls back to always outputting scripts when inside Suspense boundaries
  let __outputScripts: Set<string> | null = null
  let __needsBarefoot = true
  let __needsThis = true
  try {
    const c = useRequestContext()
    __outputScripts = c.get('bfOutputScripts') || new Set<string>()
    __needsBarefoot = !__outputScripts.has('__barefoot__')
    __needsThis = !__outputScripts.has('PropRow')
    if (__needsBarefoot) __outputScripts.add('__barefoot__')
    if (__needsThis) __outputScripts.add('PropRow')
    c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Inside Suspense boundary - context unavailable
    // Always output scripts (browser will deduplicate)
  }

  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['PropRow']?.clientJs

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  let __isRoot = true
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', 'PropRow')
    }
  } catch {
    // Inside Suspense boundary - treat as root
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  if (typeof name !== 'function') __hydrateProps['name'] = name
  if (typeof type !== 'function') __hydrateProps['type'] = type
  if (typeof defaultValue !== 'function') __hydrateProps['defaultValue'] = defaultValue
  if (typeof description !== 'function') __hydrateProps['description'] = description
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  return (
    <>
      {__needsBarefoot && __barefootSrc && <script type="module" src={`/static/${__barefootSrc}`} />}
      {__needsThis && __thisSrc && <script type="module" src={`/static/${__thisSrc}`} />}
      {__isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="PropRow"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
      <tr {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})} data-bf-scope="PropRow" className="border-b border-zinc-800 last:border-b-0"><td className="py-3 px-4 font-mono text-sm text-zinc-100">{name}</td><td className="py-3 px-4 font-mono text-sm text-zinc-400">{type}</td><td className="py-3 px-4 font-mono text-sm text-zinc-400">{defaultValue || '-'}</td><td className="py-3 px-4 text-sm text-zinc-300">{description}</td></tr>
    </>
  )
}
