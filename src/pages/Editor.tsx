import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useCMSStore } from '@/store/cmsStore'
import { useUIStore } from '@/store/uiStore'
import Toolbar from '@/panels/toolbar/Toolbar'
import Canvas from '@/editor/canvas/Canvas'
import LayersPanel from '@/panels/layers/LayersPanel'
import ComponentsPanel from '@/panels/components/ComponentsPanel'
import CMSPanel from '@/panels/cms/CMSPanel'
import AssetsPanel from '@/panels/assets/AssetsPanel'
import InspectorPanel from '@/panels/inspector/InspectorPanel'
import LeftPanelRail from '@/panels/layers/LeftPanelRail'
import useKeyboard from '@/hooks/useKeyboard'
import useClipboard from '@/hooks/useClipboard'
import { useAutoSave } from '@/hooks/useAutoSave'
import ErrorBoundary from '@/components/ErrorBoundary'
import CommandPalette from '@/components/CommandPalette'
import ToastHost from '@/components/ToastHost'
import SEO from '@/components/SEO'
import HistoryPanel from '@/editor/history/HistoryPanel'
import TransformPanel from '@/editor/transform/TransformPanel'
import { DURATION, EASE } from '@/lib/motionTokens'
import { createStarterProjectData, looksLikePlaceholderProject } from '@/lib/defaultProject'
import type { Element } from '@/store/editorStore'
import CopilotPanel from '@/panels/copilot/CopilotPanel'
import { COPILOT_WIDTH } from '@/store/uiStore'

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const activeLeftPanel = useUIStore(s => s.activeLeftPanel)
  const setActiveLeftPanel = useUIStore(s => s.setActiveLeftPanel)
  const rightPanelWidth = useUIStore(s => s.rightPanelWidth)
  const setRightPanelWidth = useUIStore(s => s.setRightPanelWidth)
  const [showPalette, setShowPalette] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const previewMode = useEditorStore((s) => s.previewMode)
  const loadProjectData = useProjectStore((s) => s.loadProjectData)
  const getProject = useProjectStore((s) => s.getProject)
  const loadCMSData = useCMSStore((s) => s.loadCMSData)
  const saveStatus = useAutoSave(projectId)

  const dragState = useRef<{ startX: number; startW: number } | null>(null)

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

  const handleRightDividerPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const startW = rightPanelWidth
    dragState.current = { startX: e.clientX, startW }

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current) return
      const dx = ev.clientX - dragState.current.startX
      const newW = dragState.current.startW - dx
      setRightPanelWidth(newW)
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
  }, [rightPanelWidth, setRightPanelWidth])

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
    <>
      <SEO
        title={getProject(projectId ?? '')?.name || 'Editor'}
        description="Edit your Framer project with the visual editor. Drag-and-drop, style, and publish responsive websites."
        canonical={`https://framer.app/editor/${projectId}`}
        noIndex
      />
      <div
        className="flex h-full w-full"
        style={{ background: 'var(--app-bg)' }}
      >
        {!previewMode && (
          <>
            {/* Left rail — 44px icon bar */}
            <LeftPanelRail activeTab={activeLeftPanel} onTabChange={setActiveLeftPanel} />

            {/* Secondary left panel — animated 0↔240px (hidden for copilot) */}
            <AnimatePresence>
              {activeLeftPanel && activeLeftPanel !== 'copilot' && (
                <motion.aside
                  key="secondary-panel"
                  initial={{ width: 0 }}
                  animate={{ width: 240 }}
                  exit={{ width: 0 }}
                  transition={{ duration: DURATION.base, ease: EASE.standard }}
                  style={{
                    overflow: 'hidden',
                    background: 'var(--panel-bg)',
                    borderRight: '0.5px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.fast, delay: DURATION.stagger }}
                    style={{ width: 240, height: '100%', overflow: 'hidden' }}
                  >
                    <ErrorBoundary name="Layers">
                      {activeLeftPanel === 'layers'     && <LayersPanel />}
                      {activeLeftPanel === 'components' && <ComponentsPanel />}
                      {activeLeftPanel === 'cms'        && <CMSPanel />}
                      {activeLeftPanel === 'assets'     && <AssetsPanel />}
                      {activeLeftPanel === 'history'    && <HistoryPanel />}
                      {activeLeftPanel === 'transform'  && <TransformPanel />}
                    </ErrorBoundary>
                  </motion.div>
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}

        <div className="flex flex-1 relative overflow-hidden">
          <ErrorBoundary name="Canvas">
            <Canvas />
          </ErrorBoundary>
          {!previewMode && <Toolbar saveStatus={saveStatus} />}
        </div>

        {/* Copilot right panel — between canvas and inspector divider */}
        <AnimatePresence>
          {!previewMode && activeLeftPanel === 'copilot' && (
            <motion.aside
              key="copilot-right-panel"
              initial={{ width: 0 }}
              animate={{ width: COPILOT_WIDTH }}
              exit={{ width: 0 }}
              transition={{ duration: DURATION.base, ease: EASE.standard }}
              style={{
                overflow: 'hidden',
                background: 'var(--panel-bg)',
                borderLeft: '0.5px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.fast, delay: DURATION.stagger }}
                style={{ width: COPILOT_WIDTH, height: '100%', overflow: 'hidden' }}
              >
                <ErrorBoundary name="Copilot">
                  <CopilotPanel />
                </ErrorBoundary>
              </motion.div>
            </motion.aside>
          )}
        </AnimatePresence>

        {!previewMode && (
          <>
            {/* Right resize handle */}
            <div
              onPointerDown={handleRightDividerPointerDown}
              style={{
                width: 4, cursor: 'col-resize', flexShrink: 0,
                background: 'transparent', transition: 'background var(--duration-instant)',
                zIndex: 20,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-border)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />

            {/* Right panel — 256px inspector */}
            <aside
              className="flex flex-col overflow-hidden"
              style={{
                width: rightPanelWidth,
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

      <AnimatePresence>
        {showPalette && <CommandPalette key="command-palette" onClose={() => setShowPalette(false)} />}
      </AnimatePresence>
      <ToastHost />
    </>
  )
}
