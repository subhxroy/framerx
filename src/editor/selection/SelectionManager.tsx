import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Moveable from 'react-moveable'
import Selecto from 'selecto'
import { useEditorStore } from '@/store/editorStore'
import type { OnSelectEnd } from 'selecto'
import SmartGuides from './SmartGuides'
import AlignmentBar from './AlignmentBar'
import { findContainerAt } from '@/lib/hitTest'
import { getAbsolutePos } from '@/lib/coords'
import { THRESHOLD, SPRING, DURATION, EASE, TRANSITION } from '@/lib/motionTokens'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

// Maps a Moveable resize direction ([x, y] each in {-1,0,1}) to the matching
// directional cursor, so we can pin it to the body during a fast resize where
// the pointer overshoots the handle. Corners → diagonal, edges → straight.
function resizeCursorFor(direction: number[]): string {
  const [x, y] = direction
  if (x !== 0 && y !== 0) return x === y ? 'nwse-resize' : 'nesw-resize'
  if (x !== 0) return 'ew-resize'
  if (y !== 0) return 'ns-resize'
  return 'default'
}

export default function SelectionManager({ containerRef }: Props) {
  const elements = useEditorStore((s) => s.elements)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const editingId = useEditorStore((s) => s.editingId)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)
  const updateElement = useEditorStore((s) => s.updateElement)
  const updateElements = useEditorStore((s) => s.updateElements)
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
  const altCloneMap = useRef<Record<string, string>>({})
  const updateElementRef = useRef(updateElement)
  updateElementRef.current = updateElement
  const updateElementsRef = useRef(updateElements)
  updateElementsRef.current = updateElements
  const moveElementRef = useRef(moveElement)
  moveElementRef.current = moveElement
  // Deferred state: accumulate during interaction, commit on *End — avoids
  // calling store actions (and thus React re-renders) on every mousemove.
  const dragEndPos = useRef<Record<string, { x: number; y: number }>>({})
  const resizeEndState = useRef<Record<string, { width: number; height: number; x?: number; y?: number }>>({})
  const rotateEndState = useRef<Record<string, number>>({})
  const selectoRef = useRef<Selecto | null>(null)
  const selectoContainerRef = useRef<HTMLDivElement>(null)
  // During a drag the pointer routinely outruns the element and leaves its
  // hover area, so the 'grabbing' cursor must be forced on the body, not the
  // element. Restored on end. Tracks whether the element actually moved so a
  // click that never crosses THRESHOLD.dragStart doesn't push a history entry.
  const dragMoved = useRef(false)
  // Pointer-down origin for the drag-start threshold: onDrag is ignored until
  // the pointer moves THRESHOLD.dragStart px, so a plain click (or micro
  // hand-jitter during it) never shifts the element even 1px.
  const dragOrigin = useRef<{ x: number; y: number } | null>(null)
  const moveableRef = useRef<any>(null)

  useEffect(() => {
    if (moveableRef.current) {
      try {
        moveableRef.current.updateRect()
      } catch (err) {
        console.warn('Moveable updateRect failed', err)
      }
    }
  }, [canvas.x, canvas.y, canvas.scale, elements, selectedIds])

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
      selectByClick: false,
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
        const allEls = useEditorStore.getState().elements
        const unlocked = ids.filter((id) => !allEls[id]?.locked)
        setSelectedIds(unlocked)
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

  // Selection GLIDE: when the selected id(s) change, briefly enable the
  // transition on the Moveable box (via body.mv-gliding) so it slides to the
  // new element instead of teleporting, then remove the class so the box
  // tracks live drags/resizes with zero lag. Keyed on the selection identity.
  const selKey = selectedIds.join(',')
  useEffect(() => {
    if (!selKey) return
    document.body.classList.add('mv-gliding')
    // Window slightly outlasts the CSS glide (DURATION.base) so the class
    // isn't stripped mid-transition, then clears so live drags never lag.
    const t = window.setTimeout(() => document.body.classList.remove('mv-gliding'), DURATION.base * 1000 + 40)
    return () => {
      window.clearTimeout(t)
      document.body.classList.remove('mv-gliding')
    }
  }, [selKey])

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
        !target.closest('.selecto-selection') &&
        !target.closest('[data-selecto-overlay]')
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
        data-selecto-overlay
        style={{ pointerEvents: 'auto', zIndex: 5 }}
      />

      <SmartGuides
        draggingId={draggingId}
        canvasTransform={canvas}
        containerRef={containerRef}
      />

      {targets.length > 0 && (
        <Moveable
          ref={moveableRef}
          target={targets}
          container={containerRef.current ?? undefined}
          draggable={true}
          resizable={true}
          rotatable={true}
          snappable={true}
          snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          snapTarget={snapTargets || undefined}
          snapGridWidth={4}
          snapGridHeight={4}
          snapCenter={true}
          isDisplaySnapDigit={true}
          isDisplayInnerSnapDigit={true}
          snapDigit={0}
          horizontalGuidelines={[]}
          verticalGuidelines={[]}
          snapThreshold={THRESHOLD.snapDistance}
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
          onDragStart={(e: any) => {
            const t = e.target as HTMLElement
            const id = t.getAttribute('data-element-id')
            if (id) {
              const el = useEditorStore.getState().elements[id]
              if (el?.locked) {
                e.stop?.()
                return
              }
              if (altHeld.current) {
                const store = useEditorStore.getState()
                if (store.elements[id]) {
                  store.pushHistory()
                  store.duplicateElement(id)
                  const newId = useEditorStore.getState().selectedIds[0]
                  if (newId) {
                    store.updateElement(newId, { x: el.x, y: el.y })
                    altCloneMap.current = { [id]: newId }
                    draggedIdRef.current = newId
                    dropTargetRef.current = null
                    dragMoved.current = false
                    document.body.classList.remove('mv-gliding')
                    document.body.style.cursor = 'grabbing'
                    setDraggingId(newId)
                    return
                  }
                }
              }
            }
            draggedIdRef.current = id
            dropTargetRef.current = null
            dragMoved.current = false
            dragOrigin.current = { x: e.clientX, y: e.clientY }
            document.body.classList.remove('mv-gliding')
            document.body.style.cursor = 'grabbing'
            if (id) setDraggingId(id)
          }}
          onDrag={({ target: t, left, top, clientX, clientY, transform }) => {
            const rawId = (t as HTMLElement).getAttribute('data-element-id')
            const id = altCloneMap.current[rawId || ''] || rawId
            if (!id) return
            // Drag-start threshold: ignore movement until the pointer travels
            // THRESHOLD.dragStart px from mousedown — a genuine click causes
            // zero position shift.
            if (!dragMoved.current) {
              const o = dragOrigin.current
              if (o && Math.hypot(clientX - o.x, clientY - o.y) < THRESHOLD.dragStart) return
              // Undo checkpoint on the first real movement only, so a bare
              // click never leaves a spurious history entry.
              dragMoved.current = true
              pushHistory()
            }
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

            // Live movement: mutate the DOM node directly during the drag —
            // zero store updates / React renders per mousemove. The final
            // position is committed to the store once, in onDragEnd.
            ;(t as HTMLElement).style.transform = transform
            dragEndPos.current[id] = { x: left, y: top }
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
            document.body.style.cursor = ''
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
              dragEndPos.current = {}
              altCloneMap.current = {}
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
              dragEndPos.current = {}
              altCloneMap.current = {}
              return
            }

            // Plain drag: commit all accumulated positions in ONE batched
            // store update (multi-select = one render, not N).
            const batch: Record<string, { x: number; y: number }> = {}
            for (const [rawId, pos] of Object.entries(dragEndPos.current)) {
              const id = altCloneMap.current[rawId] || rawId
              batch[id] = { x: pos.x, y: pos.y }
            }
            if (Object.keys(batch).length) updateElementsRef.current(batch)
            dragEndPos.current = {}
            altCloneMap.current = {}
          }}
          onDragGroupStart={() => {
            dragMoved.current = false
            document.body.classList.remove('mv-gliding')
            document.body.style.cursor = 'grabbing'
          }}
          onDragGroup={({ events }) => {
            // Multi-select drag: direct-DOM move for every selected node,
            // accumulate final positions, commit ONE batched update on end.
            if (!dragMoved.current) {
              dragMoved.current = true
              pushHistory()
            }
            for (const ev of events) {
              const id = (ev.target as HTMLElement).getAttribute('data-element-id')
              if (!id) continue
              ;(ev.target as HTMLElement).style.transform = ev.transform
              dragEndPos.current[id] = { x: ev.left, y: ev.top }
            }
          }}
          onDragGroupEnd={() => {
            document.body.style.cursor = ''
            const batch: Record<string, { x: number; y: number }> = {}
            for (const [id, pos] of Object.entries(dragEndPos.current)) {
              batch[id] = { x: pos.x, y: pos.y }
            }
            if (Object.keys(batch).length) updateElementsRef.current(batch)
            dragEndPos.current = {}
          }}
          onResizeStart={(e: any) => {
            const t = e.target as HTMLElement
            const id = t.getAttribute('data-element-id')
            if (id) {
              const el = useEditorStore.getState().elements[id]
              if (el?.locked) {
                e.stop?.()
                return
              }
            }
            pushHistory()
            resizeEndState.current = {}
            const direction = e.direction
            const el = id ? elements[id] : null
            resizeStartCenter.current = el
              ? { x: el.x + el.width / 2, y: el.y + el.height / 2 }
              : null
            document.body.classList.remove('mv-gliding')
            // Force the directional cursor onto the body so it holds even as the
            // pointer overshoots the handle during a fast resize.
            document.body.style.cursor = resizeCursorFor(direction)
          }}
          onResize={({ target: t, width, height, delta, direction, drag }) => {
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
            // Live feedback: mutate the DOM directly, store commit happens
            // once in onResizeEnd. Flow (auto-layout) children are position:
            // relative — never translate them, only size.
            const node = t as HTMLElement
            const inFlow = !!(el.parentId && elements[el.parentId]?.autoLayout?.enabled)
            node.style.width = `${width}px`
            node.style.height = `${height}px`
            if (!inFlow) {
              if (changes.x !== undefined || changes.y !== undefined) {
                node.style.transform = `translate(${changes.x ?? el.x}px, ${changes.y ?? el.y}px) rotate(${el.rotation}deg)`
              } else if (drag?.transform) {
                node.style.transform = drag.transform
              }
            }
            resizeEndState.current[id] = changes
            const r = (t as HTMLElement).getBoundingClientRect()
            setDimLabel({ x: r.left + r.width / 2, y: r.bottom + 8 / canvas.scale, text: `${Math.round(width)} × ${Math.round(height)}` })
          }}
          onResizeEnd={() => {
            setDimLabel(null)
            resizeStartCenter.current = null
            document.body.style.cursor = ''
            if (Object.keys(resizeEndState.current).length) {
              updateElementsRef.current(resizeEndState.current)
            }
            resizeEndState.current = {}
          }}
          onRotateStart={(e: any) => {
            const t = e.target as HTMLElement
            const id = t.getAttribute('data-element-id')
            if (id) {
              const el = useEditorStore.getState().elements[id]
              if (el?.locked) {
                e.stop?.()
                return
              }
            }
            pushHistory(); rotateEndState.current = {}; document.body.style.cursor = 'grabbing'
          }}
          onRotate={({ target: t, rotation }) => {
            const id = (t as HTMLElement).getAttribute('data-element-id')
            if (id) {
              const el = elements[id]
              // Live feedback: direct DOM rotation; store commit on end.
              // Flow children carry rotate-only transforms (no translate).
              if (el) {
                const inFlow = !!(el.parentId && elements[el.parentId]?.autoLayout?.enabled)
                ;(t as HTMLElement).style.transform = inFlow
                  ? `rotate(${rotation}deg)`
                  : `translate(${el.x}px, ${el.y}px) rotate(${rotation}deg)`
              }
              rotateEndState.current[id] = rotation
              const r = (t as HTMLElement).getBoundingClientRect()
              setDimLabel({ x: r.left + r.width / 2, y: r.bottom + 8 / canvas.scale, text: `${Math.round(rotation)}°` })
            }
          }}
          onRotateEnd={() => {
            setDimLabel(null)
            document.body.style.cursor = ''
            const rotBatch: Record<string, { rotation: number }> = {}
            for (const [id, rotation] of Object.entries(rotateEndState.current)) {
              rotBatch[id] = { rotation }
            }
            if (Object.keys(rotBatch).length) updateElementsRef.current(rotBatch)
            rotateEndState.current = {}
          }}
          controlPadding={0}
          controlWidth={8}
          controlHeight={8}
        />
      )}

      <AnimatePresence>
        {alignBarPos && selectedIds.length >= 2 && (
          <motion.div
            key="align-bar"
            className="fixed pointer-events-auto"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING.chrome}
            style={{
              left: alignBarPos.x,
              top: Math.max(8, alignBarPos.y),
              transform: 'translateX(-50%)',
              zIndex: 300,
            }}
          >
            <AlignmentBar />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dropTargetId && (() => {
          const node = document.querySelector(`[data-element-id="${dropTargetId}"]`)
          if (!node) return null
          const r = node.getBoundingClientRect()
          return (
            <motion.div
              key="drop-target"
              className="fixed pointer-events-none z-[240]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={TRANSITION.enter}
              style={{
                left: r.left,
                top: r.top,
                width: r.width,
                height: r.height,
                border: '2px solid var(--accent)',
                borderRadius: 4,
                boxShadow: 'inset 0 0 0 9999px var(--accent-dim)',
              }}
            />
          )
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {insertionLine && (
          <motion.div
            key="insertion-line"
            className="fixed pointer-events-none z-[250]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.instant, ease: EASE.standard }}
            style={{
              left: insertionLine.x,
              top: insertionLine.y,
              width: insertionLine.w,
              height: insertionLine.h,
              background: 'var(--accent)',
              borderRadius: 1,
              boxShadow: '0 0 4px var(--accent-border)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dimLabel && (
          <motion.div
            key="dim-label"
            className="fixed pointer-events-none z-[200]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.fast, ease: EASE.standard }}
            style={{
              left: dimLabel.x,
              top: dimLabel.y,
              transform: 'translateX(-50%)',
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
