import { useCallback, useRef, useState } from 'react'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import type { BorderDef } from '@/store/editorStore'
import NumberInput from './NumberInput'
import ColorPicker from './ColorPicker'

type BorderSideKey = 'top' | 'right' | 'bottom' | 'left'
const SIDES: BorderSideKey[] = ['top', 'right', 'bottom', 'left']
const SIDE_LABELS: Record<string, string> = { top: 'T', right: 'R', bottom: 'B', left: 'L' }

let borderIdCounter = 0
const genId = () => `b${++borderIdCounter}_${Date.now()}`

const DEFAULT_SIDE = { width: 1, color: 'var(--border)', style: 'solid' as const }

function makeBorderDef(overrides?: Partial<BorderDef>): BorderDef {
  return {
    id: genId(),
    top: { ...DEFAULT_SIDE },
    right: { ...DEFAULT_SIDE },
    bottom: { ...DEFAULT_SIDE },
    left: { ...DEFAULT_SIDE },
    visible: true,
    ...overrides,
  }
}

function isUniform(b: BorderDef): boolean {
  return (
    b.top.width === b.right.width && b.right.width === b.bottom.width && b.bottom.width === b.left.width &&
    b.top.color === b.right.color && b.right.color === b.bottom.color && b.bottom.color === b.left.color &&
    b.top.style === b.right.style && b.right.style === b.bottom.style && b.bottom.style === b.left.style
  )
}

function makeUniform(b: BorderDef): BorderDef {
  const s = b.top
  return { ...b, top: { ...s }, right: { ...s }, bottom: { ...s }, left: { ...s } }
}

function parseLegacyBorder(border: string): { width: number; style: string; color: string } {
  const m = border.match(/^(\d+)(?:px)?\s+(solid|dashed|dotted)?\s*(.*)$/)
  return {
    width: m ? parseInt(m[1]) : 0,
    style: m ? m[2] || 'solid' : 'solid',
    color: m ? m[3] || 'var(--border)' : 'var(--border)',
  }
}

function BorderColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
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
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {color}
      </span>
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

export default function BorderSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const storedBorders = el?.style?.borders
  const hasStoredBorders = storedBorders && storedBorders.length > 0

  let borderList: BorderDef[]
  if (hasStoredBorders) {
    borderList = storedBorders!
  } else {
    const legacyBorder = el?.style?.border
    const legacyWidth = el?.style?.borderWidth
    if (legacyBorder && legacyBorder !== 'none') {
      const p = parseLegacyBorder(legacyBorder)
      if (p.width > 0) {
        borderList = [makeBorderDef({
          top: { width: p.width, color: p.color, style: p.style as BorderDef['top']['style'] },
          right: { width: p.width, color: p.color, style: p.style as BorderDef['top']['style'] },
          bottom: { width: p.width, color: p.color, style: p.style as BorderDef['top']['style'] },
          left: { width: p.width, color: p.color, style: p.style as BorderDef['top']['style'] },
        })]
      } else {
        borderList = []
      }
    } else if (legacyWidth && legacyWidth > 0) {
      const bc = el?.style?.borderColor ?? 'var(--border)'
      const bs = el?.style?.borderStyle ?? 'solid'
      borderList = [makeBorderDef({
        top: { width: legacyWidth, color: bc, style: bs },
        right: { width: legacyWidth, color: bc, style: bs },
        bottom: { width: legacyWidth, color: bc, style: bs },
        left: { width: legacyWidth, color: bc, style: bs },
      })]
    } else {
      borderList = []
    }
  }

  const writeBorders = useCallback(
    (next: BorderDef[]) => {
      if (!el) return
      pushHistory()
      const style = { ...el.style }
      delete style.border
      delete style.borderWidth
      delete style.borderColor
      delete style.borderStyle
      applyChanges(el, { style: { ...style, borders: next } })
    },
    [el, pushHistory, applyChanges]
  )

  const addBorder = useCallback(() => {
    writeBorders([...borderList, makeBorderDef()])
  }, [borderList, writeBorders])

  const updateSide = useCallback(
    (layerIdx: number, side: BorderSideKey, changes: Partial<BorderDef['top']>) => {
      const next = borderList.map((b, idx) => {
        if (idx !== layerIdx) return b
        const updated = { ...b, [side]: { ...b[side], ...changes } }
        if (isUniform(updated)) {
          return makeUniform(updated)
        }
        return updated
      })
      writeBorders(next)
    },
    [borderList, writeBorders]
  )

  const removeBorder = useCallback(
    (i: number) => {
      writeBorders(borderList.filter((_, idx) => idx !== i))
    },
    [borderList, writeBorders]
  )

  const toggleVisible = useCallback(
    (i: number) => {
      const next = borderList.map((b, idx) => (idx === i ? { ...b, visible: !b.visible } : b))
      writeBorders(next)
    },
    [borderList, writeBorders]
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
      {borderList.length === 0 && (
        <button
          onClick={addBorder}
          style={{
            width: '100%', height: 28, borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Plus size={11} /> Add border
        </button>
      )}
      {borderList.map((b, i) => {
        const uniform = isUniform(b)
        return (
          <div
            key={b.id}
            className="flex flex-col gap-2 p-2"
            style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)' }}
          >
            <div className="flex items-center gap-2" style={{ minHeight: 24 }}>
              <button
                onClick={() => toggleVisible(i)}
                title={b.visible ? 'Hide border' : 'Show border'}
                style={{
                  width: 20, height: 20,
                  display: 'grid', placeItems: 'center',
                  background: 'transparent', border: 'none',
                  color: b.visible ? 'var(--text-secondary)' : 'var(--text-muted)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {b.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Border {i + 1}
              </span>
              <button
                onClick={() => removeBorder(i)}
                title="Remove border"
                style={{
                  marginLeft: 'auto',
                  width: 20, height: 20,
                  display: 'grid', placeItems: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
            {uniform ? (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 16, textTransform: 'uppercase', flexShrink: 0 }}>
                  All
                </span>
                <NumberInput
                  label=""
                  value={b.top.width}
                  onChange={(v) => updateSide(i, 'top', { width: v })}
                  min={0}
                  max={20}
                  suffix="px"
                />
                <BorderColorSwatch
                  color={b.top.color}
                  onChange={(c) => updateSide(i, 'top', { color: c })}
                />
                <select
                  value={b.top.style}
                  onChange={(e) => updateSide(i, 'top', { style: e.target.value as BorderDef['top']['style'] })}
                  style={{
                    height: 28, width: 72,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    padding: '0 4px',
                    outline: 'none',
                    flexShrink: 0,
                  }}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            ) : (
              SIDES.map((side) => (
                <div key={side} className="flex items-center gap-2">
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 16, textTransform: 'uppercase', flexShrink: 0 }}>
                    {SIDE_LABELS[side]}
                  </span>
                  <NumberInput
                    label=""
                    value={b[side].width}
                    onChange={(v) => updateSide(i, side, { width: v })}
                    min={0}
                    max={20}
                    suffix="px"
                  />
                  <BorderColorSwatch
                    color={b[side].color}
                    onChange={(c) => updateSide(i, side, { color: c })}
                  />
                  <select
                    value={b[side].style}
                    onChange={(e) => updateSide(i, side, { style: e.target.value as BorderDef['top']['style'] })}
                    style={{
                      height: 28, width: 72,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      padding: '0 4px',
                      outline: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )
      })}
      {borderList.length > 0 && (
        <button
          onClick={addBorder}
          style={{
            width: '100%', height: 28, borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Plus size={11} /> Add border
        </button>
      )}
    </div>
  )
}
