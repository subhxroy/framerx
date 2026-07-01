import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import NumberInput from './NumberInput'

// corner order: [topLeft, topRight, bottomRight, bottomLeft]
const CORNERS = ['TL', 'TR', 'BR', 'BL'] as const

export default function BorderRadiusSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const uniform = el?.style.borderRadius ?? 0
  const corners: [number, number, number, number] =
    el?.style.borderRadiusCorners ?? [uniform, uniform, uniform, uniform]
  const isPerCorner = !!el?.style.borderRadiusCorners

  const setUniform = useCallback(
    (value: number) => {
      if (!el) return
      pushHistory()
      applyChanges(el, {
        style: { ...el.style, borderRadius: value, borderRadiusCorners: undefined },
      })
    },
    [el, pushHistory, applyChanges]
  )

  const setCorner = useCallback(
    (index: number, value: number) => {
      if (!el) return
      pushHistory()
      const next = [...corners] as [number, number, number, number]
      next[index] = value
      applyChanges(el, {
        style: { ...el.style, borderRadiusCorners: next },
      })
    },
    [el, corners, pushHistory, applyChanges]
  )

  const togglePerCorner = useCallback(() => {
    if (!el) return
    pushHistory()
    if (isPerCorner) {
      // collapse back to uniform using the topLeft value
      applyChanges(el, {
        style: { ...el.style, borderRadius: corners[0], borderRadiusCorners: undefined },
      })
    } else {
      applyChanges(el, {
        style: { ...el.style, borderRadiusCorners: [uniform, uniform, uniform, uniform] },
      })
    }
  }, [el, isPerCorner, corners, uniform, pushHistory, applyChanges])

  if (!el) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          Border Radius
        </span>
        <button
          onClick={togglePerCorner}
          title={isPerCorner ? 'Use single radius' : 'Set each corner'}
          style={{
            fontSize: 'var(--text-xs)',
            color: isPerCorner ? 'var(--accent)' : 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isPerCorner ? 'Single' : 'Corners'}
        </button>
      </div>

      {isPerCorner ? (
        <div className="grid grid-cols-4 gap-1">
          {CORNERS.map((label, i) => (
            <NumberInput
              key={label}
              label={label}
              value={corners[i]}
              onChange={(v) => setCorner(i, v)}
              suffix="px"
              min={0}
            />
          ))}
        </div>
      ) : (
        <NumberInput label="Radius" value={uniform} onChange={setUniform} suffix="px" min={0} />
      )}
    </div>
  )
}
