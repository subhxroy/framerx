import { useState, useEffect, useCallback } from 'react'
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

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [leftTab, setLeftTab] = useState<PanelTab>('layers')
  const [showPalette, setShowPalette] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const previewMode = useEditorStore((s) => s.previewMode)
  const loadProjectData = useProjectStore((s) => s.loadProjectData)
  const getProject = useProjectStore((s) => s.getProject)
  const loadCMSData = useCMSStore((s) => s.loadCMSData)
  const saveStatus = useAutoSave(projectId)

  useKeyboard()
  useClipboard()

  // Async load of project data
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
      if (data) {
        useEditorStore.setState({
          elements: data.elements as any,
          rootElementIds: data.rootElementIds,
          canvas: data.canvas,
        })
      }
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

  if (loadingData) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#111',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid #222', borderTopColor: '#0091ff',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 11, color: '#3a3a3a', fontFamily: 'Inter, sans-serif' }}>
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
          <aside
            className="flex flex-col overflow-hidden"
            style={{
              width: 240,
              background: 'var(--panel-bg)',
              borderRight: '1px solid var(--panel-border)',
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
        )}

        <ErrorBoundary name="Canvas">
          <Canvas />
        </ErrorBoundary>

        {!previewMode && (
          <aside
            className="flex flex-col overflow-hidden"
            style={{
              width: 240,
              background: 'var(--panel-bg)',
              borderLeft: '1px solid var(--panel-border)',
              flexShrink: 0,
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary name="Inspector">
                <InspectorPanel />
              </ErrorBoundary>
            </div>
          </aside>
        )}
      </div>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  )
}
