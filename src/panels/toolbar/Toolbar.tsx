import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { Tool, Breakpoint } from '@/store/editorStore'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import PublishModal from '@/panels/publish/PublishModal'
import type { SaveStatus } from '@/hooks/useAutoSave'
import {
  MousePointer2, Square, Type, Image as ImageIcon,
  Circle, Play, Eye, X, ChevronDown, Monitor, Tablet,
  Smartphone, Plus, Hand,
} from 'lucide-react'

const TOOLS: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'select',  label: 'Select',    shortcut: 'V', icon: <MousePointer2 size={15} strokeWidth={1.5} /> },
  { id: 'frame',   label: 'Frame',     shortcut: 'F', icon: <Square size={15} strokeWidth={1.5} strokeDasharray="3 2" /> },
  { id: 'text',    label: 'Text',      shortcut: 'T', icon: <Type size={15} strokeWidth={1.5} /> },
  { id: 'image',   label: 'Image',     shortcut: 'I', icon: <ImageIcon size={15} strokeWidth={1.5} /> },
  { id: 'rect',    label: 'Rectangle', shortcut: 'R', icon: <Square size={15} strokeWidth={1.5} /> },
  { id: 'ellipse', label: 'Ellipse',   shortcut: 'O', icon: <Circle size={15} strokeWidth={1.5} /> },
]

const BREAKPOINTS: { id: Breakpoint; label: string; width: number; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', width: 1280, icon: <Monitor size={12} strokeWidth={1.5} /> },
  { id: 'tablet',  label: 'Tablet',  width: 810,  icon: <Tablet size={12} strokeWidth={1.5} /> },
  { id: 'mobile',  label: 'Phone',   width: 390,  icon: <Smartphone size={12} strokeWidth={1.5} /> },
]

const ZOOM_PRESETS = [2, 10, 25, 50, 75, 100, 150, 200, 400, 800, 1600, 3200, 6400]

interface Props {
  saveStatus?: SaveStatus
}

