import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Element } from '@/store/editorStore'

function applyInstanceChanges(
  el: Element,
  changes: Record<string, any>,
  updateElement: (id: string, changes: Partial<Element>) => void,
  updateInstanceOverride: (id: string, field: string, value: any) => void,
) {
  if (!el.isInstance) {
    updateElement(el.id, changes as any)
    return
  }
  for (const [key, value] of Object.entries(changes)) {
    if (key === 'style' && value && typeof value === 'object') {
      for (const [sk, sv] of Object.entries(value)) {
        updateInstanceOverride(el.id, `style.${sk}`, sv)
      }
    } else if (key === 'text' && value && typeof value === 'object') {
      for (const [tk, tv] of Object.entries(value)) {
        updateInstanceOverride(el.id, `text.${tk}`, tv)
      }
    } else if (key === 'autoLayout' && value && typeof value === 'object') {
      for (const [ak, av] of Object.entries(value)) {
        updateInstanceOverride(el.id, `autoLayout.${ak}`, av)
      }
    } else if (key === 'image' && value && typeof value === 'object') {
      for (const [ik, iv] of Object.entries(value)) {
        updateInstanceOverride(el.id, `image.${ik}`, iv)
      }
    } else if (key === 'sizing' && value && typeof value === 'object') {
      for (const [sk, sv] of Object.entries(value)) {
        updateInstanceOverride(el.id, `sizing.${sk}`, sv)
      }
    } else if (key === 'breakpoints') {
      // Instances inherit breakpoints from the master; skip
    } else if (key === 'interactions') {
      updateInstanceOverride(el.id, key, value)
    } else if (key === 'cmsBinding') {
      updateInstanceOverride(el.id, key, value)
    } else {
      updateInstanceOverride(el.id, key, value)
    }
  }
}

export function useInstanceUpdate() {
  const hasInstance = useRef(false)
  const updateElement = useEditorStore((s) => s.updateElement)
  const updateInstanceOverride = useEditorStore((s) => s.updateInstanceOverride)

  const updater = useCallback(
    (el: Element | null | undefined, changes: Record<string, any>) => {
      if (!el) return
      hasInstance.current = el.isInstance ?? false
      applyInstanceChanges(el, changes, updateElement, updateInstanceOverride)
    },
    [updateElement, updateInstanceOverride]
  )

  return updater
}
