import { useState, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import ColorPicker from './ColorPicker'
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'

interface FillDef {
  id: string
  type: 'solid' | 'linear-gradient' | 'radial-gradient' | 'image'
  color: string
  opacity: number
  visible: boolean
  stops?: { color: string; position: number }[]
  angle?: number
  imageSrc?: string
  imageFit?: 'cover' | 'contain' | 'fill'
  blendMode?: string
}

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
] as const

const FITS = ['cover', 'contain', 'fill'] as const

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex
  return `rgba(${r},${g},${b},${alpha})`
}

function fillToCSS(fill: FillDef): string {
  if (!fill.visible) return 'transparent'

  if (fill.type === 'solid') {
    if (fill.opacity < 100) return hexToRgba(fill.color, fill.opacity / 100)
    return fill.color
  }

  if (fill.type === 'image') {
    if (!fill.imageSrc) return 'transparent'
    return `url(${fill.imageSrc}) center / ${fill.imageFit ?? 'cover'} no-repeat`
  }

  const stops = fill.stops ?? [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 },
  ]
  const stopStr = stops.map((s) => {
    const color = fill.opacity < 100 ? hexToRgba(s.color, fill.opacity / 100) : s.color
    return `${color} ${s.position}%`
  }).join(', ')

  if (fill.type === 'linear-gradient') {
    return `linear-gradient(${fill.angle ?? 135}deg, ${stopStr})`
  }
  return `radial-gradient(ellipse at center, ${stopStr})`
}

function fillsToBackground(fills: FillDef[]): string {
  const visible = fills.filter((f) => f.visible)
  if (visible.length === 0) return 'transparent'
  return visible.map(fillToCSS).join(', ')
}

function parseLegacyColor(bg?: string): FillDef[] {
  if (!bg || bg === 'transparent') return []
  return [{ id: generateId(), type: 'solid', color: bg, opacity: 100, visible: true, blendMode: 'normal' }]
}