export default function Toolbar({ saveStatus = 'saved' }: Props) {
  const [showPublish, setShowPublish]   = useState(false)
  const [tooltip, setTooltip]           = useState<string | null>(null)
  const [showZoomMenu, setShowZoomMenu] = useState(false)
  const zoomRef = useRef<HTMLDivElement>(null)

  const activeTool         = useEditorStore(s => s.activeTool)
  const setActiveTool      = useEditorStore(s => s.setActiveTool)
  const previewMode        = useEditorStore(s => s.previewMode)
  const setPreviewMode     = useEditorStore(s => s.setPreviewMode)
  const canvas             = useEditorStore(s => s.canvas)
  const setCanvas          = useEditorStore(s => s.setCanvas)
  const activeBreakpoint   = useEditorStore(s => s.activeBreakpoint)
  const setActiveBreakpoint = useEditorStore(s => s.setActiveBreakpoint)

  const { projectId } = useParams<{ projectId: string }>()
  const getProject    = useProjectStore(s => s.getProject)
  void getProject; void projectId
  const user          = useAuthStore(s => s.user)

  const userInitials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    if (!showZoomMenu) return
    const handler = (e: MouseEvent) => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node))
        setShowZoomMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showZoomMenu])

  const handleBreakpoint = (bp: Breakpoint) => {
    setActiveBreakpoint(bp)
    setCanvas({ scale: bp === 'mobile' ? 0.6 : bp === 'tablet' ? 0.75 : 1 })
  }

  const zoomPct = Math.round(canvas.scale * 100)

  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        background: 'var(--toolbar-bg)',
        borderBottom: '1px solid var(--border)',
        paddingInline: 8,
        gap: 0,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── LEFT: Logo + Tools ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>

          {/* Framer Logo */}
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', flexShrink: 0,
            transition: 'background 80ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
              <path d="M0 0H14V6H7L0 0Z" fill="#e8e8e8" />
              <path d="M0 6H7L14 12H0V6Z" fill="#e8e8e8" />
              <path d="M0 12H7V18L0 12Z" fill="#e8e8e8" />
            </svg>
          </button>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: 'var(--border)', marginInline: 4 }} />

          {/* Tool buttons */}
          {TOOLS.map(tool => (
            <div key={tool.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTool(tool.id)}
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: activeTool === tool.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: activeTool === tool.id ? '#e8e8e8' : '#555',
                  transition: 'background 80ms, color 80ms',
                }}
                onMouseEnter={e => {
                  setTooltip(tool.id)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = '#999'
                  }
                }}
                onMouseLeave={e => {
                  setTooltip(null)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#555'
                  }
                }}
              >
                {tool.icon}
              </button>
              {tooltip === tool.id && (
                <div className="framer-tooltip" style={{
                  position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
                }}>
                  {tool.label}
                  <span className="shortcut">{tool.shortcut}</span>
                </div>
              )}
            </div>
          ))}

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: 'var(--border)', marginInline: 4 }} />

          {/* Hand / pan tool */}
          <button
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 5, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#444',
              transition: 'background 80ms, color 80ms',
            }}
            title="Pan (Space)"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#999' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
          >
            <Hand size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── CENTER: Breakpoint tabs — Framer segmented control ── */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'var(--surface-2)',
          borderRadius: 6,
          padding: 2,
        }}>
          {BREAKPOINTS.map((bp) => {
            const isActive = activeBreakpoint === bp.id
            return (
              <button
                key={bp.id}
                onClick={() => handleBreakpoint(bp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', height: 24,
                  borderRadius: 4,
                  border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--surface-4)' : 'transparent',
                  color: isActive ? '#e8e8e8' : '#666',
                  fontSize: 11, fontWeight: isActive ? 500 : 400,
                  transition: 'all 80ms',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5 }}>{bp.icon}</span>
                <span>{bp.label}</span>
                <span style={{
                  fontSize: 10,
                  color: isActive ? '#888' : '#444',
                  fontVariantNumeric: 'tabular-nums',
                }}>{bp.width}</span>
              </button>
            )
          })}

          <div style={{ width: 1, height: 14, background: 'var(--border)', marginInline: 2 }} />

          <button
            style={{
              width: 20, height: 20, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#444',
              transition: 'all 80ms',
            }}
            title="Add breakpoint"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
          >
            <Plus size={11} />
          </button>
        </div>

        {/* ── RIGHT: Zoom, Preview, Avatar, Publish ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

          {/* Save status */}
          {saveStatus !== 'saved' && (
            <span style={{ fontSize: 11, color: saveStatus === 'saving' ? '#555' : '#f5a623', marginRight: 4 }}>
              {saveStatus === 'saving' ? 'Saving…' : '●'}
            </span>
          )}

          {/* Zoom */}
          <div ref={zoomRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowZoomMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 6px', borderRadius: 4, border: 'none',
                background: showZoomMenu ? 'var(--surface-3)' : 'transparent',
                color: '#666', cursor: 'pointer', fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                transition: 'background 80ms, color 80ms',
              }}
              onMouseEnter={e => { if (!showZoomMenu) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#999' } }}
              onMouseLeave={e => { if (!showZoomMenu) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' } }}
            >
              {zoomPct}%
              <ChevronDown size={10} />
            </button>
            {showZoomMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 30, zIndex: 300,
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 6, padding: 3, minWidth: 120,
                boxShadow: 'var(--shadow-dropdown)',
              }}>
                {ZOOM_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setCanvas({ scale: pct / 100 }); setShowZoomMenu(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '4px 8px', borderRadius: 4,
                      border: 'none', cursor: 'pointer', fontSize: 11,
                      background: zoomPct === pct ? 'var(--surface-3)' : 'transparent',
                      color: zoomPct === pct ? '#e8e8e8' : '#888',
                      transition: 'background 60ms',
                      fontFamily: 'var(--font-ui)',
                    }}
                    onMouseEnter={e => { if (zoomPct !== pct) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (zoomPct !== pct) e.currentTarget.style.background = 'transparent' }}
                  >
                    {pct}%
                    {zoomPct === pct && <span style={{ fontSize: 10, color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 14, background: 'var(--border)', marginInline: 2 }} />

          {/* Preview toggle */}
          {previewMode ? (
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 5, border: 'none',
                background: 'var(--surface-3)', color: '#e0e0e0',
                cursor: 'pointer', fontSize: 11, fontWeight: 500,
                transition: 'background 80ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-4)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-3)')}
            >
              <X size={11} /> Exit Preview
            </button>
          ) : (
            <button
              onClick={() => setPreviewMode(true)}
              title="Preview (Ctrl+Shift+P)"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 5, border: 'none',
                background: 'transparent', color: '#555',
                cursor: 'pointer', transition: 'background 80ms, color 80ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#999' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            >
              <Eye size={15} strokeWidth={1.5} />
            </button>
          )}

          {/* User avatar */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: '#fff',
            flexShrink: 0, cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            {userInitials}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 14, background: 'var(--border)', marginInline: 2 }} />

          {/* Publish */}
          <button
            onClick={() => setShowPublish(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#fff',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.01em',
              transition: 'background 80ms',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            <Play size={10} style={{ fill: '#fff', flexShrink: 0 }} />
            Publish
          </button>
        </div>
      </header>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </>
  )
}
