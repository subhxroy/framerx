import type { Element } from '@/store/editorStore'

/**
 * Absolute canvas position of an element — the sum of its own x/y and all of
 * its ancestors' x/y. Elements store x/y relative to their parent, so this
 * walks up the parent chain to produce a canvas-space coordinate. Guards
 * against cycles.
 */
export function getAbsolutePos(
  id: string,
  elements: Record<string, Element>
): { x: number; y: number } {
  const el = elements[id]
  if (!el) return { x: 0, y: 0 }
  let x = el.x
  let y = el.y
  let parentId = el.parentId
  const visited = new Set<string>([id])
  while (parentId && elements[parentId] && !visited.has(parentId)) {
    visited.add(parentId)
    const parent = elements[parentId]
    x += parent.x
    y += parent.y
    parentId = parent.parentId
  }
  return { x, y }
}