export default function FillSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const [openPickerIdx, setOpenPickerIdx] = useState<number | null>(null)
  const [openStop, setOpenStop] = useState<{ f: number; s: number } | null>(null)
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])
  const stopRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const saveFills = useCallback(
    (next: FillDef[]) => {
      if (!el) return
      pushHistory()
      const bg = fillsToBackground(next)
      const visible = next.filter((f) => f.visible)
      const hasBlend = visible.some((f) => f.blendMode && f.blendMode !== 'normal')
      const blendModes = hasBlend ? visible.map((f) => f.blendMode ?? 'normal').join(', ') : undefined
      applyChanges(el, {
        style: {
          ...el.style,
          fills: next,
          backgroundColor: bg,
          ...(blendModes ? { backgroundBlendMode: blendModes } : {}),
        } as any,
      })
    },
    [el, pushHistory, applyChanges]
  )

  if (selectedIds.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-tertiary)', fontSize: 10 }}>
        Editing {selectedIds.length} layers
      </div>
    )
  }

  if (!el) return null

  const fills: FillDef[] = (el.style as any).fills
    ? (el.style as any).fills
    : parseLegacyColor(el.style.backgroundColor)

  const addFill = () => {
    const newFill: FillDef = {
      id: generateId(), type: 'solid', color: '#ffffff',
      opacity: 100, visible: true, blendMode: 'normal',
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
    saveFills(
      fills.map((f, i) => {
        if (i !== idx) return f
        if (type === 'image') {
          return { ...f, type, imageSrc: f.imageSrc ?? '', imageFit: f.imageFit ?? 'cover', stops: undefined, angle: undefined } as FillDef
        }
        if (type === 'solid') {
          return { ...f, type, stops: undefined, angle: undefined, imageSrc: undefined, imageFit: undefined } as FillDef
        }
        const updated: FillDef = { ...f, type, imageSrc: undefined, imageFit: undefined }
        if (!updated.stops) {
          updated.stops = [{ color: f.color, position: 0 }, { color: '#764ba2', position: 100 }]
          updated.angle = 135
        }
        return updated
      })
    )
  }

  const setFillColor = (idx: number, color: string) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, color } : f))
  }

  const setOpacity = (idx: number, opacity: number) => {
    const o = Math.max(0, Math.min(100, Math.round(opacity)))
    saveFills(fills.map((f, i) => i === idx ? { ...f, opacity: o } : f))
  }

  const setImageSrc = (idx: number, imageSrc: string) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, imageSrc } : f))
  }

  const setImageFit = (idx: number, imageFit: FillDef['imageFit']) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, imageFit } : f))
  }

  const setBlendMode = (idx: number, blendMode: string) => {
    saveFills(fills.map((f, i) => i === idx ? { ...f, blendMode } : f))
  }

  // --- Gradient stop editing ---
  const updateStops = (fillIdx: number, stops: { color: string; position: number }[]) => {
    saveFills(fills.map((f, i) => i === fillIdx ? { ...f, stops } : f))
  }
  const setStopColor = (fi: number, si: number, color: string) => {
    const f = fills[fi]; if (!f.stops) return
    updateStops(fi, f.stops.map((s, i) => i === si ? { ...s, color } : s))
  }
  const setStopPosition = (fi: number, si: number, position: number) => {
    const f = fills[fi]; if (!f.stops) return
    const p = Math.max(0, Math.min(100, Math.round(position)))
    updateStops(fi, f.stops.map((s, i) => i === si ? { ...s, position: p } : s))
  }
  const addStop = (fi: number) => {
    const f = fills[fi]; const stops = f.stops ?? []
    const last = stops[stops.length - 1]
    updateStops(fi, [...stops, { color: last?.color ?? '#ffffff', position: 100 }])
  }
  const removeStop = (fi: number, si: number) => {
    const f = fills[fi]; if (!f.stops || f.stops.length <= 2) return
    updateStops(fi, f.stops.filter((_, i) => i !== si))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fills.map((fill, idx) => (
        <div key={fill.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Main row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Drag handle */}
            <GripVertical size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />

            {/* Visibility */}
            <button
              onClick={() => toggleVisible(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: fill.visible ? 'var(--text-secondary)' : 'var(--text-muted)' }}
            >
              {fill.visible ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>

            {/* Color swatch */}
            <button
              ref={el => { swatchRefs.current[idx] = el }}
              onClick={() => setOpenPickerIdx(openPickerIdx === idx ? null : idx)}
              style={{
                width: 22, height: 22, flexShrink: 0, borderRadius: 4,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: fill.type === 'image'
                  ? fill.imageSrc ? `url(${fill.imageSrc}) center / cover no-repeat` : 'var(--surface-2)'
                  : fillToCSS(fill),
              }}
            />

            {/* Opacity slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={fill.opacity}
              onChange={e => setOpacity(idx, Number(e.target.value))}
              style={{ width: 36, height: 2, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={fill.opacity}
              onChange={e => setOpacity(idx, Number(e.target.value))}
              style={{
                width: 24, height: 22, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 10, textAlign: 'center',
                padding: 0, outline: 'none',
              }}
            />

            {/* Type selector */}
            <select
              value={fill.type}
              onChange={e => setFillType(idx, e.target.value as FillDef['type'])}
              style={{
                flex: 1, height: 22, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 10, padding: '0 2px',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="solid">Solid</option>
              <option value="linear-gradient">Linear</option>
              <option value="radial-gradient">Radial</option>
              <option value="image">Image</option>
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
                  width: 32, height: 22, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: 10, padding: '0 2px',
                  outline: 'none', textAlign: 'center',
                }}
              />
            )}

            {/* Blend mode */}
            <select
              value={fill.blendMode ?? 'normal'}
              onChange={e => setBlendMode(idx, e.target.value)}
              style={{
                width: 50, height: 22, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: 9, padding: '0 2px',
                outline: 'none', cursor: 'pointer',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {BLEND_MODES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Delete */}
            <button
              onClick={() => removeFill(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Image URL section */}
          {fill.type === 'image' && (
            <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                value={fill.imageSrc ?? ''}
                onChange={e => setImageSrc(idx, e.target.value)}
                placeholder="Image URL"
                style={{
                  height: 22, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: 10, padding: '0 6px',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {FITS.map(fit => {
                  const active = (fill.imageFit ?? 'cover') === fit
                  return (
                    <button
                      key={fit}
                      onClick={() => setImageFit(idx, fit)}
                      style={{
                        flex: 1, height: 22, borderRadius: 'var(--radius-sm)',
                        textTransform: 'capitalize',
                        background: active ? 'var(--accent-bg)' : 'transparent',
                        border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: 10,
                      }}
                    >
                      {fit}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Gradient stop editor */}
          {(() => {
            if (fill.type === 'solid' || fill.type === 'image' || !fill.stops) return null
            const stops = fill.stops
            return (
              <div style={{ paddingLeft: 4 }}>
                <div style={{
                  height: 16, borderRadius: 4, marginBottom: 8,
                  background: fillToCSS({ ...fill, angle: 90 }),
                  border: '1px solid var(--border)',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {stops.map((stop, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        ref={node => { stopRefs.current[`${idx}-${si}`] = node }}
                        onClick={() => setOpenStop(
                          openStop && openStop.f === idx && openStop.s === si ? null : { f: idx, s: si }
                        )}
                        style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: '1px solid var(--border)', cursor: 'pointer',
                          background: stop.color,
                        }}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={stop.position}
                        onChange={e => setStopPosition(idx, si, Number(e.target.value))}
                        style={{
                          width: 48, height: 22, background: 'var(--surface-2)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)', fontSize: 11, padding: '0 4px',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>%</span>
                      <button
                        onClick={() => removeStop(idx, si)}
                        disabled={stops.length <= 2}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none', padding: 0,
                          display: 'flex',
                          color: stops.length <= 2 ? 'var(--text-disabled)' : 'var(--text-tertiary)',
                          cursor: stops.length <= 2 ? 'default' : 'pointer',
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                      {openStop && openStop.f === idx && openStop.s === si && stopRefs.current[`${idx}-${si}`] && (
                        <ColorPicker
                          value={stop.color}
                          onChange={color => setStopColor(idx, si, color)}
                          onClose={() => setOpenStop(null)}
                          anchorEl={stopRefs.current[`${idx}-${si}`]!}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addStop(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      height: 22, marginTop: 2, background: 'transparent',
                      border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer',
                    }}
                  >
                    <Plus size={10} /> Add stop
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Color picker popup for main swatch */}
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

      {/* Add fill button — always visible */}
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
    </div>
  )
}
