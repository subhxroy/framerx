import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import NumberInput from './NumberInput'

export default function BlurSection() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const pushHistory = useEditorStore(s => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const update = useCallback((field: 'blur' | 'backdropBlur', v: number) => {
    if (!el) return
    pushHistory()
    applyChanges(el, { style: { ...el.style, [field]: v } })
  }, [el, pushHistory, applyChanges])

  if (selectedIds.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-tertiary)', fontSize: 10 }}>
        Editing {selectedIds.length} layers
      </div>
    )
  }

  if (!el) return null

  const blur = el.style.blur ?? 0
  const backdropBlur = el.style.backdropBlur ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <NumberInput
          label="Layer"
          value={blur}
          onChange={v => update('blur', v)}
          min={0}
          max={100}
          suffix="px"
        />
        <NumberInput
          label="Background"
          value={backdropBlur}
          onChange={v => update('backdropBlur', v)}
          min={0}
          max={100}
          suffix="px"
        />
      </div>
      {(blur > 0 || backdropBlur > 0) && (
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: 0 }}>
          {blur > 0 ? `Layer blur: filter: blur(${blur}px)  ` : ''}
          {backdropBlur > 0 ? `BG blur: backdrop-filter: blur(${backdropBlur}px)` : ''}
        </p>
      )}
    </div>
  )
}
