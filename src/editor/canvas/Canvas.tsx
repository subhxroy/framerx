import { useRef, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '@/store/editorStore'
import { useUIStore } from '@/store/uiStore'
import { useCopilotStore } from '@/store/copilotStore'
import { componentDefinitions } from '@/panels/components/ComponentDefinitions'
import { ASSET_DND_TYPE } from '@/panels/assets/AssetsPanel'
import { breakpointWidths } from '@/lib/breakpointUtils'
import { hitTestDeepest, findContainerAt } from '@/lib/hitTest'
import { getAbsolutePos } from '@/lib/coords'
import ElementRenderer from '@/editor/elements/Element'
import SelectionManager from '@/editor/selection/SelectionManager'
import ContextMenu from '@/panels/context/ContextMenu'
import CanvasRulers from './CanvasRulers'
import { ChevronDown, Grid3X3, Ruler, Component } from 'lucide-react'
import { useHoverStore } from '@/store/hoverStore'
import { useOverlayStore } from '@/store/overlayStore'
import { DELAY, DURATION, EASE } from '@/lib/motionTokens'

const MIN_SCALE = 0.02
const MAX_SCALE = 64
const ZOOM_PRESETS = [2, 10, 25, 50, 75, 100, 150, 200, 400, 800, 1600, 3200, 6400]

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function getNextPresetScale(currentScale: number, direction: 1 | -1) {
  const pct = currentScale * 100
  const nextPct = direction > 0
    ? ZOOM_PRESETS.find((preset) => preset > pct + 0.5) ?? ZOOM_PRESETS[ZOOM_PRESETS.length - 1]
    : [...ZOOM_PRESETS].reverse().find((preset) => preset < pct - 0.5) ?? ZOOM_PRESETS[0]
  return nextPct / 100
}

function animateZoom(
  from: { x: number; y: number; scale: number },
  to: { x: number; y: number; scale: number },
  setCanvas: (s: Partial<{ x: number; y: number; scale: number }>) => void,
  duration = 200
) {
  const start = performance.now()
  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration)
    const ease = 1 - Math.pow(1 - t, 3)
    setCanvas({
      x: from.x + (to.x - from.x) * ease,
      y: from.y + (to.y - from.y) * ease,
      scale: from.scale + (to.scale - from.scale) * ease,
    })
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function getAbsoluteRect(id: string, elements: ReturnType<typeof useEditorStore.getState>['elements']) {
  const el = elements[id]
  if (!el) return null
  let x = el.x
  let y = el.y
  let parentId = el.parentId
  const visited = new Set<string>([id])

  while (parentId && elements[parentId] && !visited.has(parentId)) {
    visited.add(parentId)
    const parent = elements[parentId]
    x += parent.x
    y += parent.y
    parentId = parent.parentId
  }

  return { x, y, width: el.width, height: el.height }
}

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const isSpaceDown = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const pendingPan = useRef({ x: 0, y: 0 })
  const panFrame = useRef<number | null>(null)
  // Rubber-band draw session (drawing a new element with a non-select tool)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const drawClient = useRef<{ x: number; y: number } | null>(null)
  const drawRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const canvas = useEditorStore((s) => s.canvas)
  const setCanvas = useEditorStore((s) => s.setCanvas)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const addElement = useEditorStore((s) => s.addElement)
  const addElementTree = useEditorStore((s) => s.addElementTree)
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const previewMode = useEditorStore((s) => s.previewMode)
  const editingComponentId = useEditorStore((s) => s.editingComponentId)
  const elements = useEditorStore((s) => s.elements)
  const openOverlayIds = useOverlayStore((s) => s.openOverlays)
  const copilotOutput = useCopilotStore((s) => s.generatedOutput)
  const discardGeneration = useCopilotStore((s) => s.discardGeneration)

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (screenX - rect.left - canvas.x) / canvas.scale,
        y: (screenY - rect.top - canvas.y) / canvas.scale,
      }
    },
    [canvas]
  )

  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: rect.left + canvas.x + canvasX * canvas.scale,
        y: rect.top + canvas.y + canvasY * canvas.scale,
      }
    },
    [canvas]
  )
  void canvasToScreen

  // Bidirectional hover sync (canvas → Layers). Delegated pointer tracking on
  // the container with hover-intent (DELAY.hoverIntent) so rapid sweeps across
  // dense elements don't thrash the shared store. Runs only outside preview.
  useEffect(() => {
    const el = containerRef.current
    if (!el || useEditorStore.getState().previewMode) return
    let timer: number | null = null
    let pending: string | null = null
    const commit = () => { timer = null; useHoverStore.getState().setHovered(pending, 'canvas') }
    const onOver = (e: PointerEvent) => {
      const node = (e.target as HTMLElement)?.closest?.('[data-element-id]') as HTMLElement | null
      const id = node?.getAttribute('data-element-id') ?? null
      if (id === useHoverStore.getState().hoveredId && pending === id) return
      pending = id
      if (timer !== null) window.clearTimeout(timer)
      if (id) timer = window.setTimeout(commit, DELAY.hoverIntent)
      else useHoverStore.getState().setHovered(null, 'canvas') // leave clears instantly
    }
    const onLeave = () => {
      if (timer !== null) { window.clearTimeout(timer); timer = null }
      pending = null
      useHoverStore.getState().setHovered(null, 'canvas')
    }
    el.addEventListener('pointermove', onOver)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      if (timer !== null) window.clearTimeout(timer)
      el.removeEventListener('pointermove', onOver)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // Reflect Layers → canvas hover: outline the matching element when a layer
  // row is hovered. Toggles a class rather than re-rendering the element tree.
  useEffect(() => {
    if (useEditorStore.getState().previewMode) return
    return useHoverStore.subscribe((state) => {
      const prev = document.querySelector('[data-element-id].layer-hover')
      if (prev) prev.classList.remove('layer-hover')
      if (state.hoveredId && state.source === 'layers') {
        const node = document.querySelector(`[data-element-id="${state.hoveredId}"]`)
        node?.classList.add('layer-hover')
      }
    })
  }, [])

  const schedulePan = useCallback((dx: number, dy: number) => {
    pendingPan.current.x += dx
    pendingPan.current.y += dy

    if (panFrame.current !== null) return
    panFrame.current = window.requestAnimationFrame(() => {
      const delta = pendingPan.current
      pendingPan.current = { x: 0, y: 0 }
      panFrame.current = null
      const c = useEditorStore.getState().canvas
      setCanvas({ x: c.x + delta.x, y: c.y + delta.y })
    })
  }, [setCanvas])

  useEffect(() => {
    return () => {
      if (panFrame.current !== null) window.cancelAnimationFrame(panFrame.current)
    }
  }, [])

  const zoomToScaleAtPoint = useCallback(
    (newScale: number, point: { x: number; y: number }) => {
      const clamped = clampScale(newScale)
      const toX = point.x - (point.x - canvas.x) * (clamped / canvas.scale)
      const toY = point.y - (point.y - canvas.y) * (clamped / canvas.scale)
      animateZoom(
        { x: canvas.x, y: canvas.y, scale: canvas.scale },
        { x: toX, y: toY, scale: clamped },
        setCanvas,
        200
      )
    },
    [canvas.x, canvas.y, canvas.scale, setCanvas]
  )

  const zoomToScaleAtViewportCenter = useCallback(
    (newScale: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      zoomToScaleAtPoint(newScale, { x: cx, y: cy })
    },
    [zoomToScaleAtPoint, containerRef]
  )

  const zoomToFitIds = useCallback((ids: string[]) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const c = useEditorStore.getState().canvas
    const elements = useEditorStore.getState().elements
    const boxes = ids
      .map((id) => getAbsoluteRect(id, elements))
      .filter((box): box is NonNullable<typeof box> => !!box)
    if (boxes.length === 0) {
      animateZoom(
        { x: c.x, y: c.y, scale: c.scale },
        { x: 0, y: 0, scale: 1 },
        setCanvas,
        200
      )
      return
    }

    const minX = Math.min(...boxes.map((box) => box.x))
    const minY = Math.min(...boxes.map((box) => box.y))
    const maxX = Math.max(...boxes.map((box) => box.x + box.width))
    const maxY = Math.max(...boxes.map((box) => box.y + box.height))
    const padding = 80
    const contentW = Math.max(1, maxX - minX)
    const contentH = Math.max(1, maxY - minY)
    const scale = clampScale(Math.min(
      rect.width / (contentW + padding * 2),
      rect.height / (contentH + padding * 2),
      2
    ))

    animateZoom(
      { x: c.x, y: c.y, scale: c.scale },
      { x: rect.width / 2 - (minX + contentW / 2) * scale, y: rect.height / 2 - (minY + contentH / 2) * scale, scale },
      setCanvas,
      200
    )
  }, [setCanvas])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const store = useEditorStore.getState()

      // In preview mode, allow native scrolling — don't intercept.
      if (store.previewMode) return

      e.preventDefault()
      const c = store.canvas

      // Ctrl/Cmd + scroll (or trackpad pinch) = zoom centered on cursor
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.08 : 0.925
        zoomToScaleAtPoint(c.scale * factor, { x: e.clientX, y: e.clientY })
        return
      }

      // Shift + scroll → horizontal pan (swap axes)
      if (e.shiftKey) {
        schedulePan(-e.deltaY, 0)
        return
      }

      // Plain scroll / two-finger trackpad pan
      schedulePan(-e.deltaX, -e.deltaY)
    },
    [schedulePan, zoomToScaleAtPoint]
  )

  useEffect(() => {
    const handleKD = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      if (typing) return
      if (e.code === 'Space') isSpaceDown.current = true
      if (e.code === 'KeyV' && !e.metaKey && !e.ctrlKey) setActiveTool('select')
      if (e.code === 'KeyF' && !e.metaKey && !e.ctrlKey) setActiveTool('frame')
      if (e.code === 'KeyT' && !e.metaKey && !e.ctrlKey) setActiveTool('text')
      if (e.code === 'KeyI' && !e.metaKey && !e.ctrlKey) setActiveTool('image')
      if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) setActiveTool('rect')
      if (e.code === 'KeyO' && !e.metaKey && !e.ctrlKey) setActiveTool('ellipse')
      if (e.code === 'KeyH' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        const current = useEditorStore.getState().activeTool
        setActiveTool(current === 'hand' ? 'select' : 'hand')
      }

      // Escape: go up to parent selection (Framer behaviour).
      if (e.code === 'Escape') {
        e.preventDefault()
        const store = useEditorStore.getState()
        if (store.editingComponentId) { store.setEditingComponent(null); return }
        if (store.editingId) { store.setEditingId(null); return }
        if (store.selectedIds.length === 1) {
          const parentId = store.elements[store.selectedIds[0]]?.parentId
          if (parentId) { store.setSelectedIds([parentId]); return }
        }
        store.setSelectedIds([])
        return
      }

      // Shift+1: zoom to fit all
      if (e.code === 'Digit1' && e.shiftKey) {
        e.preventDefault()
        zoomToFitIds(useEditorStore.getState().rootElementIds)
        return
      }

      // Shift+2: zoom to fit selection
      if (e.code === 'Digit2' && e.shiftKey) {
        e.preventDefault()
        const selectedIds = useEditorStore.getState().selectedIds
        if (selectedIds.length > 0) zoomToFitIds(selectedIds)
        return
      }

      // Ctrl+0: reset to 100%
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        zoomToScaleAtViewportCenter(1)
      }

      // Ctrl++/- zoom
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomToScaleAtViewportCenter(getNextPresetScale(useEditorStore.getState().canvas.scale, 1))
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        zoomToScaleAtViewportCenter(getNextPresetScale(useEditorStore.getState().canvas.scale, -1))
      }
    }
    const handleKU = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = false
    }

    // Cmd/Ctrl + click → deep-select the most nested element under the pointer.
    // Capture phase + stopImmediatePropagation so Selecto's click handler (which
    // would otherwise select the top-most frame) never runs.
    const handleDeepSelect = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.metaKey || e.ctrlKey)) return
      const store = useEditorStore.getState()
      if (store.activeTool !== 'select' || store.previewMode) return
      const target = e.target as HTMLElement
      if (!target.closest?.('[data-element-id]')) return
      const deepest = hitTestDeepest(e.clientX, e.clientY, store.elements)
      if (deepest) {
        e.stopImmediatePropagation()
        e.preventDefault()
        store.setSelectedIds([deepest])
      }
    }

    // Plain left-click → Framer-style hierarchical selection.
    // Priority: if clicking inside an already-selected frame's subtree, select
    // the direct child of that frame at the pointer; otherwise select the
    // root-level ancestor frame that contains the point.
    const handleFramerClick = (e: PointerEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey) return
      const store = useEditorStore.getState()
      if (store.activeTool !== 'select' || store.previewMode) return
      // Skip if clicking on a Moveable handle or Selecto rubber-band overlay
      const target = e.target as HTMLElement
      if (target.closest('.moveable-control-box') || target.closest('[data-selecto-overlay]')) return

      const elements = store.elements
      const allNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]'))

      // Collect all elements whose bounding rect contains the pointer.
      type Hit = { id: string; depth: number }
      const hits: Hit[] = []
      for (const node of allNodes) {
        const id = node.getAttribute('data-element-id')
        if (!id || !elements[id]) continue
        const r = node.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue
        let depth = 0
        let cur: string | null | undefined = elements[id]?.parentId
        const visited = new Set<string>([id])
        while (cur && !visited.has(cur)) {
          visited.add(cur)
          depth++
          cur = elements[cur]?.parentId
        }
        hits.push({ id, depth })
      }

      if (hits.length === 0) {
        // Clicking empty canvas → deselect
        store.setSelectedIds([])
        return
      }

      // Shallowest hit = root frame; deepest = most nested child
      hits.sort((a, b) => a.depth - b.depth)
      const shallowest = hits[0]

      const currentSelected = store.selectedIds

      // Helper: get root-level ancestor of an element
      const getRootAncestor = (id: string): string => {
        const visited = new Set<string>([id])
        let cur = id
        while (elements[cur]?.parentId && elements[elements[cur].parentId!] && !visited.has(elements[cur].parentId!)) {
          const next = elements[cur].parentId!
          visited.add(next)
          cur = next
        }
        return cur
      }

      if (currentSelected.length === 1) {
        const selId = currentSelected[0]
        const selEl = elements[selId]
        if (selEl && (selEl.children?.length ?? 0) > 0) {
          // Check if the pointer is inside the selected element's bounding rect
          const selNode = document.querySelector<HTMLElement>(`[data-element-id="${selId}"]`)
          const selRect = selNode?.getBoundingClientRect()
          const insideSel = selRect
            ? e.clientX >= selRect.left && e.clientX <= selRect.right
              && e.clientY >= selRect.top && e.clientY <= selRect.bottom
            : false

          if (insideSel) {
            // Find the shallowest hit that is a direct child of the selected element
            const directChild = hits.find((h) => elements[h.id]?.parentId === selId)
            if (directChild && directChild.id !== selId) {
              store.setSelectedIds([directChild.id])
              return
            }
            // Clicking on the selected element itself (re-click) — keep selection
            if (hits.some((h) => h.id === selId)) {
              return
            }
          }
        }
      }

      // Nothing selected yet: pick the deepest hit that has a parent (i.e. is
      // inside a frame) so clicking a child element like a navbar selects it
      // directly instead of selecting the root page frame.
      if (currentSelected.length === 0) {
        const nested = [...hits].reverse().find((h) => elements[h.id]?.parentId)
        if (nested) {
          store.setSelectedIds([nested.id])
          return
        }
      }

      // Default: select the root-level ancestor frame that contains the click
      const rootId = getRootAncestor(shallowest.id)

      // If we already have this root selected and there's nothing to drill into
      // at root level, keep the selection (don't flicker)
      if (currentSelected.length === 1 && currentSelected[0] === rootId) {
        return
      }

      store.setSelectedIds([rootId])
    }

    window.addEventListener('keydown', handleKD)
    window.addEventListener('keyup', handleKU)
    const el = containerRef.current
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false })
      el.addEventListener('pointerdown', handleDeepSelect, true)
      el.addEventListener('pointerdown', handleFramerClick, true)
    }
    return () => {
      window.removeEventListener('keydown', handleKD)
      window.removeEventListener('keyup', handleKU)
      if (el) {
        el.removeEventListener('wheel', handleWheel)
        el.removeEventListener('pointerdown', handleDeepSelect, true)
        el.removeEventListener('pointerdown', handleFramerClick, true)
      }
    }
  }, [handleWheel, setActiveTool, zoomToFitIds, zoomToScaleAtViewportCenter])

  // Create an element for the active draw tool at the given canvas rect.
  // `dragged` distinguishes a real rubber-band from a bare click (default size).
  // `parentId` nests the new element inside a frame when drawn over one.
  const createElementFromTool = useCallback(
    (tool: typeof activeTool, x: number, y: number, w: number, h: number, dragged: boolean, parentId: string | null): string | null => {
      const base = { x, y, parentId: parentId ?? null }
      if (tool === 'text') {
        return addElement({
          ...base, type: 'text',
          width: dragged ? Math.max(w, 20) : 200,
          height: dragged ? Math.max(h, 20) : 40,
          name: 'Text',
        })
      }
      if (tool === 'image') {
        return addElement({
          ...base, type: 'image',
          width: dragged ? Math.max(w, 20) : 240,
          height: dragged ? Math.max(h, 20) : 160,
          name: 'Image',
        })
      }
      if (tool === 'rect' || tool === 'ellipse') {
        const size = dragged ? undefined : 120
        return addElement({
          ...base, type: 'shape',
          width: dragged ? Math.max(w, 4) : size!,
          height: dragged ? Math.max(h, 4) : size!,
          name: tool === 'rect' ? 'Rectangle' : 'Ellipse',
          style: {
            borderRadius: tool === 'ellipse' ? 9999 : 0,
            backgroundColor: 'var(--surface-3)',
          },
        })
      }
      if (tool === 'frame') {
        return addElement({
          ...base, type: 'frame',
          width: dragged ? Math.max(w, 4) : 240,
          height: dragged ? Math.max(h, 4) : 200,
          name: 'Frame',
        })
      }
      return null
    },
    [addElement]
  )

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (previewMode) return

      // Hand tool → pan
      if (e.button === 0 && activeTool === 'hand') {
        isPanning.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        return
      }

      if (
        e.button === 1 ||
        (e.button === 0 && isSpaceDown.current)
      ) {
        isPanning.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
        return
      }

      if (
        e.button === 0 &&
        activeTool !== 'select' &&
        isSpaceDown.current === false
      ) {
        // Begin a rubber-band draw. Element is created on pointer-up so the
        // user can drag out the size they want (bare click ⇒ default size).
        // Drawing over a frame is allowed — it nests into that frame.
        const pos = screenToCanvas(e.clientX, e.clientY)
        drawStart.current = { x: pos.x, y: pos.y }
        drawClient.current = { x: e.clientX, y: e.clientY }
        drawRectRef.current = { x: pos.x, y: pos.y, w: 0, h: 0 }
        setDrawPreview({ x: pos.x, y: pos.y, w: 0, h: 0 })
        try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId) } catch { /* noop */ }
        e.preventDefault()
      }
    },
    [activeTool, screenToCanvas, previewMode]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drawStart.current) {
        const start = drawStart.current
        const pos = screenToCanvas(e.clientX, e.clientY)
        const rect = {
          x: Math.min(start.x, pos.x),
          y: Math.min(start.y, pos.y),
          w: Math.abs(pos.x - start.x),
          h: Math.abs(pos.y - start.y),
        }
        drawRectRef.current = rect
        setDrawPreview(rect)
        return
      }
      if (!isPanning.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      schedulePan(dx, dy)
    },
    [schedulePan, screenToCanvas]
  )

  const finishDraw = useCallback(() => {
    const start = drawStart.current
    const rect = drawRectRef.current
    const client = drawClient.current
    drawStart.current = null
    drawClient.current = null
    drawRectRef.current = null
    setDrawPreview(null)
    if (!start || !rect) return

    const store = useEditorStore.getState()
    const tool = store.activeTool
    const dragged = rect.w > 4 || rect.h > 4

    // Nest into the frame under the draw's start point, if any. Text elements
    // don't nest (they're leaf content), matching Framer's draw behaviour.
    let parentId: string | null = null
    let x = rect.x
    let y = rect.y
    if (client && tool !== 'text') {
      const container = findContainerAt(client.x, client.y, store.elements, '')
      if (container) {
        parentId = container
        const parentAbs = getAbsolutePos(container, store.elements)
        x = rect.x - parentAbs.x
        y = rect.y - parentAbs.y
      }
    }

    store.pushHistory()
    const id = createElementFromTool(tool, x, y, rect.w, rect.h, dragged, parentId)
    if (!id) return

    // Auto-select so handles appear + the inspector populates, then revert to
    // Select so the next drag manipulates the new element (Framer/Figma feel).
    store.setSelectedIds([id])
    store.setActiveTool('select')
    // Text drops straight into typing.
    if (tool === 'text') store.setEditingId(id)
  }, [createElementFromTool])

  const [isDragOver, setIsDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (previewMode) return
    e.stopPropagation()
    const store = useEditorStore.getState()
    const elements = store.elements

    // Collect all hits under the pointer (same as single-click handler)
    type Hit = { id: string; depth: number }
    const hits: Hit[] = []
    const allNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-element-id]'))
    for (const node of allNodes) {
      const id = node.getAttribute('data-element-id')
      if (!id || !elements[id]) continue
      const r = node.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue
      let depth = 0
      let cur: string | null | undefined = elements[id]?.parentId
      const visited = new Set<string>([id])
      while (cur && !visited.has(cur)) {
        visited.add(cur)
        depth++
        cur = elements[cur]?.parentId
      }
      hits.push({ id, depth })
    }
    if (hits.length === 0) return
    hits.sort((a, b) => a.depth - b.depth)

    // If double-clicking anywhere in the hit stack that contains a text element,
    // enter edit mode on the text element (deepest text hit wins).
    const textHit = [...hits].reverse().find((h) => elements[h.id]?.type === 'text')
    if (textHit) {
      store.setSelectedIds([textHit.id])
      store.pushHistory()
      store.setEditingId(textHit.id)
      return
    }

    // Framer double-click: if a frame is selected, select the direct child
    // under the pointer that belongs to it. Otherwise select the deepest hit.
    const currentSelected = store.selectedIds
    if (currentSelected.length === 1) {
      const selId = currentSelected[0]
      // Find the direct child of selId that contains the pointer
      const directChild = hits.find((h) => elements[h.id]?.parentId === selId)
      if (directChild) {
        store.setSelectedIds([directChild.id])
        return
      }
    }

    // Fallback: select the deepest hit (most nested element)
    const deepest = hits[hits.length - 1]
    if (deepest) store.setSelectedIds([deepest.id])
  }, [previewMode])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (previewMode) return
    const target = e.target as HTMLElement
    const el = target.closest('[data-element-id]') as HTMLElement | null
    if (el) {
      e.preventDefault()
      const id = el.getAttribute('data-element-id')
      if (id) {
        setContextMenu({ x: e.clientX, y: e.clientY, elementId: id })
      }
    }
  }, [previewMode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const pos = screenToCanvas(e.clientX, e.clientY)

      // 1) File drop (image file from filesystem)
      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((f) => f.type.startsWith('image/'))
      if (imageFile) {
        const reader = new FileReader()
        reader.onload = () => {
          const w = 240
          const h = 160
          const src = reader.result as string
          pushHistory()
          const id = addElement({
            type: 'image',
            name: imageFile.name.replace(/\.[^.]+$/, ''),
            x: pos.x,
            y: pos.y,
            width: w,
            height: h,
            image: { src, objectFit: 'cover' },
          })
          useEditorStore.getState().setSelectedIds([id])
        }
        reader.readAsDataURL(imageFile)
        return
      }

      // 2) Asset drop (image from the Assets panel)
      const assetRaw = e.dataTransfer.getData(ASSET_DND_TYPE)
      if (assetRaw) {
        try {
          const asset = JSON.parse(assetRaw) as { src: string; width?: number; height?: number; name?: string }
          const w = asset.width ? Math.min(asset.width, 400) : 240
          const ratio = asset.width && asset.height ? asset.height / asset.width : 160 / 240
          pushHistory()
          const id = addElement({
            type: 'image',
            name: asset.name || 'Image',
            x: pos.x,
            y: pos.y,
            width: w,
            height: Math.round(w * ratio),
            image: { src: asset.src, objectFit: 'cover' },
          })
          useEditorStore.getState().setSelectedIds([id])
        } catch {
          /* malformed asset payload — ignore */
        }
        return
      }

      // 2) User component (master instance) drop
      const masterCompId = e.dataTransfer.getData('text/x-framer-master')
      if (masterCompId) {
        const store = useEditorStore.getState()
        const masterElId = store.componentMasters[masterCompId]
        if (masterElId) {
          pushHistory()
          const instanceId = store.createInstance(masterCompId, pos.x, pos.y)
          if (instanceId) store.setSelectedIds([instanceId])
        }
        return
      }

      // 3) Component definition drop
      const defId = e.dataTransfer.getData('text/plain')
      if (!defId) return

      const def = componentDefinitions.find((d) => d.id === defId)
      if (!def) return

      const { elements: newElements, rootId } = def.create(pos.x, pos.y)

      pushHistory()

      const newRootId = addElementTree(newElements, rootId)
      useEditorStore.getState().setSelectedIds([newRootId])
    },
    [screenToCanvas, pushHistory, addElement, addElementTree]
  )

  const handlePointerUp = useCallback(() => {
    isPanning.current = false
    if (drawStart.current) finishDraw()
  }, [finishDraw])

  const prevSelectedRef = useRef<string[]>([])

  useEffect(() => {
    if (editingComponentId) {
      prevSelectedRef.current = useEditorStore.getState().selectedIds
    }
  }, [editingComponentId])

  const [showZoom, setShowZoom] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // AI Copilot preview overlay
  const previewRects = (() => {
    if (!copilotOutput || copilotOutput.mode !== 'generate' || !copilotOutput.elements) return null
    type PreviewRect = { x: number; y: number; w: number; h: number; name: string; type: string }
    const rects: PreviewRect[] = []
    const walk = (nodes: Record<string, unknown>[], ox = 0, oy = 0) => {
      for (const node of nodes) {
        const x = ((node.x as number) ?? 0) + ox
        const y = ((node.y as number) ?? 0) + oy
        rects.push({ x, y, w: (node.width as number) ?? 0, h: (node.height as number) ?? 0, name: (node.name as string) ?? '', type: (node.type as string) ?? '' })
        if (Array.isArray(node.children)) walk(node.children, x, y)
      }
    }
    walk(copilotOutput.elements)
    return rects
  })()
  const showGrid = useUIStore(s => s.showGrid)
  const setShowGrid = useUIStore(s => s.setShowGrid)
  const showRuler = useUIStore(s => s.showRuler)
  const setShowRuler = useUIStore(s => s.setShowRuler)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width: Math.round(width), height: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gridSize = 8
  const dotSpacing = gridSize * canvas.scale
  const gridOpacity = canvas.scale < 0.25 ? Math.max(0, canvas.scale / 0.25) * 0.05 : 0.05

  return (
    <div
      ref={containerRef}
      className="relative flex-1"
      style={{
        overflow: previewMode ? 'auto' : 'hidden',
        background: 'var(--canvas-bg)',
        cursor: activeTool === 'hand'
          ? (isPanning.current ? 'grabbing' : 'grab')
          : activeTool !== 'select'
            ? 'crosshair'
            : isPanning.current ? 'grabbing'
            : isSpaceDown.current ? 'grab'
            : 'default',
        outline: isDragOver ? '2px dashed var(--accent)' : 'none',
        outlineOffset: -2,
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      {!previewMode && showGrid && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,${gridOpacity}) 1px, transparent 1px)`,
            backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
            backgroundPosition: `${canvas.x}px ${canvas.y}px`,
          }}
        />
      )}

      <div
        className={previewMode ? '' : 'absolute'}
        style={previewMode ? {
          minHeight: '100%',
        } : {
          transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})`,
          transformOrigin: '0 0',
          ...(activeBreakpoint !== 'desktop'
            ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }
            : {}),
        }}
      >
        {activeBreakpoint !== 'desktop' ? (
          <div style={{
            padding: activeBreakpoint === 'tablet' ? '20px 40px' : '40px 12px',
            background: 'var(--border-subtle)',
            borderRadius: activeBreakpoint === 'tablet' ? 24 : 40,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}>
            {activeBreakpoint === 'mobile' && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ width: 60, height: 6, background: 'var(--surface-2)', borderRadius: 3, display: 'inline-block' }} />
              </div>
            )}
            <div style={{
              borderRadius: activeBreakpoint === 'tablet' ? 8 : 20,
              overflow: 'hidden',
              width: breakpointWidths[activeBreakpoint],
              minHeight: '80vh',
              background: 'var(--canvas-bg)',
            }}>
              {rootElementIds.map((id) => (
                <ElementRenderer key={id} id={id} containerRef={containerRef} />
              ))}
            </div>
            {activeBreakpoint === 'mobile' && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <div style={{ width: 32, height: 4, background: 'var(--surface-3)', borderRadius: 2, display: 'inline-block' }} />
              </div>
            )}
          </div>
        ) : (
          rootElementIds.map((id) => (
            <ElementRenderer key={id} id={id} containerRef={containerRef} />
          ))
        )}

        {drawPreview && (drawPreview.w > 0 || drawPreview.h > 0) && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: drawPreview.x,
              top: drawPreview.y,
              width: drawPreview.w,
              height: drawPreview.h,
              border: `${1 / canvas.scale}px solid var(--accent)`,
              background: 'var(--accent-dim)',
              borderRadius: activeTool === 'ellipse' ? '9999px' : 0,
            }}
          >
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '100%',
                transform: `translate(-50%, ${6 / canvas.scale}px) scale(${1 / canvas.scale})`,
                transformOrigin: 'top center',
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                fontSize: 11,
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(drawPreview.w)} × {Math.round(drawPreview.h)}
            </div>
          </div>
        )}

        {/* AI Copilot preview overlay */}
        {previewRects && previewRects.length > 0 && (
          <div
            className="pointer-events-none absolute"
            style={{
              top: 0, left: 0, right: 0, bottom: 0, zIndex: 9000,
            }}
            onClick={(e) => { e.stopPropagation(); discardGeneration() }}
          >
            {previewRects.map((r, i) => (
              <div
                key={i}
                className="pointer-events-none absolute"
                style={{
                  left: r.x, top: r.y,
                  width: r.w, height: r.h,
                  border: `${1 / Math.max(canvas.scale, 0.01)}px dashed var(--accent)`,
                  background: 'var(--accent-dim)',
                  opacity: 0.65,
                }}
              >
                <span style={{
                  position: 'absolute', top: 0, left: 0,
                  fontSize: 10,
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                  padding: '0 4px', lineHeight: '16px',
                  borderRadius: `0 0 4px 0`,
                  whiteSpace: 'nowrap',
                  transform: `scale(${1 / Math.max(canvas.scale, 0.01)})`,
                  transformOrigin: 'top left',
                }}>
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay rendering */}
      {previewMode && openOverlayIds.map((overlayElId) => {
        const overlayEl = useEditorStore.getState().elements[overlayElId]
        if (!overlayEl) return null
        return (
          <div
            key={`overlay-${overlayElId}`}
            className="absolute inset-0 z-[1000]"
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => useOverlayStore.getState().closeOverlay(overlayElId)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: overlayEl.width,
                height: overlayEl.height,
                background: overlayEl.style?.backgroundColor || 'var(--panel-bg)',
                borderRadius: overlayEl.style?.borderRadius || 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}
            >
              <ElementRenderer key={`overlay-inner-${overlayElId}`} id={overlayElId} containerRef={containerRef} />
            </div>
          </div>
        )
      })}

      {!previewMode && <SelectionManager containerRef={containerRef} />}

      <AnimatePresence>
        {!previewMode && showRuler && (
          <motion.div
            key="rulers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE.standard }}
          >
            <CanvasRulers width={containerSize.width} height={containerSize.height} />
          </motion.div>
        )}
      </AnimatePresence>

      {!previewMode && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            height: 30, borderRadius: 8,
            background: 'rgba(28,28,28,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid var(--border-strong)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            padding: '0 4px',
          }}>
            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              title={showGrid ? 'Hide grid' : 'Show grid'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 4,
                background: showGrid ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: showGrid ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: 11, fontFamily: 'var(--font-ui)',
                transition: 'color var(--duration-instant), background var(--duration-instant)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = showGrid ? 'rgba(255,255,255,0.06)' : 'transparent'; e.currentTarget.style.color = showGrid ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Grid3X3 size={12} />
            </button>
            {/* Ruler toggle */}
            <button
              onClick={() => setShowRuler(!showRuler)}
              title={showRuler ? 'Hide rulers' : 'Show rulers'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 4,
                background: showRuler ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: showRuler ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: 11, fontFamily: 'var(--font-ui)',
                transition: 'color var(--duration-instant), background var(--duration-instant)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = showRuler ? 'rgba(255,255,255,0.06)' : 'transparent'; e.currentTarget.style.color = showRuler ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Ruler size={12} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
            {/* Zoom */}
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '0 8px', height: 26, borderRadius: 4,
                  border: 'none', cursor: 'pointer',
                  background: 'transparent',
                  color: 'var(--text-tertiary)', fontSize: 10,
                  fontFamily: 'var(--font-ui)',
                  transition: 'color var(--duration-instant)',
                  fontVariantNumeric: 'tabular-nums',
                }}
                onClick={() => setShowZoom(v => !v)}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
              >
                {Math.round(canvas.scale * 100)}%
                <ChevronDown size={8} />
              </button>
              {showZoom && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowZoom(false)} />
                  <div style={{
                    position: 'absolute', bottom: 34, left: 0, zIndex: 50,
                    background: 'var(--panel-bg)', border: '1px solid var(--border-strong)',
                    borderRadius: 8, padding: 4, minWidth: 80,
                    boxShadow: 'var(--shadow-dropdown)',
                  }}>
                    {ZOOM_PRESETS.map(pct => (
                      <button
                        key={pct}
                        onClick={() => { setCanvas({ scale: pct / 100 }); setShowZoom(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '3px 8px', borderRadius: 4,
                          border: 'none', cursor: 'pointer', fontSize: 10,
                          background: Math.round(canvas.scale * 100) === pct ? 'var(--surface-2)' : 'transparent',
                          color: Math.round(canvas.scale * 100) === pct ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-ui)',
                          transition: 'background var(--duration-instant)',
                        }}
                        onMouseEnter={e => { if (Math.round(canvas.scale * 100) !== pct) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={e => { if (Math.round(canvas.scale * 100) !== pct) e.currentTarget.style.background = 'transparent' }}
                      >
                        {pct}%
                        {Math.round(canvas.scale * 100) === pct && <span style={{ fontSize: 9, color: 'var(--accent)' }}>✓</span>}
                      </button>
                    ))}
                    <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                    <button
                      onClick={() => { setCanvas({ x: 0, y: 0, scale: 1 }); setShowZoom(false) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '3px 8px', borderRadius: 4, border: 'none',
                        background: 'transparent', color: 'var(--text-tertiary)',
                        cursor: 'pointer', fontSize: 10,
                        fontFamily: 'var(--font-ui)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Reset view
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editingComponentId && !previewMode && (
        <>
          <style>{`
            [data-instance-of="${editingComponentId}"] {
              outline: 1.5px solid var(--accent) !important;
              outline-offset: -1px;
            }
          `}</style>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, zIndex: 60,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--accent-border)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
          }}>
            <Component size={14} strokeWidth={1.6} />
            Editing {elements[editingComponentId]?.name || 'Component'}
            <button
              onClick={() => {
                const store = useEditorStore.getState()
                store.setSelectedIds(prevSelectedRef.current)
                store.setEditingComponent(null)
              }}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-hover)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-ui)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)' }}
            >
              Done
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            key="context-menu"
            x={contextMenu.x}
            y={contextMenu.y}
            elementId={contextMenu.elementId}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
