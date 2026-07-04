import { useCallback, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import type { ShadowDef } from '@/store/editorStore'
import NumberInput from './NumberInput'
import ColorPicker from './ColorPicker'

const DEFAULT_SHADOW: ShadowDef = { x: 0, y: 4, blur: 12, spread: 0, color: '#00000040' }

function ShadowColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-sm)',
          background: color,
          border: '1px solid var(--border)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{color}</span>
      {open && ref.current && (
        <ColorPicker
          value={color.startsWith('#') ? color.slice(0, 7) : '#000000'}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorEl={ref.current}
        />
      )}
    </>
  )
}

export default function ShadowSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const shadows = el?.style.boxShadow ?? []

  const writeShadows = useCallback(
    (next: ShadowDef[]) => {
      if (!el) return
      pushHistory()
      applyChanges(el, { style: { ...el.style, boxShadow: next } })
    },
    [el, pushHistory, applyChanges]
  )

  const addShadow = useCallback(() => {
    writeShadows([...shadows, { ...DEFAULT_SHADOW }])
  }, [shadows, writeShadows])

  const updateShadow = useCallback(
    (i: number, changes: Partial<ShadowDef>) => {
      const next = shadows.map((s, idx) => (idx === i ? { ...s, ...changes } : s))
      writeShadows(next)
    },
    [shadows, writeShadows]
  )

  const removeShadow = useCallback(
    (i: number) => {
      writeShadows(shadows.filter((_, idx) => idx !== i))
    },
    [shadows, writeShadows]
  )

  if (selectedIds.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-tertiary)', fontSize: 10 }}>
        Editing {selectedIds.length} layers
      </div>
    )
  }

  if (!el) return null

  return (
    <div className="flex flex-col gap-2">
      {shadows.length === 0 && (
        <button
          onClick={addShadow}
          style={{
            width: '100%', height: 28, borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Plus size={11} /> Add shadow
        </button>
      )}
      {shadows.map((s, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-2"
          style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)' }}
        >
          <div className="grid grid-cols-4 gap-1">
            <NumberInput label="X" value={s.x} onChange={(v) => updateShadow(i, { x: v })} />
            <NumberInput label="Y" value={s.y} onChange={(v) => updateShadow(i, { y: v })} />
            <NumberInput label="Blur" value={s.blur} onChange={(v) => updateShadow(i, { blur: v })} min={0} />
            <NumberInput label="Spread" value={s.spread} onChange={(v) => updateShadow(i, { spread: v })} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Inset</span>
              <button
                onClick={() => updateShadow(i, { inset: !s.inset })}
                style={{
                  width: 28,
                  height: 16,
                  borderRadius: 8,
                  background: s.inset ? 'var(--accent)' : 'var(--surface-3)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background var(--duration-slow)',
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'var(--text-inverse)',
                    position: 'absolute',
                    top: 2,
                    left: s.inset ? 14 : 2,
                    transition: 'left var(--duration-slow)',
                  }}
                />
              </button>
            </div>
            <ShadowColorSwatch color={s.color} onChange={(c) => updateShadow(i, { color: c })} />
            <button
              onClick={() => removeShadow(i)}
              title="Remove shadow"
              style={{
                marginLeft: 'auto',
                width: 24,
                height: 24,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
      {shadows.length > 0 && (
        <button
          onClick={addShadow}
          style={{
            width: '100%', height: 28, borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Plus size={11} /> Add shadow
        </button>
      )}
    </div>
  )
}
