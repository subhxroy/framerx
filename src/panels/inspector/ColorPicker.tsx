import { useState, useRef, useCallback, useEffect } from 'react'
import Popover from '@/components/Popover'
import { Droplet } from 'lucide-react'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function hsvToRgb(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
  }
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) }
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60
    else if (max === gg) h = ((bb - rr) / d + 2) * 60
    else h = ((rr - gg) / d + 4) * 60
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

interface Props {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  anchorEl: HTMLElement
}

export default function ColorPicker({ value, onChange, onClose, anchorEl }: Props) {
  // Positioning, enter/exit animation, and outside-click/Escape dismissal are
  // all handled by the shared <Popover> wrapper below.
  const rgb = hexToRgb(value || '#ffffff')
  const initialHsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const [hue, setHue] = useState(initialHsv.h)
  const [sat, setSat] = useState(initialHsv.s)
  const [val, setVal] = useState(initialHsv.v)
  const [hexInput, setHexInput] = useState((value || '#ffffff').replace('#', ''))
  const satRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef<'sat' | 'hue' | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [picking, setPicking] = useState(false)

  const applyColor = useCallback(
    (h: number, s: number, v: number) => {
      const c = hsvToRgb(h, s, v)
      const hex = rgbToHex(c.r, c.g, c.b)
      setHexInput(hex.replace('#', ''))
      onChange(hex)
    },
    [onChange]
  )

  const drawSat = useCallback(() => {
    const canvas = satRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    const c = hsvToRgb(hue, 1, 1)
    grad.addColorStop(0, '#fff')
    grad.addColorStop(1, rgbToHex(c.r, c.g, c.b))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    const grad2 = ctx.createLinearGradient(0, 0, 0, h)
    grad2.addColorStop(0, 'transparent')
    grad2.addColorStop(1, '#000')
    ctx.fillStyle = grad2
    ctx.fillRect(0, 0, w, h)
    const x = sat * w
    const y = (1 - val) * h
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hue, sat, val])

  const drawHue = useCallback(() => {
    const canvas = hueRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, h = canvas.height
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    for (let i = 0; i <= 360; i += 30) {
      const c = hsvToRgb(i, 1, 1)
      grad.addColorStop(i / 360, rgbToHex(c.r, c.g, c.b))
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    const x = (hue / 360) * w
    ctx.beginPath()
    ctx.arc(x, h / 2, 5, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hue])

  useEffect(() => { drawSat() }, [drawSat])
  useEffect(() => { drawHue() }, [drawHue])

  const handleSatDown = useCallback((e: React.MouseEvent) => {
    dragging.current = 'sat'
    handleSatMove(e)
  }, [])

  const handleSatMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (dragging.current !== 'sat') return
      const canvas = satRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      setSat(x)
      setVal(1 - y)
      applyColor(hue, x, 1 - y)
    },
    [hue, applyColor]
  )

  const handleHueDown = useCallback((e: React.MouseEvent) => {
    dragging.current = 'hue'
    handleHueMove(e)
  }, [])

  const handleHueMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (dragging.current !== 'hue') return
      const canvas = hueRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
      setHue(h)
      applyColor(h, sat, val)
    },
    [sat, val, applyColor]
  )

  useEffect(() => {
    const up = () => { dragging.current = null }
    const move = (e: MouseEvent) => {
      handleSatMove(e)
      handleHueMove(e)
    }
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', move)
    return () => {
      window.removeEventListener('mouseup', up)
      window.removeEventListener('mousemove', move)
    }
  }, [handleSatMove, handleHueMove])

  const handleHexSubmit = useCallback(() => {
    let h = hexInput.replace('#', '')
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      const hex = '#' + h
      const { r, g, b } = hexToRgb(hex)
      const { h: hueVal, s, v } = rgbToHsv(r, g, b)
      setHue(hueVal)
      setSat(s)
      setVal(v)
      onChange(hex)
    } else {
      setHexInput((value || '#ffffff').replace('#', ''))
    }
  }, [hexInput, onChange, value])

  const addRecent = useCallback((hex: string) => {
    setRecent((prev) => {
      const next = [hex, ...prev.filter((c) => c !== hex)].slice(0, 8)
      return next
    })
  }, [])

  useEffect(() => {
    if (value && value !== '#') addRecent(value)
  }, [value, addRecent])

  const pickColor = async () => {
    if (!('EyeDropper' in window)) return
    setPicking(true)
    try {
      const eyeDropper = new (window as any).EyeDropper()
      const result = await eyeDropper.open()
      const hex = result.sRGBHex as string
      const { r, g, b } = hexToRgb(hex)
      const { h, s, v } = rgbToHsv(r, g, b)
      setHue(h); setSat(s); setVal(v)
      setHexInput(hex.replace('#', ''))
      onChange(hex)
    } catch {
      // User cancelled
    } finally {
      setPicking(false)
    }
  }

  const c = hsvToRgb(hue, sat, val)
  const currentHex = rgbToHex(c.r, c.g, c.b)

  return (
    <Popover open anchorEl={anchorEl} onClose={onClose} placement="bottom" align="start">
    <div
      style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-popup)',
        padding: 12,
        width: 220,
      }}
    >
      <canvas
        ref={satRef}
        width={196}
        height={130}
        style={{ width: '100%', height: 130, borderRadius: 'var(--radius-sm)', cursor: 'crosshair' }}
        onMouseDown={handleSatDown}
      />
      <canvas
        ref={hueRef}
        width={196}
        height={12}
        style={{ width: '100%', height: 12, borderRadius: 'var(--radius-sm)', cursor: 'crosshair', marginTop: 8 }}
        onMouseDown={handleHueDown}
      />
      <div className="flex items-center gap-2 mt-2">
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            background: currentHex,
            border: '1px solid var(--border)',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
          maxLength={6}
          style={{
            width: 72,
            height: 24,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 4px',
            outline: 'none',
            textTransform: 'uppercase',
          }}
        />
        <input
          type="number"
          value={Math.round(c.r)}
          onChange={(e) => {
            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
            const hex = rgbToHex(v, c.g, c.b)
            const { h, s, v: vv } = rgbToHsv(v, c.g, c.b)
            setHue(h); setSat(s); setVal(vv)
            onChange(hex)
          }}
          min={0}
          max={255}
          style={{
            width: 36,
            height: 24,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 2px',
            outline: 'none',
            textAlign: 'center',
          }}
        />
        <input
          type="number"
          value={Math.round(c.g)}
          onChange={(e) => {
            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
            const hex = rgbToHex(c.r, v, c.b)
            const { h, s, v: vv } = rgbToHsv(c.r, v, c.b)
            setHue(h); setSat(s); setVal(vv)
            onChange(hex)
          }}
          min={0}
          max={255}
          style={{
            width: 36,
            height: 24,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 2px',
            outline: 'none',
            textAlign: 'center',
          }}
        />
        <input
          type="number"
          value={Math.round(c.b)}
          onChange={(e) => {
            const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
            const hex = rgbToHex(c.r, c.g, v)
            const { h, s, v: vv } = rgbToHsv(c.r, c.g, v)
            setHue(h); setSat(s); setVal(vv)
            onChange(hex)
          }}
          min={0}
          max={255}
          style={{
            width: 36,
            height: 24,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            padding: '0 2px',
            outline: 'none',
            textAlign: 'center',
          }}
        />
        <button
          onClick={pickColor}
          title="Pick color from screen"
          disabled={picking}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: picking ? 'wait' : 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!picking) e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { if (!picking) e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Droplet size={13} />
        </button>
      </div>
      {recent.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {recent.map((hex) => (
            <button
              key={hex}
              onClick={() => {
                const { r, g, b } = hexToRgb(hex)
                const { h, s, v } = rgbToHsv(r, g, b)
                setHue(h); setSat(s); setVal(v)
                onChange(hex)
                setHexInput(hex.replace('#', ''))
              }}
              style={{
                width: 16,
                height: 16,
                borderRadius: 'var(--radius-sm)',
                background: hex,
                border: hex === currentHex ? '2px solid var(--accent)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
    </Popover>
  )
}
