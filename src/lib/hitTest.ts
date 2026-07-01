import type { Element } from '@/store/editorStore'

/** Depth of an element in the tree (root = 0). */
function depthOf(id: string, elements: Record<string, Element>): number {
  let d = 0
  let cur = elements[id]?.parentId
  while (cur) {
    d++
    cur = elements[cur]?.parentId
  }
  return d
}

/** True when `id` is a descendant of `ancestorId` (strict — not the ancestor itself). */
export function isDescendant(
  id: string,
  ancestorId: string,
  elements: Record<string, Element>
): boolean {
  let cur = elements[id]?.parentId
  while (cur) {
    if (cur === ancestorId) return true
    cur = elements[cur]?.parentId
  }
  return false
}

/**
 * Returns the deepest frame/stack whose on-screen box contains the point and
 * that can accept `draggedId` as a child — excluding the dragged element itself
 * and its own descendants (you can't drop a node into its own subtree). Used
 * for drag-to-nest reparenting. Returns null when the point is over no valid
 * container (⇒ drop onto the canvas root).
 */
export function findContainerAt(
  clientX: number,
  clientY: number,
  elements: Record<string, Element>,
  draggedId: string
): string | null {
  const nodes = document.querySelectorAll<HTMLElement>('[data-element-id]')
  let best: string | null = null
  let bestDepth = -1
  nodes.forEach((node) => {
    const id = node.getAttribute('data-element-id')
    if (!id || !elements[id]) return
    const el = elements[id]
    if (el.type !== 'frame' && el.type !== 'stack') return
    if (id === draggedId || isDescendant(id, draggedId, elements)) return
    const r = node.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return
    const d = depthOf(id, elements)
    if (d > bestDepth) {
      bestDepth = d
      best = id
    }
  })
  return best
}

/**
 * Returns the deepest (most nested) element whose on-screen box contains the
 * given client point. Uses live `getBoundingClientRect` of the rendered
 * `[data-element-id]` nodes, so it is correct for both absolutely-positioned
 * and auto-layout (flow) children, and unaffected by `pointer-events:none`
 * wrappers used for nested selection.
 *
 * When `withinId` is provided, only elements strictly inside that subtree are
 * considered — used to drill one level deeper than the current selection.
 */
export function hitTestDeepest(
  clientX: number,
  clientY: number,
  elements: Record<string, Element>,
  withinId?: string | null
): string | null {
  const nodes = document.querySelectorAll<HTMLElement>('[data-element-id]')
  let best: string | null = null
  let bestDepth = -1
  nodes.forEach((node) => {
    const id = node.getAttribute('data-element-id')
    if (!id || !elements[id]) return
    if (withinId && !isDescendant(id, withinId, elements)) return
    const r = node.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return
    const d = depthOf(id, elements)
    if (d > bestDepth) {
      bestDepth = d
      best = id
    }
  })
  return best
}
