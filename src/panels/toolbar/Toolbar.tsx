import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import type { Tool, Breakpoint } from '@/store/editorStore'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import PublishModal from '@/panels/publish/PublishModal'
import type { SaveStatus } from '@/hooks/useAutoSave'
import {
  MousePointer2, Square, Type, Image as ImageIcon,
  Circle, Hand, Play, X, Monitor, Tablet,
  Smartphone, ChevronDown, Undo, Redo, Component,
} from 'lucide-react'
import { DELAY } from '@/lib/motionTokens'

const TOOLS: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'select',  label: 'Select',    shortcut: 'V', icon: <MousePointer2 size={14} strokeWidth={1.8} /> },
  { id: 'frame',   label: 'Frame',     shortcut: 'F', icon: <Square size={14} strokeWidth={1.8} strokeDasharray="3 2" /> },
  { id: 'text',    label: 'Text',      shortcut: 'T', icon: <Type size={14} strokeWidth={1.8} /> },
  { id: 'image',   label: 'Image',     shortcut: 'I', icon: <ImageIcon size={14} strokeWidth={1.8} /> },
  { id: 'rect',    label: 'Rectangle', shortcut: 'R', icon: <Square size={14} strokeWidth={1.8} /> },
  { id: 'ellipse', label: 'Ellipse',   shortcut: 'O', icon: <Circle size={14} strokeWidth={1.8} /> },
]

const BREAKPOINTS: { id: Breakpoint; label: string; width: number }[] = [
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'tablet',  label: 'Tablet',  width: 810 },
  { id: 'mobile',  label: 'Phone',   width: 390 },
]

const ZOOM_PRESETS = [25, 50, 75, 100, 150, 200]

interface Props {
  saveStatus?: SaveStatus
}

