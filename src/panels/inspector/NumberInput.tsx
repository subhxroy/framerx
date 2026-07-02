import { useState, useCallback, useRef, useEffect } from 'react'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
  mixed?: boolean
}

export default function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  mixed = false,
}: Props) {
  const [local, setLocal] = useState(String(value))
  const [focused, setFocused] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const scrubStartX = useRef(0)
  const scrubStartValue = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!focused && !scrubbing) {
      setLocal(String(Math.round(value * 100) / 100))
    }
  }, [value, focused, scrubbing])

  const clamp = (v: number) => {
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    return v
  }

  const handleBlur = useCallback(() => {
    setFocused(false)
    const parsed = parseFloat(local)
    if (isNaN(parsed)) {
      setLocal(String(value))
      return
    }
    const v = clamp(parsed)
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
        const inc = e.shiftKey ? step * 10 : step
        const v = clamp(value + inc)
        onChange(v)
        setLocal(String(v))
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const dec = e.shiftKey ? step * 10 : step
        const v = clamp(value - dec)
        onChange(v)
        setLocal(String(v))
      }
    },
    [value, onChange, min, max, step]
  )

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
      // Per-pixel sensitivity with Figma/Framer-style modifiers:
      //   default        → `step` units per px
      //   Shift          → 10× (coarse)
      //   Cmd/Ctrl       → 0.1× (fine)
      const mult = e.shiftKey ? 10 : e.metaKey || e.ctrlKey ? 0.1 : 1
      const raw = scrubStartValue.current + dx * step * mult
      // Snap fine drags to 0.1 and coarser drags to whole `step` increments.
      const quantum = mult < 1 ? step / 10 : step
      const newVal = clamp(Math.round(raw / quantum) * quantum)
      onChange(newVal)
      setLocal(String(Math.round(newVal * 100) / 100))
    },
    [scrubbing, step, onChange, min, max]
  )

  const handleLabelPointerUp = useCallback(() => {
    setScrubbing(false)
  }, [])

  const displayValue = focused
    ? local
    : mixed
    ? ''
    : value === 0 ? '0' : String(Math.round(value * 100) / 100)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 28,
      background: 'var(--surface-2)',
      border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      transition: 'border-color var(--duration-instant)',
    }}>
      <label
        style={{
          fontSize: 10,
          color: focused ? 'var(--accent)' : 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          userSelect: 'none',
          cursor: 'ew-resize',
          padding: '0 8px',
          flexShrink: 0,
          transition: 'color var(--duration-instant)',
        }}
        onPointerDown={handleLabelPointerDown}
        onPointerMove={handleLabelPointerMove}
        onPointerUp={handleLabelPointerUp}
        title={`${label}: drag to scrub`}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={mixed ? 'Mixed' : undefined}
        onChange={(e) => {
          setLocal(e.target.value)
          setFocused(true)
        }}
        onFocus={() => {
          setLocal(mixed ? '' : String(value))
          setFocused(true)
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          height: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textAlign: 'right',
          padding: suffix ? '0 4px 0 0' : '0 8px 0 0',
          minWidth: 0,
        }}
      />
      {suffix && (
        <span style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          padding: '0 8px 0 0',
          flexShrink: 0,
        }}>
          {suffix}
        </span>
      )}
    </div>
  )
}
