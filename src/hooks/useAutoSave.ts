import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

export function useAutoSave(projectId: string | undefined): SaveStatus {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<SaveStatus>('saved')

  const doSave = useCallback(async () => {
    if (!projectId) return
    setStatus('saving')
    const s = useEditorStore.getState()
    await useProjectStore.getState().saveProjectData(projectId, {
      elements: JSON.parse(JSON.stringify(s.elements)),
      rootElementIds: s.rootElementIds,
      canvas: { ...s.canvas },
    })
    await useProjectStore.getState().updateProject(projectId, { updatedAt: Date.now() })
    setTimeout(() => setStatus('saved'), 600)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return

    const unsub = useEditorStore.subscribe((state, prev) => {
      if (
        state.elements === prev.elements &&
        state.rootElementIds === prev.rootElementIds &&
        state.canvas === prev.canvas
      ) {
        return
      }

      setStatus('unsaved')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(doSave, 2000)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [projectId, doSave])

  // Ctrl/Cmd+S force save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (timerRef.current) clearTimeout(timerRef.current)
        doSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doSave])

  return status
}
