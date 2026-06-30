import { useState, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import ColorPicker from './ColorPicker'
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'

interface FillDef {
  id: string
  type: 'solid' | 'linear-gradient' | 'radial-gradient'
  color: string
  opacity: number
  visible: boolean
  // gradient
  stops?: { color: string; position: number }[]
  angle?: number
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function fillToCSS(fill: FillDef): string {
  if (!fill.visible) return 'transparent'
  if (fill.type === 'solid') return fill.color
  if (fill.type === 'linear-gradient') {
    const stops = fill.stops ?? [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 },
    ]
    const stopStr = stops.map(s => `${s.color} ${s.position}%`).join(', ')
    return `linear-gradient(${fill.angle ?? 135}deg, ${stopStr})`
  }
  if (fill.type === 'radial-gradient') {
    const stops = fill.stops ?? [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 },
    ]
    const stopStr = stops.map(s => `${s.color} ${s.position}%`).join(', ')
    return `radial-gradient(ellipse at center, ${stopStr})`
  }
  return fill.color
}

function fillsToBackground(fills: FillDef[]): string {
  const visible = fills.filter(f => f.visible)
  if (visible.length === 0) return 'transparent'
  return visible.map(fillToCSS).join(', ')
}

function parseLegacyColor(bg?: string): FillDef[] {
  if (!bg || bg === 'transparent') return []
  return [{ id: generateId(), type: 'solid', color: bg, opacity: 100, visible: true }]
}

export default function FillSection() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const updateElement = useEditorStore(s => s.updateElement)
  const pushHistory = useEditorStore(s => s.pushHistory)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const [openPickerIdx, setOpenPickerIdx] = useState<number | null>(null)
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])

  const saveFills = useCallback((next: FillDef[]) => {
    if (!el) return
    pushHistory()
    // Compute CSS background from fills
    const bg = fillsToBackground(next)
    updateElement(el.id, {
      style: {
        ...el.style,
        fills: next,
        backgroundColor: bg,  // keep backwards compat
      } as any,
    })
  }, [el, pushHistory, updateElement])

  if (!el) return null

  // Support both legacy backgroundColor string and new fills array
  const fills: FillDef[] = (el.style as any).fills
    ? (el.style as any).fills
    : parseLegacyColor(el.style.backgroundColor)

  const addFill = () => {
    const newFill: FillDef = {
      id: generateId(), type: 'solid', color: '#ffffff',
      opacity: 100, visible: true,
    }
    saveFills([...fills, newFill])
  }

  const removeFill = (idx: number) => {
    saveFills(fills.filter((_, i) => i !== idx))
  }

  const toggleVisible = (idx: number) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, visible: !f.visible } : f))
  }

  const setFillType = (idx: number, type: FillDef['type']) => {
    saveFills(fills.map((f, i) => {
      if (i !== idx) return f
      const updated: FillDef = { ...f, type }
      if (type !== 'solid' && !updated.stops) {
        updated.stops = [{ color: f.color, position: 0 }, { color: '#764ba2', position: 100 }]
        updated.angle = 135
      }
      return updated
    }))
  }

  const setFillColor = (idx: number, color: string) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, color } : f))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
          Fill
        </span>
        <button
          onClick={addFill}
          title="Add fill"
          style={{
            width: 18, height: 18, borderRadius: 3, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Fill layers */}
      {fills.length === 0 && (
        <button
          onClick={addFill}
          style={{
            width: '100%', height: 28, borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Plus size={11} /> Add fill
        </button>
      )}

      {fills.map((fill, idx) => (
        <div key={fill.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Drag handle */}
          <GripVertical size={10} style={{ color: '#444', flexShrink: 0, cursor: 'grab' }} />

          {/* Visibility */}
          <button
            onClick={() => toggleVisible(idx)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: fill.visible ? 'var(--text-secondary)' : '#444' }}
          >
            {fill.visible ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>

          {/* Color swatch */}
          <button
            ref={el => { swatchRefs.current[idx] = el }}
            onClick={() => setOpenPickerIdx(openPickerIdx === idx ? null : idx)}
            style={{
              width: 22, height: 22, flexShrink: 0, borderRadius: 3,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: fill.type === 'solid' ? fill.color : fillToCSS(fill),
            }}
          />

          {/* Type selector */}
          <select
            value={fill.type}
            onChange={e => setFillType(idx, e.target.value as FillDef['type'])}
            style={{
              flex: 1, height: 26, background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)', fontSize: 11, padding: '0 4px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="solid">Solid</option>
            <option value="linear-gradient">Linear Gradient</option>
            <option value="radial-gradient">Radial Gradient</option>
          </select>

          {/* Angle input for linear gradient */}
          {fill.type === 'linear-gradient' && (
            <input
              type="number"
              value={fill.angle ?? 135}
              onChange={e => {
                const angle = Number(e.target.value)
                saveFills(fills.map((f, i) => i === idx ? { ...f, angle } : f))
              }}
              style={{
                width: 40, height: 26, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 11, padding: '0 4px',
                outline: 'none',
              }}
            />
          )}

          {/* Delete */}
          <button
            onClick={() => removeFill(idx)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#444' }}
          >
            <Trash2 size={11} />
          </button>

          {/* Color picker */}
          {openPickerIdx === idx && swatchRefs.current[idx] && fill.type === 'solid' && (
            <ColorPicker
              value={fill.color}
              onChange={color => setFillColor(idx, color)}
              onClose={() => setOpenPickerIdx(null)}
              anchorEl={swatchRefs.current[idx]!}
            />
          )}
        </div>
      ))}

      {/* Gradient stop editor */}
      {fills.map((fill) => {
        if (fill.type === 'solid' || !fill.stops) return null
        return (
          <div key={`stops-${fill.id}`} style={{ marginTop: 4 }}>
            <div style={{
              height: 16, borderRadius: 4, margin: '0 4px',
              background: fillToCSS(fill),
              border: '1px solid var(--border)',
            }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {fill.stops.map((stop, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 2,
                    background: stop.color, border: '1px solid var(--border)',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{stop.position}%</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
