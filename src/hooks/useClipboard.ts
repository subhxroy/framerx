import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Element } from '@/store/editorStore'

export default function useClipboard() {
  const clipboardRef = useRef<Element[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (!isCmd) return

      const tag = document.activeElement?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT'
      ) return

      const state = useEditorStore.getState()

      if (e.key === 'c') {
        e.preventDefault()
        // store each selected element together with its full subtree
        clipboardRef.current = []
        for (const id of state.selectedIds) {
          const el = state.elements[id]
          if (!el) continue
          const stack = [id]
          while (stack.length) {
            const cur = stack.pop()!
            const node = state.elements[cur]
            if (!node) continue
            clipboardRef.current.push(JSON.parse(JSON.stringify(node)))
            stack.push(...node.children)
          }
        }
        return
      }

      if (e.key === 'v' && clipboardRef.current.length > 0) {
        e.preventDefault()
        state.pushHistory()
        // group clipboard parts by their original root (top-level copied items)
        const partIds = new Set(clipboardRef.current.map((p) => p.id))
        const roots = clipboardRef.current.filter(
          (p) => !p.parentId || !partIds.has(p.parentId)
        )
        const newIds: string[] = []
        for (const root of roots) {
          // collect this root's subtree from the clipboard
          const subtree: typeof clipboardRef.current = []
          const stack = [root.id!]
          while (stack.length) {
            const cur = stack.pop()!
            const node = clipboardRef.current.find((p) => p.id === cur)
            if (!node) continue
            subtree.push(node)
            stack.push(...(node.children || []))
          }
          // paste roots at the canvas root, offset by 20px
          const detached = subtree.map((p) =>
            p.id === root.id ? { ...p, parentId: null } : p
          )
          const newRootId = state.addElementTree(detached, root.id!)
          const rootEl = useEditorStore.getState().elements[newRootId]
          if (rootEl) {
            useEditorStore.getState().updateElement(newRootId, {
              name: rootEl.name + ' Copy',
              x: rootEl.x + 20,
              y: rootEl.y + 20,
            })
          }
          newIds.push(newRootId)
        }
        state.setSelectedIds(newIds)
        return
      }

      if (e.key === 'x') {
        e.preventDefault()
        if (state.selectedIds.length === 0) return
        clipboardRef.current = []
        state.pushHistory()
        for (const id of [...state.selectedIds]) {
          const el = state.elements[id]
          if (el) clipboardRef.current.push(JSON.parse(JSON.stringify(el)))
          state.deleteElement(id)
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
