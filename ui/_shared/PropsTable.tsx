import { useRequestContext } from 'hono/jsx-renderer'
import manifest from './manifest.json'

export function PropsTable({ props, "data-key": __dataKey, __listIndex }: { props: PropDefinition[]; "data-key"?: string | number; __listIndex?: number }) {

  // Try to get request context for script deduplication
  // Falls back to always outputting scripts when inside Suspense boundaries
  let __outputScripts: Set<string> | null = null
  let __needsBarefoot = true
  let __needsThis = true
  try {
    const c = useRequestContext()
    __outputScripts = c.get('bfOutputScripts') || new Set<string>()
    __needsBarefoot = !__outputScripts.has('__barefoot__')
    __needsThis = !__outputScripts.has('PropsTable')
    if (__needsBarefoot) __outputScripts.add('__barefoot__')
    if (__needsThis) __outputScripts.add('PropsTable')
    c.set('bfOutputScripts', __outputScripts)
  } catch {
    // Inside Suspense boundary - context unavailable
    // Always output scripts (browser will deduplicate)
  }

  const __barefootSrc = (manifest as any)['__barefoot__']?.clientJs
  const __thisSrc = (manifest as any)['PropsTable']?.clientJs

  // Check if this is the root BarefootJS component (first to render)
  // Only root component outputs data-bf-props to avoid duplicate hydration data
  let __isRoot = true
  try {
    const c = useRequestContext()
    __isRoot = !c.get('bfRootComponent')
    if (__isRoot) {
      c.set('bfRootComponent', 'PropsTable')
    }
  } catch {
    // Inside Suspense boundary - treat as root
  }

  // Serialize props for client hydration (only serializable values)
  const __hydrateProps: Record<string, unknown> = {}
  if (typeof props !== 'function') __hydrateProps['props'] = props
  const __hasHydrateProps = Object.keys(__hydrateProps).length > 0

  return (
    <>
      {__needsBarefoot && __barefootSrc && <script type="module" src={`/static/${__barefootSrc}`} />}
      {__needsThis && __thisSrc && <script type="module" src={`/static/${__thisSrc}`} />}
      {__isRoot && __hasHydrateProps && (
        <script
          type="application/json"
          data-bf-props="PropsTable"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(__hydrateProps) }}
        />
      )}
      <div {...(__dataKey !== undefined ? { "data-key": __dataKey } : {})} data-bf-scope="PropsTable" className="border border-zinc-800 rounded-lg overflow-hidden"><table className="w-full text-left"><thead className="bg-zinc-900"><tr className="border-b border-zinc-800"><th className="py-3 px-4 text-sm font-medium text-zinc-100">Prop</th><th className="py-3 px-4 text-sm font-medium text-zinc-100">Type</th><th className="py-3 px-4 text-sm font-medium text-zinc-100">Default</th><th className="py-3 px-4 text-sm font-medium text-zinc-100">Description</th></tr></thead><tbody>{props?.map((prop, __index) => (<PropRow {...prop} __listIndex={__index} />))}</tbody></table></div>
    </>
  )
}
