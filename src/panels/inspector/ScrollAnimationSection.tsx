import { useCallback } from 'react'
import { useEditorStore, type ScrollLink } from '@/store/editorStore'

interface Props {
  elementId: string
}

const properties = ['opacity', 'x', 'y', 'scale', 'rotate'] as const
const propertyUnits: Record<string, string> = {
  opacity: '',
  x: 'px',
  y: 'px',
  scale: '',
  rotate: '\u00B0',
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

export default function ScrollAnimationSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const scrollLinks = element?.scrollLinks ?? []

  const addLink = useCallback(() => {
    pushHistory()
    const newLink: ScrollLink = {
      id: `scl_${Date.now()}`,
      property: 'opacity',
      scrollRange: [0, 1],
      valueRange: [0, 1],
    }
    updateElement(elementId, { scrollLinks: [...scrollLinks, newLink] })
  }, [elementId, scrollLinks, pushHistory, updateElement])

  const removeLink = useCallback((linkId: string) => {
    pushHistory()
    updateElement(elementId, {
      scrollLinks: scrollLinks.filter((l) => l.id !== linkId),
    })
  }, [elementId, scrollLinks, pushHistory, updateElement])

  const updateLink = useCallback(
    (linkId: string, patch: Partial<ScrollLink>) => {
      updateElement(elementId, {
        scrollLinks: scrollLinks.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
      })
    },
    [elementId, scrollLinks, updateElement]
  )

  if (!element) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          Scroll Animation
        </span>
        <button
          style={{
            fontSize: '10px',
            color: 'var(--accent)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 500,
            transition: 'color var(--duration-normal)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onClick={addLink}
        >
          + Add
        </button>
      </div>

      {scrollLinks.length === 0 && (
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Map scroll progress through the viewport to visual properties.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {scrollLinks.map((link) => {
          const unit = propertyUnits[link.property] ?? ''
          return (
            <div
              key={link.id}
              className="rounded p-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2 pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <select
                  style={{
                    height: '22px',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    padding: '0 4px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  value={link.property}
                  onChange={(e) => updateLink(link.id, { property: e.target.value as ScrollLink['property'] })}
                >
                  {properties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: '1',
                    padding: 0,
                    transition: 'color var(--duration-normal)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onClick={() => removeLink(link.id)}
                >
                  {'\u00D7'}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span style={{
                  fontSize: '9px',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 500,
                }}>
                  Scroll range (0\u2013100%)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    style={{
                      flex: 1,
                      height: '22px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={Math.round(link.scrollRange[0] * 100)}
                    min={0}
                    max={100}
                    onChange={(e) => {
                      const v = clamp(parseInt(e.target.value) || 0, 0, 100) / 100
                      updateLink(link.id, { scrollRange: [v, link.scrollRange[1]] })
                    }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
                  <input
                    type="number"
                    style={{
                      flex: 1,
                      height: '22px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={Math.round(link.scrollRange[1] * 100)}
                    min={0}
                    max={100}
                    onChange={(e) => {
                      const v = clamp(parseInt(e.target.value) || 100, 0, 100) / 100
                      updateLink(link.id, { scrollRange: [link.scrollRange[0], v] })
                    }}
                  />
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', width: 12, flexShrink: 0 }}>%</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-1.5">
                <span style={{
                  fontSize: '9px',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 500,
                }}>
                  Value range
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    style={{
                      flex: 1,
                      height: '22px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={link.valueRange[0]}
                    step={link.property === 'opacity' || link.property === 'scale' ? 0.05 : 1}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0
                      updateLink(link.id, { valueRange: [v, link.valueRange[1]] })
                    }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
                  <input
                    type="number"
                    style={{
                      flex: 1,
                      height: '22px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={link.valueRange[1]}
                    step={link.property === 'opacity' || link.property === 'scale' ? 0.05 : 1}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0
                      updateLink(link.id, { valueRange: [link.valueRange[0], v] })
                    }}
                  />
                  {unit && (
                    <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', width: 12, flexShrink: 0 }}>{unit}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
