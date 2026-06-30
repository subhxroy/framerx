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

/* ─── Tool definitions ─── */
const TOOLS: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'select',  label: 'Select',    shortcut: 'V', icon: <MousePointer2 size={14} /> },
  { id: 'frame',   label: 'Frame',     shortcut: 'F', icon: <Square size={14} strokeDasharray="3 2" /> },
  { id: 'text',    label: 'Text',      shortcut: 'T', icon: <Type size={14} /> },
  { id: 'image',   label: 'Image',     shortcut: 'I', icon: <ImageIcon size={14} /> },
  { id: 'rect',    label: 'Rectangle', shortcut: 'R', icon: <Square size={14} /> },
  { id: 'ellipse', label: 'Ellipse',   shortcut: 'O', icon: <Circle size={14} /> },
]

/* ─── Breakpoint definitions ─── */
const BREAKPOINTS: { id: Breakpoint; label: string; width: number; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', width: 1280, icon: <Monitor size={12} /> },
  { id: 'tablet',  label: 'Tablet',  width: 810,  icon: <Tablet size={12} /> },
  { id: 'mobile',  label: 'Phone',   width: 390,  icon: <Smartphone size={12} /> },
]

const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 400]

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

  /* Close zoom dropdown on outside click */
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
        height: 44,
        background: 'var(--toolbar-bg)',
        borderBottom: '1px solid var(--border)',
        paddingInline: 10,
        gap: 0,
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── LEFT: Logo + Divider + Tools ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

          {/* Framer Logo mark */}
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', flexShrink: 0,
            transition: 'background 80ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="12" height="16" viewBox="0 0 28 38" fill="none">
              <path d="M0 0H28V14H14L0 0Z" fill="#ececec" />
              <path d="M0 14H14L28 28H0V14Z" fill="#ececec" />
              <path d="M0 28H14V42L0 28Z" fill="#ececec" />
            </svg>
          </button>

          {/* Vertical separator */}
          <div style={{ width: 1, height: 18, background: '#252525', marginInline: 4 }} />

          {/* Tool buttons */}
          {TOOLS.map(tool => (
            <div key={tool.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTool(tool.id)}
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: activeTool === tool.id ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color: activeTool === tool.id ? '#ececec' : '#666',
                  transition: 'background 80ms, color 80ms',
                }}
                onMouseEnter={e => {
                  setTooltip(tool.id)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = '#252525'
                    e.currentTarget.style.color = '#aaa'
                  }
                }}
                onMouseLeave={e => {
                  setTooltip(null)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#666'
                  }
                }}
              >
                {tool.icon}
              </button>
              {/* Tooltip */}
              {tooltip === tool.id && (
                <div style={{
                  position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)',
                  background: '#1c1c1c', border: '1px solid #2e2e2e',
                  borderRadius: 5, padding: '4px 9px', whiteSpace: 'nowrap',
                  fontSize: 11, color: '#e0e0e0', pointerEvents: 'none', zIndex: 200,
                  boxShadow: 'var(--shadow-popup)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {tool.label}
                  <span style={{
                    background: '#2a2a2a', borderRadius: 3,
                    padding: '1px 5px', fontSize: 10, color: '#666',
                    fontFamily: 'var(--font-mono)',
                  }}>{tool.shortcut}</span>
                </div>
              )}
            </div>
          ))}

          {/* Hand / pan tool */}
          <button
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 5, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#555',
              transition: 'background 80ms, color 80ms',
            }}
            title="Pan (Space)"
            onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#aaa' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
          >
            <Hand size={14} />
          </button>
        </div>

        {/* ── CENTER: Breakpoint tabs ── */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          {BREAKPOINTS.map((bp, i) => {
            const isActive = activeBreakpoint === bp.id
            return (
              <button
                key={bp.id}
                onClick={() => handleBreakpoint(bp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', height: 28,
                  borderRadius: i === 0 ? '6px 0 0 6px' : i === BREAKPOINTS.length - 1 ? '0 6px 6px 0' : '0',
                  border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#e8e8e8' : '#4a4a4a',
                  fontSize: 11, fontWeight: isActive ? 500 : 400,
                  transition: 'background 80ms, color 80ms',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#4a4a4a'; e.currentTarget.style.background = 'transparent' } }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{bp.icon}</span>
                <span>{bp.label}</span>
                <span style={{
                  fontSize: 10,
                  color: isActive ? '#666' : '#333',
                  fontVariantNumeric: 'tabular-nums',
                }}>{bp.width}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 3, height: 3, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.35)',
                  }} />
                )}
              </button>
            )
          })}

          {/* Add breakpoint */}
          <button
            style={{
              width: 22, height: 22, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', marginLeft: 4,
              background: 'transparent', color: '#3a3a3a',
              transition: 'background 80ms, color 80ms',
            }}
            title="Add breakpoint"
            onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#666' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a3a3a' }}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* ── RIGHT: Zoom, Preview, Avatar, Publish ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

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
                padding: '3px 7px', borderRadius: 5, border: 'none',
                background: showZoomMenu ? '#252525' : 'transparent',
                color: '#555', cursor: 'pointer', fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                transition: 'background 80ms, color 80ms',
              }}
              onMouseEnter={e => { if (!showZoomMenu) { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#888' } }}
              onMouseLeave={e => { if (!showZoomMenu) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}
            >
              {zoomPct}%
              <ChevronDown size={9} />
            </button>
            {showZoomMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 32, zIndex: 300,
                background: '#1c1c1c', border: '1px solid #2e2e2e',
                borderRadius: 7, padding: 4, minWidth: 110,
                boxShadow: 'var(--shadow-dropdown)',
              }}>
                {ZOOM_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setCanvas({ scale: pct / 100 }); setShowZoomMenu(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '5px 10px', borderRadius: 5,
                      border: 'none', cursor: 'pointer', fontSize: 11,
                      background: zoomPct === pct ? '#252525' : 'transparent',
                      color: zoomPct === pct ? '#ececec' : '#888',
                      transition: 'background 60ms',
                      fontFamily: 'var(--font-ui)',
                    }}
                    onMouseEnter={e => { if (zoomPct !== pct) e.currentTarget.style.background = '#222' }}
                    onMouseLeave={e => { if (zoomPct !== pct) e.currentTarget.style.background = 'transparent' }}
                  >
                    {pct}%
                    {zoomPct === pct && <span style={{ fontSize: 10, color: '#0091ff' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: '#252525', marginInline: 2 }} />

          {/* Preview toggle */}
          {previewMode ? (
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, border: 'none',
                background: '#252525', color: '#e0e0e0',
                cursor: 'pointer', fontSize: 11, fontWeight: 500,
                transition: 'background 80ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2e2e2e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#252525')}
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
              onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#aaa' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            >
              <Eye size={14} />
            </button>
          )}

          {/* User avatar */}
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            flexShrink: 0, cursor: 'pointer',
            border: '1.5px solid rgba(255,255,255,0.12)',
            letterSpacing: '0.03em',
          }}>
            {userInitials}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: '#252525', marginInline: 2 }} />

          {/* Publish */}
          <button
            onClick={() => setShowPublish(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: 'none',
              background: '#0091ff', color: '#fff',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.01em',
              transition: 'background 80ms, transform 80ms',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0080e6' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0091ff' }}
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
