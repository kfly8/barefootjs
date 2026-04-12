import { untrack } from '@barefootjs/client'
import { getBezierPath } from '@xyflow/system'
import type { FlowStore, NodeBase, EdgeBase } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Set up handle-to-handle edge creation via mouse drag.
 * Listens for mousedown on .bf-flow__handle elements within the container.
 */
export function setupConnectionHandler<
  NodeType extends NodeBase = NodeBase,
  EdgeType extends EdgeBase = EdgeBase,
>(
  container: HTMLElement,
  edgesSvg: SVGSVGElement,
  store: FlowStore<NodeType, EdgeType>,
): void {
  let connectionLine: SVGPathElement | null = null
  let fromNodeId: string | null = null
  let fromHandleType: string | null = null

  container.addEventListener('mousedown', (e) => {
    const handle = (e.target as HTMLElement).closest?.('.bf-flow__handle') as HTMLElement | null
    if (!handle) return
    if (!untrack(store.nodesDraggable)) return // locked

    e.stopPropagation()
    e.preventDefault()

    fromNodeId = handle.dataset.nodeId ?? null
    fromHandleType = handle.dataset.handleType ?? null
    if (!fromNodeId) return

    // Get source handle position (center of handle element)
    const handleRect = handle.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const [, , scale] = store.getTransform()
    const vp = untrack(store.viewport)

    const sourceX = (handleRect.left + handleRect.width / 2 - containerRect.left - vp.x) / scale
    const sourceY = (handleRect.top + handleRect.height / 2 - containerRect.top - vp.y) / scale

    // Create temporary connection line
    connectionLine = document.createElementNS(SVG_NS, 'path')
    connectionLine.setAttribute('fill', 'none')
    connectionLine.setAttribute('stroke', '#b1b1b7')
    connectionLine.setAttribute('stroke-width', '1.5')
    connectionLine.setAttribute('stroke-dasharray', '5')
    edgesSvg.appendChild(connectionLine)

    const onMouseMove = (e: MouseEvent) => {
      if (!connectionLine) return

      const targetX = (e.clientX - containerRect.left - vp.x) / scale
      const targetY = (e.clientY - containerRect.top - vp.y) / scale

      const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition: fromHandleType === 'source' ? 'bottom' as any : 'top' as any,
        targetX,
        targetY,
        targetPosition: fromHandleType === 'source' ? 'top' as any : 'bottom' as any,
      })

      connectionLine.setAttribute('d', path)
    }

    const onMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      // Check if released on a target handle
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)
      const targetHandle = targetEl?.closest?.('.bf-flow__handle') as HTMLElement | null

      if (
        targetHandle &&
        targetHandle.dataset.nodeId &&
        targetHandle.dataset.nodeId !== fromNodeId
      ) {
        const targetNodeId = targetHandle.dataset.nodeId
        // Determine source/target based on handle types
        let source = fromNodeId!
        let target = targetNodeId
        if (fromHandleType === 'target') {
          source = targetNodeId
          target = fromNodeId!
        }

        // Create edge
        const edgeId = `e-${source}-${target}-${Date.now()}`
        const newEdge = { id: edgeId, source, target } as EdgeType

        // Call onConnect if set
        if (store.onConnect) {
          store.onConnect({ source, target, sourceHandle: null, targetHandle: null })
        }

        store.addEdge(newEdge)
      }

      // Remove connection line
      if (connectionLine) {
        connectionLine.remove()
        connectionLine = null
      }
      fromNodeId = null
      fromHandleType = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
}
