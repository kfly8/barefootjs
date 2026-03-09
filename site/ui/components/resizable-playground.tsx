"use client"
/**
 * Resizable Props Playground
 *
 * Interactive playground for the Resizable components.
 * Allows tweaking direction and withHandle props with live preview.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsx, plainJsx, type HighlightProp } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Checkbox } from '@ui/components/ui/checkbox'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ui/components/ui/resizable'

function ResizablePlayground(_props: {}) {
  const [withHandle, setWithHandle] = createSignal(false)

  const handleProps = (): HighlightProp[] => [
    { name: 'withHandle', value: String(withHandle()), defaultValue: 'false', kind: 'boolean' },
  ]

  createEffect(() => {
    const hp = handleProps()
    const handleAttr = hp[0].value === 'true' ? ' withHandle' : ''
    const code = `<ResizablePanelGroup direction="horizontal">\n  <ResizablePanel defaultSize={50}>One</ResizablePanel>\n  <ResizableHandle${handleAttr} />\n  <ResizablePanel defaultSize={50}>Two</ResizablePanel>\n</ResizablePanelGroup>`
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.textContent = code
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-resizable-preview"
      previewContent={
        <div className="w-full max-w-md">
          <ResizablePanelGroup direction="horizontal" class="rounded-lg border">
            <ResizablePanel defaultSize={50}>
              <div className="flex h-[200px] items-center justify-center p-6">
                <span className="font-semibold">One</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle={withHandle()} />
            <ResizablePanel defaultSize={50}>
              <div className="flex h-[200px] items-center justify-center p-6">
                <span className="font-semibold">Two</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      }
      controls={<>
        <PlaygroundControl label="withHandle">
          <Checkbox
            checked={withHandle()}
            onCheckedChange={setWithHandle}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={`<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50}>One</ResizablePanel>
  <ResizableHandle${withHandle() ? ' withHandle' : ''} />
  <ResizablePanel defaultSize={50}>Two</ResizablePanel>
</ResizablePanelGroup>`} />}
    />
  )
}

export { ResizablePlayground }
