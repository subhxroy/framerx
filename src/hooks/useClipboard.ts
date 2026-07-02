import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Element as EditorElement } from '@/store/editorStore'
import { setClipboard, getClipboard } from '@/lib/clipboard'

export default function useClipboard() {

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (!isCmd) return

      const tag = document.activeElement?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) return

      const state = useEditorStore.getState()

      if (e.key === 'c') {
        e.preventDefault()
        const items: EditorElement[] = []
        for (const id of state.selectedIds) {
          const el = state.elements[id]
          if (!el) continue
          const stack = [id]
          while (stack.length) {
            const cur = stack.pop()!
            const node = state.elements[cur]
            if (!node) continue
            items.push(JSON.parse(JSON.stringify(node)))
            stack.push(...node.children)
          }
        }
        setClipboard(items)
        return
      }

      if (e.key === 'v') {
        const clipboard = getClipboard()
        if (clipboard.length === 0) return
        e.preventDefault()
        state.pushHistory()
        const partIds = new Set(clipboard.map((p) => p.id))
        const roots = clipboard.filter(
          (p) => !p.parentId || !partIds.has(p.parentId)
        )
        const newIds: string[] = []
        for (const root of roots) {
          const subtree: EditorElement[] = []
          const stack = [root.id!]
          while (stack.length) {
            const cur = stack.pop()!
            const node = clipboard.find((p) => p.id === cur)
            if (!node) continue
            subtree.push(node)
            stack.push(...(node.children || []))
          }
          const isContainer =
            state.selectedIds.length === 1 &&
            (state.elements[state.selectedIds[0]]?.type === 'frame' ||
             state.elements[state.selectedIds[0]]?.type === 'stack')
          const targetParentId = isContainer ? state.selectedIds[0] : null
          const subtreeWithParent = subtree.map((p) =>
            p.id === root.id ? { ...p, parentId: targetParentId } : p
          )
          const newRootId = state.addElementTree(subtreeWithParent, root.id!)
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
        const items: EditorElement[] = []
        state.pushHistory()
        for (const id of [...state.selectedIds]) {
          const stack = [id]
          while (stack.length) {
            const cur = stack.pop()!
            const node = state.elements[cur]
            if (!node) continue
            items.push(JSON.parse(JSON.stringify(node)))
            stack.push(...node.children)
          }
          state.deleteElement(id)
        }
        setClipboard(items)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
