import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useCMSStore } from '@/store/cmsStore'
import Toolbar from '@/panels/toolbar/Toolbar'
import Canvas from '@/editor/canvas/Canvas'
import LayersPanel from '@/panels/layers/LayersPanel'
import ComponentsPanel from '@/panels/components/ComponentsPanel'
import CMSPanel from '@/panels/cms/CMSPanel'
import AssetsPanel from '@/panels/assets/AssetsPanel'
import InspectorPanel from '@/panels/inspector/InspectorPanel'
import LeftPanelTabs from '@/panels/layers/LeftPanelTabs'
import type { PanelTab } from '@/panels/layers/LeftPanelTabs'
import useKeyboard from '@/hooks/useKeyboard'
import useClipboard from '@/hooks/useClipboard'
import { useAutoSave } from '@/hooks/useAutoSave'
import ErrorBoundary from '@/components/ErrorBoundary'
import CommandPalette from '@/components/CommandPalette'
import { createStarterProjectData, looksLikePlaceholderProject } from '@/lib/defaultProject'
import type { Element } from '@/store/editorStore'

const LEFT_MIN = 180
const LEFT_MAX = 400
const RIGHT_MIN = 200
const RIGHT_MAX = 360
const LEFT_DEFAULT = 220
const RIGHT_DEFAULT = 240

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [leftTab, setLeftTab] = useState<PanelTab>('layers')
  const [showPalette, setShowPalette] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT)
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT)
  const previewMode = useEditorStore((s) => s.previewMode)
  const loadProjectData = useProjectStore((s) => s.loadProjectData)
  const getProject = useProjectStore((s) => s.getProject)
  const loadCMSData = useCMSStore((s) => s.loadCMSData)
  const saveStatus = useAutoSave(projectId)

  const dragState = useRef<{ side: 'left' | 'right'; startX: number; startW: number } | null>(null)

  useKeyboard()
  useClipboard()

  useEffect(() => {
    if (!projectId) return
    const project = getProject(projectId)
    if (!project) {
      navigate('/', { replace: true })
      return
    }
    setLoadingData(true)
    Promise.all([
      loadProjectData(projectId),
      loadCMSData(projectId)
    ]).then(([data]) => {
      const incomingElements = (data?.elements ?? {}) as Record<string, Element>
      const incomingRootIds = data?.rootElementIds ?? []
      const shouldUseStarter = !data || looksLikePlaceholderProject(incomingElements, incomingRootIds)
      const nextData = shouldUseStarter
        ? createStarterProjectData(project.canvasWidth, project.canvasHeight)
        : data

      useEditorStore.setState({
        elements: nextData.elements as any,
        rootElementIds: nextData.rootElementIds,
        canvas: nextData.canvas,
        selectedIds: [],
        editingId: null,
      })
      setLoadingData(false)
    })
  }, [projectId])

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setShowPalette(v => !v)
    }
    if (e.key === 'Escape') setShowPalette(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  const handleDividerPointerDown = useCallback((side: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault()
    const startW = side === 'left' ? leftWidth : rightWidth
    dragState.current = { side, startX: e.clientX, startW }

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current) return
      const dx = ev.clientX - dragState.current.startX
      const newW = dragState.current.startW + (dragState.current.side === 'left' ? dx : -dx)
      const clamped = dragState.current.side === 'left'
        ? Math.min(LEFT_MAX, Math.max(LEFT_MIN, newW))
        : Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, newW))
      if (dragState.current.side === 'left') setLeftWidth(clamped)
      else setRightWidth(clamped)
    }

    const onUp = () => {
      dragState.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [leftWidth, rightWidth])

  if (loadingData) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--app-bg)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid var(--surface-3)', borderTopColor: 'var(--accent)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)' }}>
            Loading project…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: 'var(--app-bg)' }}
    >
      <Toolbar saveStatus={saveStatus} />

      <div className="flex flex-1 overflow-hidden">
        {!previewMode && (
          <>
            {/* Left panel */}
            <aside
              className="flex flex-col overflow-hidden"
              style={{
                width: leftWidth,
                background: 'var(--panel-bg)',
                borderRight: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <LeftPanelTabs activeTab={leftTab} onTabChange={setLeftTab} />
              <div className="flex-1 overflow-hidden">
                <ErrorBoundary name="Layers">
                  {leftTab === 'layers'     && <LayersPanel />}
                  {leftTab === 'components' && <ComponentsPanel />}
                  {leftTab === 'cms'        && <CMSPanel />}
                  {leftTab === 'assets'     && <AssetsPanel />}
                </ErrorBoundary>
              </div>
            </aside>

            {/* Left resize handle */}
            <div
              onPointerDown={handleDividerPointerDown('left')}
              style={{
                width: 4, cursor: 'col-resize', flexShrink: 0,
                background: 'transparent', transition: 'background 80ms',
                zIndex: 20,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,153,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          </>
        )}

        <ErrorBoundary name="Canvas">
          <Canvas />
        </ErrorBoundary>

        {!previewMode && (
          <>
            {/* Right resize handle */}
            <div
              onPointerDown={handleDividerPointerDown('right')}
              style={{
                width: 4, cursor: 'col-resize', flexShrink: 0,
                background: 'transparent', transition: 'background 80ms',
                zIndex: 20,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,153,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />

            {/* Right panel */}
            <aside
              className="flex flex-col overflow-hidden"
              style={{
                width: rightWidth,
                background: 'var(--panel-bg)',
                borderLeft: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <div className="flex-1 overflow-y-auto">
                <ErrorBoundary name="Inspector">
                  <InspectorPanel />
                </ErrorBoundary>
              </div>
            </aside>
          </>
        )}
      </div>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  )
}
