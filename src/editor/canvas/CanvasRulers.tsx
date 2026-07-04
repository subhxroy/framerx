import { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useUIStore } from '@/store/uiStore'

function tickInterval(scale: number): number {
  if (scale <= 0) return 50
  const target = 70 / scale
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
  for (const n of nice) {
    if (target <= n) return n
  }
  return nice[nice.length - 1]
}

const R = 24

const colors = {
  bg: '#1c1c1c',
  tick: '#555555',
  label: '#8a8a8a',
  border: '#2a2a2a',
}

interface Props {
  width: number
  height: number
}

export default function CanvasRulers({ width, height }: Props) {
  const hRef = useRef<HTMLCanvasElement>(null)
  const vRef = useRef<HTMLCanvasElement>(null)
  const { x, y, scale } = useEditorStore(s => s.canvas)
  const dpr = window.devicePixelRatio || 1
  const guides = useUIStore(s => s.guides)
  const addGuide = useUIStore(s => s.addGuide)

  const [draggingGuide, setDraggingGuide] = useState<{ axis: 'h' | 'v'; pos: number } | null>(null)
  const dragGuideRef = useRef<{ axis: 'h' | 'v'; pos: number } | null>(null)

  const screenToCanvas = useCallback((clientX: number, clientY: number, axis: 'h' | 'v'): number => {
    if (axis === 'h') {
      const rect = hRef.current?.getBoundingClientRect()
      if (!rect) return 0
      return (clientX - rect.left - x) / scale
    }
    const rect = vRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return (clientY - rect.top - y) / scale
  }, [x, y, scale])

  const handleMouseDown = useCallback((e: React.MouseEvent, axis: 'h' | 'v') => {
    e.preventDefault()
    const p = screenToCanvas(e.clientX, e.clientY, axis)
    const snapped = Math.round(p / 4) * 4
    dragGuideRef.current = { axis, pos: snapped }
    setDraggingGuide(dragGuideRef.current)

    const onMouseMove = (e: MouseEvent) => {
      const p = screenToCanvas(e.clientX, e.clientY, axis)
      const snapped = Math.round(p / 4) * 4
      dragGuideRef.current = { axis, pos: snapped }
      setDraggingGuide(dragGuideRef.current)
    }

    const onMouseUp = () => {
      const state = dragGuideRef.current
      if (state) {
        addGuide({ type: state.axis === 'h' ? 'horizontal' : 'vertical', position: state.pos })
      }
      dragGuideRef.current = null
      setDraggingGuide(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [screenToCanvas, addGuide])

  useEffect(() => {
    const hc = hRef.current
    const vc = vRef.current
    if (!hc || !vc) return

    const hw = Math.max(0, width - R)
    const vh = Math.max(0, height - R)

    // ── Horizontal ruler ──
    hc.width = hw * dpr
    hc.height = R * dpr
    hc.style.width = `${hw}px`
    hc.style.height = `${R}px`

    const hctx = hc.getContext('2d')
    if (!hctx) return
    hctx.scale(dpr, dpr)
    hctx.clearRect(0, 0, hw, R)

    hctx.fillStyle = colors.bg
    hctx.fillRect(0, 0, hw, R)
    hctx.fillStyle = colors.border
    hctx.fillRect(0, R - 1, hw, 1)

    const interval = tickInterval(scale)
    const sub = interval / 5
    const start = Math.floor((-x) / (scale * interval)) * interval - interval
    const end = Math.ceil((hw - x) / (scale * interval)) * interval + interval

    hctx.strokeStyle = colors.tick
    hctx.lineWidth = 0.5
    hctx.fillStyle = colors.label
    hctx.font = `9px Inter, -apple-system, sans-serif`
    hctx.textAlign = 'center'
    hctx.textBaseline = 'top'

    for (let v = start; v <= end; v += sub) {
      const sx = x + v * scale
      if (sx < 0 || sx > hw) continue
      const isSub = Math.abs(v % interval) > 0.001
      const tickLen = isSub ? 4 : 10
      hctx.beginPath()
      hctx.moveTo(sx, 0)
      hctx.lineTo(sx, tickLen)
      hctx.stroke()
      if (!isSub) {
        hctx.fillText(String(v), sx, tickLen + 3)
      }
    }

    // ── Vertical ruler ──
    vc.width = R * dpr
    vc.height = vh * dpr
    vc.style.width = `${R}px`
    vc.style.height = `${vh}px`

    const vctx = vc.getContext('2d')
    if (!vctx) return
    vctx.scale(dpr, dpr)
    vctx.clearRect(0, 0, R, vh)

    vctx.fillStyle = colors.bg
    vctx.fillRect(0, 0, R, vh)
    vctx.fillStyle = colors.border
    vctx.fillRect(R - 1, 0, 1, vh)

    const vStart = Math.floor((-y) / (scale * interval)) * interval - interval
    const vEnd = Math.ceil((vh - y) / (scale * interval)) * interval + interval

    vctx.strokeStyle = colors.tick
    vctx.lineWidth = 0.5
    vctx.fillStyle = colors.label
    vctx.font = `9px Inter, -apple-system, sans-serif`
    vctx.textAlign = 'right'
    vctx.textBaseline = 'middle'

    for (let v = vStart; v <= vEnd; v += sub) {
      const sy = y + v * scale
      if (sy < 0 || sy > vh) continue
      const isSub = Math.abs(v % interval) > 0.001
      const tickLen = isSub ? 4 : 10
      vctx.beginPath()
      vctx.moveTo(0, sy)
      vctx.lineTo(tickLen, sy)
      vctx.stroke()
      if (!isSub) {
        vctx.fillText(String(v), tickLen + 3, sy)
      }
    }
  }, [width, height, x, y, scale, dpr])

  return (
    <>
      <canvas
        ref={hRef}
        style={{ position: 'absolute', top: 0, left: R, zIndex: 30 }}
        onMouseDown={(e) => handleMouseDown(e, 'h')}
      />
      <canvas
        ref={vRef}
        style={{ position: 'absolute', top: R, left: 0, zIndex: 30 }}
        onMouseDown={(e) => handleMouseDown(e, 'v')}
      />
      <div style={{
        position: 'absolute', top: 0, left: 0, zIndex: 30,
        width: R, height: R,
        background: colors.bg,
        borderRight: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
      }} />

      {/* Cursor indicator on horizontal ruler */}
      {draggingGuide?.axis === 'h' && (
        <div style={{
          position: 'absolute',
          top: R - 6,
          left: R + x + draggingGuide.pos * scale - 4,
          zIndex: 31,
          pointerEvents: 'none',
          width: 0, height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '6px solid var(--accent)',
        }} />
      )}

      {/* Cursor indicator on vertical ruler */}
      {draggingGuide?.axis === 'v' && (
        <div style={{
          position: 'absolute',
          top: R + y + draggingGuide.pos * scale - 4,
          left: R - 6,
          zIndex: 31,
          pointerEvents: 'none',
          width: 0, height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: '6px solid var(--accent)',
        }} />
      )}

      {/* Preview guide line during drag */}
      {draggingGuide && (
        <div style={{
          position: 'absolute',
          zIndex: 31,
          pointerEvents: 'none',
          background: 'var(--accent)',
          opacity: 0.5,
          ...(draggingGuide.axis === 'h'
            ? { left: R, top: R + y + draggingGuide.pos * scale, width: width - R, height: 1 }
            : { left: R + x + draggingGuide.pos * scale, top: R, width: 1, height: height - R }),
        }} />
      )}

      {/* Committed guide lines */}
      {guides.map((guide, i) => (
        <div key={i} style={{
          position: 'absolute',
          zIndex: 30,
          pointerEvents: 'none',
          background: 'var(--accent)',
          opacity: 0.3,
          ...(guide.type === 'horizontal'
            ? { left: R, top: R + y + guide.position * scale, width: width - R, height: 1 }
            : { left: R + x + guide.position * scale, top: R, width: 1, height: height - R }),
        }} />
      ))}
    </>
  )
}