export default function Toolbar({ saveStatus = 'saved' }: Props) {
  const [showPublish, setShowPublish] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [showZoomMenu, setShowZoomMenu] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const zoomMenuRef = useRef<HTMLDivElement | null>(null)

  const activeTool         = useEditorStore(s => s.activeTool)
  const setActiveTool      = useEditorStore(s => s.setActiveTool)
  const undo               = useEditorStore(s => s.undo)
  const redo               = useEditorStore(s => s.redo)
  const canUndo            = useEditorStore(s => s.canUndo)
  const canRedo            = useEditorStore(s => s.canRedo)
  const previewMode        = useEditorStore(s => s.previewMode)
  const setPreviewMode     = useEditorStore(s => s.setPreviewMode)
  const activeBreakpoint   = useEditorStore(s => s.activeBreakpoint)
  const setActiveBreakpoint = useEditorStore(s => s.setActiveBreakpoint)
  const canvas             = useEditorStore(s => s.canvas)
  const setCanvas          = useEditorStore(s => s.setCanvas)
  const editingComponentId = useEditorStore(s => s.editingComponentId)
  const elements           = useEditorStore(s => s.elements)

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

  const zoomPercent = Math.round(canvas.scale * 100)

  const handleBreakpoint = (bp: Breakpoint) => {
    setActiveBreakpoint(bp)
    setCanvas({ scale: bp === 'mobile' ? 0.6 : bp === 'tablet' ? 0.75 : 1 })
  }

  const handleZoomPreset = (pct: number) => {
    setCanvas({ scale: pct / 100 })
    setShowZoomMenu(false)
  }

  const show = (id: string) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => setTooltip(id), DELAY.hoverIntent)
  }

  const hide = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip(null)
  }

  const btnBase = (isActive: boolean): React.CSSProperties => ({
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, border: 'none', cursor: 'pointer',
    background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
    position: 'relative',
    transition: 'background var(--duration-instant), color var(--duration-instant)',
  })

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
    whiteSpace: 'nowrap', zIndex: 1000,
  }

  return (
    <>
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 8,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        height: 40,
        padding: '0 6px',
        gap: 0,
        borderRadius: 10,
        background: 'rgba(22,22,22,0.85)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {TOOLS.map(tool => (
            <div key={tool.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTool(tool.id)}
                style={btnBase(activeTool === tool.id)}
                onMouseEnter={e => {
                  show(tool.id)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={e => {
                  hide()
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }
                }}
              >
                {tool.icon}
                {activeTool === tool.id && (
                  <div style={{
                    position: 'absolute', bottom: 3, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 10, height: 2, borderRadius: 1,
                    background: 'var(--accent)',
                  }} />
                )}
              </button>
              {tooltip === tool.id && (
                <div className="framer-tooltip" style={tooltipStyle}>
                  {tool.label}
                  <span className="shortcut">{tool.shortcut}</span>
                </div>
              )}
            </div>
          ))}

        {/* Undo / Redo */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => undo()}
            disabled={!canUndo()}
            style={{
              ...btnBase(false), opacity: canUndo() ? 1 : 0.3, cursor: canUndo() ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { show('undo'); e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { hide(); e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <Undo size={13} strokeWidth={1.8} />
          </button>
          {tooltip === 'undo' && (
            <div className="framer-tooltip" style={tooltipStyle}>
              Undo <span className="shortcut">⌘Z</span>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => redo()}
            disabled={!canRedo()}
            style={{
              ...btnBase(false), opacity: canRedo() ? 1 : 0.3, cursor: canRedo() ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { show('redo'); e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { hide(); e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <Redo size={13} strokeWidth={1.8} />
          </button>
          {tooltip === 'redo' && (
            <div className="framer-tooltip" style={tooltipStyle}>
              Redo <span className="shortcut">⌘⇧Z</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)', marginInline: 3 }} />

        {/* Hand tool */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveTool(activeTool === 'hand' ? 'select' : 'hand')}
              style={btnBase(activeTool === 'hand')}
              onMouseEnter={e => {
                show('hand')
                if (activeTool !== 'hand') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
              onMouseLeave={e => {
                hide()
                if (activeTool !== 'hand') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <Hand size={14} strokeWidth={1.8} />
              {activeTool === 'hand' && (
                <div style={{
                  position: 'absolute', bottom: 3, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 10, height: 2, borderRadius: 1,
                  background: 'var(--accent)',
                }} />
              )}
            </button>
            {tooltip === 'hand' && (
              <div className="framer-tooltip" style={tooltipStyle}>
                Hand
                <span className="shortcut">H</span>
              </div>
            )}
          </div>
        </div>

        {/* Component editing indicator */}
        {editingComponentId && elements[editingComponentId] && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 8px', height: 24,
              fontSize: 10, fontWeight: 500,
              color: 'var(--accent)',
              fontFamily: 'var(--font-ui)',
              background: 'var(--accent-dim)',
              borderRadius: 4,
            }}>
              <Component size={11} strokeWidth={1.6} />
              {elements[editingComponentId]?.name}
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--border)', marginInline: 6 }} />
          </>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', marginInline: 6 }} />

        {/* Breakpoints — Framer segmented control */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 6,
          padding: 2,
        }}>
          {BREAKPOINTS.map(bp => {
            const active = activeBreakpoint === bp.id
            const icons: Record<string, React.ReactNode> = {
              desktop: <Monitor size={11} strokeWidth={1.6} />,
              tablet: <Tablet size={11} strokeWidth={1.6} />,
              mobile: <Smartphone size={11} strokeWidth={1.6} />,
            }
            return (
              <button
                key={bp.id}
                onClick={() => handleBreakpoint(bp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', height: 24, borderRadius: 4,
                  border: 'none', cursor: 'pointer',
                  background: active ? 'var(--surface-2)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: 10, fontWeight: active ? 500 : 400,
                  fontFamily: 'var(--font-ui)',
                  transition: 'background var(--duration-instant), color var(--duration-instant)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-tertiary)' }}
              >
                {icons[bp.id]}
                <span style={{ letterSpacing: '0.02em' }}>{bp.width}</span>
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* Save status */}
          {saveStatus !== 'saved' && (
            <span style={{
              fontSize: 10, color: saveStatus === 'saving' ? 'var(--text-tertiary)' : 'var(--text-muted)',
              marginRight: 2, minWidth: 14, textAlign: 'center',
            }}>
              {saveStatus === 'saving' ? '…' : '!'}
            </span>
          )}

          {/* Zoom dropdown */}
          <div ref={zoomMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 2,
                padding: '0 6px', height: 24, borderRadius: 4,
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 10, fontFamily: 'var(--font-ui)',
                transition: 'color var(--duration-instant)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { if (!showZoomMenu) e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              <span style={{ minWidth: 28, textAlign: 'right', letterSpacing: '0.02em' }}>{zoomPercent}%</span>
              <ChevronDown size={10} strokeWidth={1.6} />
            </button>
            {showZoomMenu && (
              <div style={{
                position: 'absolute', top: 30, right: 0, zIndex: 100,
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                padding: 4,
                boxShadow: 'var(--shadow-dropdown)',
                minWidth: 80,
              }}>
                {ZOOM_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => handleZoomPreset(pct)}
                    style={{
                      width: '100%', padding: '4px 12px', height: 24,
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      background: zoomPercent === pct ? 'var(--accent-bg)' : 'transparent',
                      color: zoomPercent === pct ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 11, textAlign: 'right',
                      fontFamily: 'var(--font-ui)',
                      display: 'flex', justifyContent: 'space-between', gap: 16,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = zoomPercent === pct ? 'var(--accent-bg)' : 'transparent' }}
                  >
                    <span>{pct}%</span>
                    {zoomPercent === pct && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                <button
                  onClick={() => { setCanvas({ scale: 1 }); setShowZoomMenu(false) }}
                  style={{
                    width: '100%', padding: '4px 12px', height: 24,
                    border: 'none', borderRadius: 4, cursor: 'pointer',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 11, textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {previewMode ? (
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', height: 28, borderRadius: 6,
                border: 'none', background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: 11,
                fontWeight: 500, fontFamily: 'var(--font-ui)',
                transition: 'background var(--duration-instant)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            >
              <X size={12} strokeWidth={2} /> Exit
            </button>
          ) : (
            <button
              onClick={() => setPreviewMode(true)}
              title="Preview"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: 'var(--text-tertiary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                transition: 'color var(--duration-instant)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              <Play size={13} strokeWidth={2} />
            </button>
          )}

          {/* User avatar */}
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 600, color: 'var(--text-inverse)',
            flexShrink: 0, cursor: 'pointer',
            letterSpacing: '0.02em',
            marginLeft: 4,
          }}>
            {userInitials}
          </div>

          {/* Publish button */}
          <button
            onClick={() => setShowPublish(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', height: 26, borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: 'var(--text-inverse)',
              cursor: 'pointer', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.01em',
              fontFamily: 'var(--font-ui)',
              transition: 'background var(--duration-instant)',
              marginLeft: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            <Play size={9} style={{ fill: 'var(--text-inverse)', flexShrink: 0 }} />
            Publish
          </button>
        </div>
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </>
  )
}
