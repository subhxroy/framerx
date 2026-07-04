import { useState, useCallback, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { isOverridden } from '@/lib/breakpointUtils'
import { THRESHOLD } from '@/lib/motionTokens'

interface Props {
  label: string
  value: number
  field: string
  elementId: string
  onChange: (value: number) => void
  onAddOverride: () => void
  onClearOverride: () => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}

export default function RespNumberInput({
  label,
  value,
  field,
  elementId,
  onChange,
  onAddOverride,
  onClearOverride,
  suffix,
  min,
  max,
  step = 1,
}: Props) {
  const [local, setLocal] = useState(String(value))
  const [focused, setFocused] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const scrubStartX = useRef(0)
  const scrubStartValue = useRef(0)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const elements = useEditorStore((s) => s.elements)
  const el = elements[elementId]

  const overridden = el ? isOverridden(el, activeBreakpoint, field) : false
  const isDesktop = activeBreakpoint === 'desktop'

  const handleBlur = useCallback(() => {
    setFocused(false)
    const parsed = parseFloat(local)
    if (isNaN(parsed)) {
      setLocal(String(value))
      return
    }
    let v = parsed
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    setLocal(String(v))
    if (v !== value) onChange(v)
  }, [local, value, onChange, min, max])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        ;(e.target as HTMLInputElement).blur()
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const v = Math.min(max ?? Infinity, value + step)
        if (!isDesktop && !overridden) onAddOverride()
        onChange(v)
        setLocal(String(v))
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const v = Math.max(min ?? -Infinity, value - step)
        if (!isDesktop && !overridden) onAddOverride()
        onChange(v)
        setLocal(String(v))
      }
    },
    [value, onChange, min, max, step, isDesktop, overridden, onAddOverride]
  )

  // Drag-to-scrub on the label — same behavior as NumberInput, with the
  // breakpoint-override side effect applied on the first scrubbed change.
  const handleLabelPointerDown = useCallback(
    (e: React.PointerEvent<HTMLLabelElement>) => {
      e.preventDefault()
      scrubStartX.current = e.clientX
      scrubStartValue.current = value
      setScrubbing(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [value]
  )

  const handleLabelPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLabelElement>) => {
      if (!scrubbing) return
      const dx = e.clientX - scrubStartX.current
      const mult = e.shiftKey
        ? THRESHOLD.scrubMultiplierCoarse
        : e.metaKey || e.ctrlKey
          ? THRESHOLD.scrubMultiplierFine
          : 1
      const raw = scrubStartValue.current + dx * step * mult
      const quantum = mult < 1 ? step / 10 : step
      let v = Math.round(raw / quantum) * quantum
      if (min !== undefined) v = Math.max(min, v)
      if (max !== undefined) v = Math.min(max, v)
      if (!isDesktop && !overridden) onAddOverride()
      onChange(v)
      setLocal(String(Math.round(v * 100) / 100))
    },
    [scrubbing, step, onChange, min, max, isDesktop, overridden, onAddOverride]
  )

  const handleLabelPointerUp = useCallback(() => setScrubbing(false), [])

  const displayValue = focused || scrubbing ? local : (value === 0 ? '0' : String(Math.round(value * 100) / 100))

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            cursor: 'ew-resize',
            userSelect: 'none',
          }}
          onPointerDown={handleLabelPointerDown}
          onPointerMove={handleLabelPointerMove}
          onPointerUp={handleLabelPointerUp}
          title={`${label}: drag to scrub`}
        >
          {label}
        </label>
        {!isDesktop && (
          <button
            onClick={overridden ? onClearOverride : onAddOverride}
            style={{
              background: 'none',
              border: 'none',
              color: overridden ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              padding: 0,
            }}
          >
            {overridden ? '×' : '+'}
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setLocal(e.target.value)
            setFocused(true)
          }}
          onFocus={() => {
            setLocal(String(value))
            setFocused(true)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: 28,
            background: 'var(--surface-2)',
            border: `1px solid ${overridden ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            color: overridden ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 8px',
            outline: 'none',
          }}
        />
        {suffix && (
          <span
            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              fontSize: 'var(--text-xs)',
              color: overridden ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
