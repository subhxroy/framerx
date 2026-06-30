import { useRef, useCallback, useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { componentDefinitions } from '@/panels/components/ComponentDefinitions'
import { ASSET_DND_TYPE } from '@/panels/assets/AssetsPanel'
import { breakpointWidths } from '@/lib/breakpointUtils'
import { hitTestDeepest } from '@/lib/hitTest'
import ElementRenderer from '@/editor/elements/Element'
import SelectionManager from '@/editor/selection/SelectionManager'
import ContextMenu from '@/panels/context/ContextMenu'
import { ChevronDown } from 'lucide-react'

const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 400]

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const isSpaceDown = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const canvas = useEditorStore((s) => s.canvas)
  const setCanvas = useEditorStore((s) => s.setCanvas)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const addElement = useEditorStore((s) => s.addElement)
  const addElementTree = useEditorStore((s) => s.addElementTree)
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)

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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      // Ctrl/Cmd + scroll (or trackpad pinch) = zoom centered on cursor
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.1 : 0.9
        const newScale = Math.min(64, Math.max(0.02, canvas.scale * factor))
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const sx = (mx - canvas.x) / canvas.scale
        const sy = (my - canvas.y) / canvas.scale
        setCanvas({
          scale: newScale,
          x: mx - sx * newScale,
          y: my - sy * newScale,
        })
        return
      }

      // Plain scroll / two-finger trackpad pan
      setCanvas({
        x: canvas.x - e.deltaX,
        y: canvas.y - e.deltaY,
      })
    },
    [canvas, setCanvas]
  )

  useEffect(() => {
    const handleKD = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      if (typing) return
      if (e.code === 'Space') isSpaceDown.current = true
      if (e.code === 'KeyV') setActiveTool('select')
      if (e.code === 'KeyF') setActiveTool('frame')
      if (e.code === 'KeyT') setActiveTool('text')
      if (e.code === 'KeyI') setActiveTool('image')
      if (e.code === 'KeyR') setActiveTool('rect')
      if (e.code === 'KeyO') setActiveTool('ellipse')

      // Shift+1: zoom to fit all
      if (e.code === 'Digit1' && e.shiftKey) {
        e.preventDefault()
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const els = useEditorStore.getState().elements
        const rootIds = useEditorStore.getState().rootElementIds
        if (rootIds.length === 0) return setCanvas({ x: 0, y: 0, scale: 1 })
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const id of rootIds) {
          const el = els[id]
          if (!el) continue
          minX = Math.min(minX, el.x); minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height)
        }
        const pw = rect.width, ph = rect.height
        const cw = maxX - minX + 80, ch = maxY - minY + 80
        const scale = Math.min(pw / cw, ph / ch, 2)
        setCanvas({ scale, x: (pw - cw * scale) / 2 - minX * scale + 40, y: (ph - ch * scale) / 2 - minY * scale + 40 })
        return
      }

      // Ctrl+0: reset to 100%
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        setCanvas({ scale: 1 })
      }

      // Ctrl++/- zoom
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setCanvas({ scale: Math.min(64, useEditorStore.getState().canvas.scale * 1.2) })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        setCanvas({ scale: Math.max(0.02, useEditorStore.getState().canvas.scale / 1.2) })
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

    window.addEventListener('keydown', handleKD)
    window.addEventListener('keyup', handleKU)
    const el = containerRef.current
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false })
      el.addEventListener('pointerdown', handleDeepSelect, true)
    }
    return () => {
      window.removeEventListener('keydown', handleKD)
      window.removeEventListener('keyup', handleKU)
      if (el) {
        el.removeEventListener('wheel', handleWheel)
        el.removeEventListener('pointerdown', handleDeepSelect, true)
      }
    }
  }, [handleWheel, setActiveTool])

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
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
        const target = e.target as HTMLElement
        if (target.closest('[data-element-id]')) return

        const pos = screenToCanvas(e.clientX, e.clientY)
        pushHistory()

        if (activeTool === 'text') {
          addElement({
            type: 'text',
            x: pos.x,
            y: pos.y,
            width: 200,
            height: 40,
            name: 'Text',
          })
        } else if (activeTool === 'image') {
          addElement({
            type: 'image',
            x: pos.x,
            y: pos.y,
            width: 240,
            height: 160,
            name: 'Image',
          })
        } else if (activeTool === 'rect' || activeTool === 'ellipse') {
          addElement({
            type: 'shape',
            x: pos.x,
            y: pos.y,
            width: 120,
            height: 120,
            name: activeTool === 'rect' ? 'Rectangle' : 'Ellipse',
            style: {
              borderRadius: activeTool === 'ellipse' ? 9999 : 0,
              backgroundColor: 'var(--surface-3)',
            },
          })
        } else if (activeTool === 'frame') {
          addElement({
            type: 'frame',
            x: pos.x,
            y: pos.y,
            width: 240,
            height: 200,
            name: 'Frame',
          })
        }
      }
    },
    [activeTool, screenToCanvas, pushHistory, addElement]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      setCanvas({ x: canvas.x + dx, y: canvas.y + dy })
    },
    [canvas, setCanvas]
  )

  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const previewMode = useEditorStore((s) => s.previewMode)
  const [isDragOver, setIsDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (previewMode) return
    const target = e.target as HTMLElement
    const el = target.closest('[data-element-id]') as HTMLElement | null
    const id = el?.getAttribute('data-element-id')
    if (!id) return
    const store = useEditorStore.getState()
    const element = store.elements[id]
    if (element?.type === 'text') {
      e.stopPropagation()
      store.setSelectedIds([id])
      store.pushHistory()
      store.setEditingId(id)
      return
    }
    // Drill down one level: select the deepest descendant under the pointer that
    // sits inside the current selection's subtree; fall back to deepest at point.
    let drilled: string | null = null
    for (const sid of store.selectedIds) {
      drilled = hitTestDeepest(e.clientX, e.clientY, store.elements, sid)
      if (drilled) break
    }
    if (!drilled) drilled = hitTestDeepest(e.clientX, e.clientY, store.elements)
    if (drilled && drilled !== id) {
      e.stopPropagation()
      store.setSelectedIds([drilled])
    }
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

      // 1) Asset drop (image from the Assets panel)
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

      // 2) Component definition drop
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
  }, [])

  const [showZoom, setShowZoom] = useState(false)
  const gridSize = 24
  const dotSpacing = gridSize * canvas.scale

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{
        background: 'var(--canvas-bg)',
        cursor: activeTool !== 'select'
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
      {!previewMode && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #2c2c2c 1px, transparent 1px)',
            backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
            backgroundPosition: `${canvas.x}px ${canvas.y}px`,
          }}
        />
      )}

      <div
        className="absolute"
        style={{
          transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})`,
          transformOrigin: '0 0',
          ...(activeBreakpoint !== 'desktop'
            ? {
                left: '50%',
                marginLeft: -(breakpointWidths[activeBreakpoint] / 2),
                width: breakpointWidths[activeBreakpoint],
                minHeight: '100vh',
                background: 'var(--canvas-bg)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              }
            : {}),
        }}
      >
        {rootElementIds.map((id) => (
          <ElementRenderer key={id} id={id} containerRef={containerRef} />
        ))}
      </div>

      {!previewMode && <SelectionManager containerRef={containerRef} />}

      {!previewMode && (
        <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 50 }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '4px 9px', borderRadius: 6,
              background: 'rgba(28,28,28,0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #2a2a2a',
              color: '#555', cursor: 'pointer', fontSize: 11,
              fontFamily: 'var(--font-ui)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              transition: 'color 80ms',
              fontVariantNumeric: 'tabular-nums',
            }}
            onClick={() => setShowZoom(v => !v)}
            onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            {Math.round(canvas.scale * 100)}%
            <ChevronDown size={9} />
          </button>
          {showZoom && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowZoom(false)} />
              <div style={{
                position: 'absolute', bottom: 34, left: 0, zIndex: 50,
                background: '#1c1c1c', border: '1px solid #2a2a2a',
                borderRadius: 7, padding: 4, minWidth: 100,
                boxShadow: 'var(--shadow-dropdown)',
              }}>
                {ZOOM_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setCanvas({ scale: pct / 100 }); setShowZoom(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '5px 10px', borderRadius: 5,
                      border: 'none', cursor: 'pointer', fontSize: 11,
                      background: Math.round(canvas.scale * 100) === pct ? '#252525' : 'transparent',
                      color: Math.round(canvas.scale * 100) === pct ? '#ececec' : '#888',
                      fontFamily: 'var(--font-ui)',
                      transition: 'background 60ms',
                    }}
                    onMouseEnter={e => { if (Math.round(canvas.scale * 100) !== pct) e.currentTarget.style.background = '#202020' }}
                    onMouseLeave={e => { if (Math.round(canvas.scale * 100) !== pct) e.currentTarget.style.background = 'transparent' }}
                  >
                    {pct}%
                    {Math.round(canvas.scale * 100) === pct && <span style={{ fontSize: 10, color: '#0091ff' }}>✓</span>}
                  </button>
                ))}
                <div style={{ height: 1, background: '#252525', margin: '4px 0' }} />
                <button
                  onClick={() => { setCanvas({ x: 0, y: 0, scale: 1 }); setShowZoom(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '5px 10px', borderRadius: 5, border: 'none',
                    background: 'transparent', color: '#555',
                    cursor: 'pointer', fontSize: 11,
                    fontFamily: 'var(--font-ui)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#202020')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Reset view
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
