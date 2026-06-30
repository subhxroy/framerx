import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (document.activeElement?.getAttribute('contenteditable') === 'true')
  )
}

function isCmdOrCtrl(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}

export default function useKeyboard() {
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const duplicateElement = useEditorStore((s) => s.duplicateElement)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const elements = useEditorStore((s) => s.elements)
  const bringForward = useEditorStore((s) => s.bringForward)
  const sendBackward = useEditorStore((s) => s.sendBackward)
  const groupSelection = useEditorStore((s) => s.groupSelection)
  const ungroup = useEditorStore((s) => s.ungroup)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selectedIds.length > 0) {
          pushHistory()
          for (const id of [...selectedIds]) {
            deleteElement(id)
          }
        }
        return
      }

      // Cmd+D — Duplicate
      if (isCmdOrCtrl(e) && e.key === 'd') {
        e.preventDefault()
        if (selectedIds.length > 0) {
          pushHistory()
          for (const id of [...selectedIds].reverse()) {
            duplicateElement(id)
          }
        }
        return
      }

      // Cmd+Z — Undo
      if (isCmdOrCtrl(e) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      // Cmd+Shift+Z — Redo
      if (isCmdOrCtrl(e) && e.shiftKey && e.key.toUpperCase() === 'Z') {
        e.preventDefault()
        redo()
        return
      }

      // Cmd+Shift+G — Ungroup
      if (isCmdOrCtrl(e) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (selectedIds.length === 1) {
          const el = elements[selectedIds[0]]
          if (el && el.children.length > 0) {
            pushHistory()
            ungroup(selectedIds[0])
          }
        }
        return
      }

      // Cmd+G — Group into frame
      if (isCmdOrCtrl(e) && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (selectedIds.length > 0) {
          pushHistory()
          groupSelection()
        }
        return
      }

      // Cmd+A — Select all
      if (isCmdOrCtrl(e) && e.key === 'a') {
        e.preventDefault()
        if (rootElementIds.length > 0) {
          setSelectedIds([...rootElementIds])
        }
        return
      }

      // Escape — Deselect
      if (e.key === 'Escape') {
        setSelectedIds([])
        return
      }

      // [ — Send backward, ] — Bring forward
      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        if (selectedIds.length === 1) {
          pushHistory()
          if (e.key === ']') bringForward(selectedIds[0])
          else sendBackward(selectedIds[0])
        }
        return
      }

      // Arrow keys — Nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        if (selectedIds.length === 0) return
        const step = e.shiftKey ? 10 : 1
        pushHistory()
        for (const id of selectedIds) {
          const el = elements[id]
          if (!el || el.locked) continue
          switch (e.key) {
            case 'ArrowUp':    updateElement(id, { y: el.y - step }); break
            case 'ArrowDown':  updateElement(id, { y: el.y + step }); break
            case 'ArrowLeft':  updateElement(id, { x: el.x - step }); break
            case 'ArrowRight': updateElement(id, { x: el.x + step }); break
          }
        }
        return
      }

      // Tab / Shift+Tab — cycle through siblings
      if (e.key === 'Tab') {
        e.preventDefault()
        const id = selectedIds[0]
        if (!id) {
          if (rootElementIds.length > 0) setSelectedIds([rootElementIds[0]])
          return
        }
        const el = elements[id]
        const siblings = el?.parentId
          ? elements[el.parentId]?.children ?? []
          : rootElementIds
        const idx = siblings.indexOf(id)
        if (idx < 0) return
        const next = e.shiftKey
          ? siblings[(idx - 1 + siblings.length) % siblings.length]
          : siblings[(idx + 1) % siblings.length]
        if (next) setSelectedIds([next])
        return
      }

      // Ctrl+P — Preview mode
      if (isCmdOrCtrl(e) && e.key === 'p') {
        e.preventDefault()
        const { previewMode, setPreviewMode } = useEditorStore.getState()
        setPreviewMode(!previewMode)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    selectedIds,
    elements,
    rootElementIds,
    deleteElement,
    duplicateElement,
    undo,
    redo,
    setSelectedIds,
    updateElement,
    pushHistory,
    bringForward,
    sendBackward,
    groupSelection,
    ungroup,
  ])
}
