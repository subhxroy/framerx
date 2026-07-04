import { useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { THRESHOLD } from '@/lib/motionTokens'

interface Guide {
  type: 'h' | 'v'
  pos: number       // canvas-space px position of the aligned edge/center
  gap?: number      // perpendicular distance (px) to the matched neighbor
  labelPos?: number // perpendicular canvas-space coordinate for the label midpoint
}

interface Props {
  draggingId: string | null
  canvasTransform: { x: number; y: number; scale: number }
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function SmartGuides({ draggingId, canvasTransform, containerRef }: Props) {
  const elements = useEditorStore(s => s.elements)
  const selectedIds = useEditorStore(s => s.selectedIds)

  const guides = useMemo<Guide[]>(() => {
    if (!draggingId) return []
    const dragging = elements[draggingId]
    if (!dragging) return []

    const guides: Guide[] = []
    const SNAP_THRESHOLD = THRESHOLD.snapDistance / canvasTransform.scale

    // Dragging element edges
    const dLeft = dragging.x
    const dRight = dragging.x + dragging.width
    const dTop = dragging.y
    const dBottom = dragging.y + dragging.height
    const dCX = dragging.x + dragging.width / 2
    const dCY = dragging.y + dragging.height / 2

    const otherIds = Object.keys(elements).filter(
      id => !selectedIds.includes(id) && elements[id].visible
    )

    for (const id of otherIds) {
      const el = elements[id]
      const eLeft = el.x
      const eRight = el.x + el.width
      const eTop = el.y
      const eBottom = el.y + el.height
      const eCX = el.x + el.width / 2
      const eCY = el.y + el.height / 2

      // Vertical guide lines (for left/right/center x matches).
      // The distance label measures the perpendicular (Y) gap to the neighbor.
      const vChecks: [number, number][] = [
        [dLeft, eLeft], [dLeft, eRight], [dLeft, eCX],
        [dRight, eLeft], [dRight, eRight], [dRight, eCX],
        [dCX, eLeft], [dCX, eRight], [dCX, eCX],
      ]
      for (const [da, ea] of vChecks) {
        if (Math.abs(da - ea) < SNAP_THRESHOLD) {
          let gap = 0, labelPos = dCY
          if (dTop >= eBottom) { gap = dTop - eBottom; labelPos = (eBottom + dTop) / 2 }
          else if (eTop >= dBottom) { gap = eTop - dBottom; labelPos = (dBottom + eTop) / 2 }
          guides.push({ type: 'v', pos: ea, gap: Math.round(gap), labelPos })
          break
        }
      }

      // Horizontal guide lines. The label measures the perpendicular (X) gap.
      const hChecks: [number, number][] = [
        [dTop, eTop], [dTop, eBottom], [dTop, eCY],
        [dBottom, eTop], [dBottom, eBottom], [dBottom, eCY],
        [dCY, eTop], [dCY, eBottom], [dCY, eCY],
      ]
      for (const [da, ea] of hChecks) {
        if (Math.abs(da - ea) < SNAP_THRESHOLD) {
          let gap = 0, labelPos = dCX
          if (dLeft >= eRight) { gap = dLeft - eRight; labelPos = (eRight + dLeft) / 2 }
          else if (eLeft >= dRight) { gap = eLeft - dRight; labelPos = (dRight + eLeft) / 2 }
          guides.push({ type: 'h', pos: ea, gap: Math.round(gap), labelPos })
          break
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>()
    return guides.filter(g => {
      const key = `${g.type}-${Math.round(g.pos)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [draggingId, elements, selectedIds, canvasTransform.scale])

  if (guides.length === 0) return null

  const rect = containerRef.current?.getBoundingClientRect()
  if (!rect) return null

  // Convert canvas-space position to screen space
  const toScreen = (canvasPos: number, axis: 'x' | 'y') => {
    if (axis === 'x') return canvasPos * canvasTransform.scale + canvasTransform.x
    return canvasPos * canvasTransform.scale + canvasTransform.y
  }

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 50, width: '100%', height: '100%' }}
      >
        {guides.map((g, i) => {
          if (g.type === 'v') {
            const x = toScreen(g.pos, 'x')
            return (
              <line
                key={i}
                x1={x} y1={0} x2={x} y2="100%"
                stroke="var(--guide)"
                strokeWidth="1"
                strokeDasharray="none"
              />
            )
          } else {
            const y = toScreen(g.pos, 'y')
            return (
              <line
                key={i}
                x1={0} y1={y} x2="100%" y2={y}
                stroke="var(--guide)"
                strokeWidth="1"
              />
            )
          }
        })}
      </svg>

      {/* Numeric distance labels between the dragging element and aligned neighbors */}
      {guides.map((g, i) => {
        if (!g.gap || g.gap < 1 || g.labelPos === undefined) return null
        const left = g.type === 'v' ? toScreen(g.pos, 'x') : toScreen(g.labelPos, 'x')
        const top = g.type === 'v' ? toScreen(g.labelPos, 'y') : toScreen(g.pos, 'y')
        return (
          <div
            key={`label-${i}`}
            className="pointer-events-none absolute"
            style={{
              left, top,
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              background: 'var(--guide)',
              color: 'var(--text-inverse)',
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {g.gap}
          </div>
        )
      })}
    </>
  )
}
