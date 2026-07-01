import { useCallback, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import NumberInput from './NumberInput'
import ColorPicker from './ColorPicker'

export default function BorderSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const swatchRef = useRef<HTMLButtonElement>(null)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const border = el?.style.border || ''
  const match = border.match(/^(\d+)(?:px)?\s+(solid|dashed|dotted)?\s*(.*)$/)
  const borderWidth = match ? parseInt(match[1]) : 0
  const borderStyle = match ? match[2] || 'solid' : 'solid'
  const borderColor = match ? match[3] || 'var(--border)' : 'var(--border)'

  const handleBorderChange = useCallback(
    (width?: number, style?: string, color?: string) => {
      if (!el) return
      pushHistory()
      const w = width ?? borderWidth
      const s = style ?? borderStyle
      const c = color ?? borderColor
      const borderStr = w > 0 ? `${w}px ${s} ${c}` : 'none'
      applyChanges(el, {
        style: { ...el.style, border: borderStr },
      })
    },
    [el, borderWidth, borderStyle, borderColor, pushHistory, applyChanges]
  )

  if (!el) return null

  return (
    <div className="flex flex-col gap-2">
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        Border
      </span>
      <div className="flex items-center gap-2">
        <button
          ref={swatchRef}
          onClick={() => setShowColorPicker((v) => !v)}
          style={{
            width: 20,
            height: 20,
            borderRadius: 'var(--radius-sm)',
            background: borderColor,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <NumberInput
          label=""
          value={borderWidth}
          onChange={(v) => handleBorderChange(v)}
          min={0}
          max={20}
          suffix="px"
        />
        <select
          value={borderStyle}
          onChange={(e) => handleBorderChange(undefined, e.target.value)}
          style={{
            height: 28,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 4px',
            outline: 'none',
            flex: 1,
          }}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      {showColorPicker && swatchRef.current && (
        <ColorPicker
          value={borderColor}
          onChange={(c) => handleBorderChange(undefined, undefined, c)}
          onClose={() => setShowColorPicker(false)}
          anchorEl={swatchRef.current}
        />
      )}
    </div>
  )
}
