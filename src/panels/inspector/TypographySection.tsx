import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import NumberInput from './NumberInput'
import ColorPicker from './ColorPicker'
import SegmentedControl from './SegmentedControl'

// Popular Google Fonts for the picker
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Raleway', 'Ubuntu', 'Nunito', 'Playfair Display',
  'Merriweather', 'Source Sans Pro', 'PT Sans', 'Noto Sans',
  'Oswald', 'Quicksand', 'DM Sans', 'Space Grotesk', 'Outfit',
  'Plus Jakarta Sans', 'Manrope', 'Sora', 'Figtree', 'Be Vietnam Pro',
]

function loadGoogleFont(family: string) {
  const id = `gfont-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700&display=swap`
  document.head.appendChild(link)
}

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'Ag' },
  { value: 'uppercase', label: 'AG' },
  { value: 'lowercase', label: 'ag' },
  { value: 'capitalize', label: 'Ag.' },
]

const ALIGN_OPTIONS = [
  { value: 'left', label: '≡' },
  { value: 'center', label: '⊟' },
  { value: 'right', label: '≡' },
]

export default function TypographySection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [fontQuery, setFontQuery] = useState('')
  const swatchRef = useRef<HTMLButtonElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const t = el?.text

  const handleTextChange = useCallback(
    (field: string, value: string | number) => {
      if (!el || !t) return
      pushHistory()
      applyChanges(el, { text: { ...t, [field]: value } })
    },
    [el, t, pushHistory, applyChanges]
  )

  const handleFontSelect = useCallback((font: string) => {
    loadGoogleFont(font)
    handleTextChange('fontFamily', font)
    setShowFontMenu(false)
    setFontQuery('')
  }, [handleTextChange])

  useEffect(() => {
    if (showFontMenu) setTimeout(() => fontInputRef.current?.focus(), 50)
  }, [showFontMenu])

  const filteredFonts = fontQuery
    ? GOOGLE_FONTS.filter(f => f.toLowerCase().includes(fontQuery.toLowerCase()))
    : GOOGLE_FONTS

  if (!el || !t) return null

  const currentFont = (t as any).fontFamily || 'Inter'
  const textTransform = (t as any).textTransform || 'none'

  return (
    <div className="flex flex-col gap-2">

      {/* Font family */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowFontMenu(v => !v)}
          style={{
            width: '100%', height: 28, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 8px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
            fontSize: 12, cursor: 'pointer', fontFamily: currentFont,
          }}
        >
          <span style={{ fontFamily: currentFont }}>{currentFont}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>▾</span>
        </button>
        {showFontMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => { setShowFontMenu(false); setFontQuery('') }} />
            <div style={{
              position: 'absolute', top: 32, left: 0, right: 0, zIndex: 300,
              background: 'var(--surface-2)', border: '1px solid var(--panel-border)',
              borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              <input
                ref={fontInputRef}
                value={fontQuery}
                onChange={e => setFontQuery(e.target.value)}
                placeholder="Search fonts…"
                style={{
                  width: '100%', height: 30, background: 'var(--surface-0)', border: 'none',
                  borderBottom: '1px solid var(--panel-border)', outline: 'none',
                  color: 'var(--text-primary)', fontSize: 12, padding: '0 8px', fontFamily: 'inherit',
                }}
              />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filteredFonts.map(font => {
                  loadGoogleFont(font)
                  return (
                    <button
                      key={font}
                      onClick={() => handleFontSelect(font)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 8px', border: 'none', cursor: 'pointer',
                        background: font === currentFont ? 'var(--surface-hover)' : 'transparent',
                        color: font === currentFont ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: 12, fontFamily: font,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = font === currentFont ? 'var(--surface-hover)' : 'transparent')}
                    >
                      {font}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Size + Weight */}
      <div className="grid grid-cols-2 gap-1">
        <NumberInput
          label="Size"
          value={t.fontSize}
          onChange={(v) => handleTextChange('fontSize', v)}
          min={1} max={400} suffix="px"
        />
        <NumberInput
          label="Weight"
          value={t.fontWeight}
          onChange={(v) => handleTextChange('fontWeight', v)}
          min={100} max={900} step={100}
        />
      </div>

      {/* Line height + Letter spacing */}
      <div className="grid grid-cols-2 gap-1">
        <NumberInput
          label="Line H"
          value={t.lineHeight}
          onChange={(v) => handleTextChange('lineHeight', v)}
          min={0.1} max={10} step={0.1}
        />
        <NumberInput
          label="Spacing"
          value={t.letterSpacing}
          onChange={(v) => handleTextChange('letterSpacing', v)}
          min={-10} max={100} step={0.5} suffix="px"
        />
      </div>

      {/* Color + Align */}
      <div className="flex items-center gap-2">
        <button
          ref={swatchRef}
          onClick={() => setShowColorPicker((v) => !v)}
          style={{
            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
            background: t.color, border: '1px solid var(--border)',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <SegmentedControl
            options={ALIGN_OPTIONS}
            value={t.textAlign || 'left'}
            onChange={(v) => handleTextChange('textAlign', v)}
          />
        </div>
      </div>

      {/* Text transform */}
      <SegmentedControl
        options={TEXT_TRANSFORM_OPTIONS}
        value={textTransform}
        onChange={(v) => handleTextChange('textTransform', v)}
      />

      {showColorPicker && swatchRef.current && (
        <ColorPicker
          value={t.color}
          onChange={(c) => handleTextChange('color', c)}
          onClose={() => setShowColorPicker(false)}
          anchorEl={swatchRef.current}
        />
      )}
    </div>
  )
}
