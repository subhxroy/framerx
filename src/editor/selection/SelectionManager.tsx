import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import Moveable from 'react-moveable'
import Selecto from 'selecto'
import { useEditorStore } from '@/store/editorStore'
import type { OnSelectEnd } from 'selecto'
import SmartGuides from './SmartGuides'
import AlignmentBar from './AlignmentBar'
import { findContainerAt } from '@/lib/hitTest'
import { getAbsolutePos } from '@/lib/coords'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function SelectionManager({ containerRef }: Props) {
  const elements = useEditorStore((s) => s.elements)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const editingId = useEditorStore((s) => s.editingId)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)
  const updateElement = useEditorStore((s) => s.updateElement)
  const moveElement = useEditorStore((s) => s.moveElement)
  const reorderChild = useEditorStore((s) => s.reorderChild)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const canvas = useEditorStore((s) => s.canvas)

  const [targets, setTargets] = useState<HTMLElement[]>([])
  const [dimLabel, setDimLabel] = useState<{ x: number; y: number; text: string } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [alignBarPos, setAlignBarPos] = useState<{ x: number; y: number } | null>(null)
  const [shiftHeld, setShiftHeld] = useState(false)
  const altHeld = useRef(false)
  const resizeStartCenter = useRef<{ x: number; y: number } | null>(null)
  const [insertionLine, setInsertionLine] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const reorderTarget = useRef<{ parentId: string; childId: string; beforeId: string | null } | null>(null)
  // Drag-to-nest: the frame currently hovered as a reparent target.
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const dropTargetRef = useRef<string | null>(null)
  const draggedIdRef = useRef<string | null>(null)
  const updateElementRef = useRef(updateElement)
  updateElementRef.current = updateElement
  const selectoRef = useRef<Selecto | null>(null)
  const selectoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true)
      if (e.altKey) altHeld.current = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false)
      if (e.key === 'Alt' || !e.altKey) altHeld.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const snapTargets = useMemo(() => {
    const ids: string[] = []
    function walk(id: string) {
      ids.push(id)
      const el = elements[id]
      if (el) for (const cid of el.children || []) walk(cid)
    }
    for (const rid of rootElementIds) walk(rid)
    return ids.map((id) => `[data-element-id="${id}"]`).join(', ')
  }, [elements, rootElementIds])

  useEffect(() => {
    if (!selectoContainerRef.current || !containerRef.current) return

    const selecto = new Selecto({
      container: containerRef.current,
      dragContainer: selectoContainerRef.current,
      selectableTargets: ['[data-element-id]'],
      hitRate: 0,
      selectByClick: true,
      selectFromInside: false,
      toggleContinueSelect: ['shift'],
      ratio: 0,
    })

    // Suppress marquee selection while a draw tool is active (or in preview) —
    // otherwise Selecto fights the canvas rubber-band draw and clears the
    // freshly-created element's selection on pointer-up.
    selecto.on('dragStart', (e) => {
      const store = useEditorStore.getState()
      if (store.activeTool !== 'select' || store.previewMode) {
        e.stop()
      }
    })

    selecto.on('selectEnd', (e: OnSelectEnd) => {
      const ids: string[] = []
      for (const el of e.selected) {
        const id = el.getAttribute('data-element-id')
        if (id) ids.push(id)
      }
      if (e.isDragStart) return
      if (ids.length > 0 || !e.isClick) {
        setSelectedIds(ids)
      }
    })

    selectoRef.current = selecto

    return () => {
      selecto.destroy()
    }
  }, [containerRef, setSelectedIds])

  useEffect(() => {
    if (editingId) {
      setTargets([])
      return
    }
    const els: HTMLElement[] = []
    for (const id of selectedIds) {
      const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement | null
      if (el) els.push(el)
    }
    setTargets(els)
  }, [selectedIds, elements, editingId])

  useEffect(() => {
    if (selectoRef.current) {
      selectoRef.current.setSelectedTargets(targets)
    }
  }, [targets])

  useEffect(() => {
    if (selectedIds.length < 2 || targets.length < 2) {
      setAlignBarPos(null)
      return
    }
    const rects = targets.map(t => t.getBoundingClientRect())
    const minX = Math.min(...rects.map(r => r.left))
    const minY = Math.min(...rects.map(r => r.top))
    const maxX = Math.max(...rects.map(r => r.right))
    setAlignBarPos({ x: (minX + maxX) / 2, y: minY - 44 })
  }, [selectedIds, targets, elements])

  const handleClickCanvas = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        target.closest &&
        !target.closest('[data-element-id]') &&
        !target.closest('.moveable-control-box') &&
        !target.closest('.selecto-selection')
      ) {
        if (containerRef.current && containerRef.current.contains(target)) {
          setSelectedIds([])
        }
      }
    },
    [setSelectedIds, containerRef]
  )

  useEffect(() => {
    document.addEventListener('click', handleClickCanvas)
    return () => document.removeEventListener('click', handleClickCanvas)
  }, [handleClickCanvas])

  return (
    <>
      <div
        ref={selectoContainerRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'auto', zIndex: 5 }}
      />

      <SmartGuides
        draggingId={draggingId}
        canvasTransform={canvas}
        containerRef={containerRef}
      />

      {targets.length > 0 && (
        <Moveable
          target={targets}
          container={containerRef.current ?? undefined}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          snapTarget={snapTargets || undefined}
          snapGridWidth={10}
          snapGridHeight={10}
          snapCenter={true}
          isDisplaySnapDigit={true}
          isDisplayInnerSnapDigit={true}
          snapDigit={0}
          horizontalGuidelines={[]}
          verticalGuidelines={[]}
          snapThreshold={5}
          keepRatio={shiftHeld}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          edge={false}
          zoom={1 / canvas.scale}
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          useResizeObserver={true}
          onDragStart={({ target: t }) => {
            pushHistory()
            const id = (t as HTMLElement).getAttribute('data-element-id')
            draggedIdRef.current = id
            dropTargetRef.current = null
            if (id) setDraggingId(id)
          }}
          onDrag={({ target: t, left, top, clientX, clientY }) => {
            const id = (t as HTMLElement).getAttribute('data-element-id')
            if (!id) return
            const el = elements[id]
            if (!el) return
            const parent = el.parentId ? elements[el.parentId] : null

            if (parent?.autoLayout?.enabled) {
              const horizontal = parent.autoLayout.direction === 'horizontal'
              const siblingIds = parent.children.filter((c) => c !== id)
              let beforeId: string | null = null
              let line: { x: number; y: number; w: number; h: number } | null = null
              const pointer = horizontal ? clientX : clientY
              for (const sid of siblingIds) {
                const node = document.querySelector(`[data-element-id="${sid}"]`)
                if (!node) continue
                const r = node.getBoundingClientRect()
                const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2
                if (pointer < mid) {
                  beforeId = sid
                  line = horizontal
                    ? { x: r.left - 1, y: r.top, w: 2, h: r.height }
                    : { x: r.left, y: r.top - 1, w: r.width, h: 2 }
                  break
                }
              }
              if (!beforeId) {
                const lastId = siblingIds[siblingIds.length - 1]
                const node = lastId ? document.querySelector(`[data-element-id="${lastId}"]`) : null
                if (node) {
                  const r = node.getBoundingClientRect()
                  line = horizontal
                    ? { x: r.right - 1, y: r.top, w: 2, h: r.height }
                    : { x: r.left, y: r.bottom - 1, w: r.width, h: 2 }
                }
              }
              reorderTarget.current = { parentId: parent.id, childId: id, beforeId }
              setInsertionLine(line)
              return
            }

            moveElement(id, left, top)
            const r = (t as HTMLElement).getBoundingClientRect()
            setDimLabel({ x: r.left + r.width / 2, y: r.bottom + 8 / canvas.scale, text: `${Math.round(el.width)} × ${Math.round(el.height)}` })

            // Drag-to-nest: highlight the frame under the cursor if it would
            // become a new parent (only for single-element drags).
            if (targets.length === 1) {
              const container = findContainerAt(clientX, clientY, elements, id)
              const next = container && container !== (el.parentId ?? null) ? container : null
              dropTargetRef.current = next
              setDropTargetId(next)
            }
          }}
          onDragEnd={() => {
            setDimLabel(null)
            setDraggingId(null)
            const draggedId = draggedIdRef.current
            const newParentId = dropTargetRef.current
            draggedIdRef.current = null
            dropTargetRef.current = null
            setDropTargetId(null)

            if (reorderTarget.current) {
              const { parentId, childId, beforeId } = reorderTarget.current
              reorderChild(parentId, childId, beforeId)
              reorderTarget.current = null
              setInsertionLine(null)
              return
            }

            // Drag-to-nest: reparent into the hovered frame, converting the
            // element's absolute canvas position into the new parent's space so
            // it stays visually put.
            if (draggedId && newParentId) {
              const all = useEditorStore.getState().elements
              const el = all[draggedId]
              const parent = all[newParentId]
              if (el && parent && newParentId !== el.parentId) {
                const childAbs = getAbsolutePos(draggedId, all)
                const parentAbs = getAbsolutePos(newParentId, all)
                updateElementRef.current(draggedId, {
                  parentId: newParentId,
                  x: childAbs.x - parentAbs.x,
                  y: childAbs.y - parentAbs.y,
                })
              }
            }
          }}
          onResizeStart={({ target: t }) => {
            pushHistory()
            const id = (t as HTMLElement).getAttribute('data-element-id')
            const el = id ? elements[id] : null
            resizeStartCenter.current = el
              ? { x: el.x + el.width / 2, y: el.y + el.height / 2 }
              : null
          }}
          onResize={({ target: t, width, height, delta, direction }) => {
            const id = (t as HTMLElement).getAttribute('data-element-id')
            if (!id) return
            const el = elements[id]
            if (!el) return
            const changes: { width: number; height: number; x?: number; y?: number } = { width, height }
            if (altHeld.current && resizeStartCenter.current) {
              changes.x = resizeStartCenter.current.x - width / 2
              changes.y = resizeStartCenter.current.y - height / 2
            } else {
              if (delta[0]) changes.x = el.x + (direction[0] < 0 ? el.width - width : 0)
              if (delta[1]) changes.y = el.y + (direction[1] < 0 ? el.height - height : 0)
            }
            updateElement(id, changes)
            const r = (t as HTMLElement).getBoundingClientRect()
            setDimLabel({ x: r.left + r.width / 2, y: r.bottom + 8 / canvas.scale, text: `${Math.round(width)} × ${Math.round(height)}` })
          }}
          onResizeEnd={() => { setDimLabel(null); resizeStartCenter.current = null }}
          onRotateStart={() => pushHistory()}
          onRotate={({ target: t, rotation }) => {
            const id = (t as HTMLElement).getAttribute('data-element-id')
            if (id) {
              updateElement(id, { rotation })
              const r = (t as HTMLElement).getBoundingClientRect()
              setDimLabel({ x: r.left + r.width / 2, y: r.bottom + 8 / canvas.scale, text: `${Math.round(rotation)}°` })
            }
          }}
          onRotateEnd={() => setDimLabel(null)}
          controlPadding={0}
          controlWidth={8}
          controlHeight={8}
        />
      )}

      {alignBarPos && selectedIds.length >= 2 && (
        <div
          className="fixed pointer-events-auto"
          style={{
            left: alignBarPos.x,
            top: Math.max(8, alignBarPos.y),
            transform: 'translateX(-50%)',
            zIndex: 300,
          }}
        >
          <AlignmentBar />
        </div>
      )}

      {dropTargetId && (() => {
        const node = document.querySelector(`[data-element-id="${dropTargetId}"]`)
        if (!node) return null
        const r = node.getBoundingClientRect()
        return (
          <div
            className="fixed pointer-events-none z-[240]"
            style={{
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
              border: '2px solid var(--accent)',
              borderRadius: 4,
              boxShadow: 'inset 0 0 0 9999px rgba(0,153,255,0.06)',
            }}
          />
        )
      })()}

      {insertionLine && (
        <div
          className="fixed pointer-events-none z-[250]"
          style={{
            left: insertionLine.x,
            top: insertionLine.y,
            width: insertionLine.w,
            height: insertionLine.h,
            background: 'var(--accent)',
            borderRadius: 1,
            boxShadow: '0 0 4px rgba(0,153,255,0.6)',
          }}
        />
      )}

      {dimLabel && (
        <div
          className="fixed pointer-events-none z-[200]"
          style={{
            left: dimLabel.x,
            top: dimLabel.y,
            transform: 'translateX(-50%)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.01em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {dimLabel.text}
        </div>
      )}
    </>
  )
}
