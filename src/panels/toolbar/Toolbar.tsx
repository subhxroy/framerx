import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Tool, Breakpoint } from '@/store/editorStore'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { useAuthStore } from '@/store/authStore'
import PublishModal from '@/panels/publish/PublishModal'
import type { SaveStatus } from '@/hooks/useAutoSave'
import {
  MousePointer2, Square, Type, Image as ImageIcon,
  Circle, Play, Eye, X, Monitor, Tablet,
  Smartphone, Hand,
} from 'lucide-react'
import { DURATION, DELAY } from '@/lib/motionTokens'

const TOOLS: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'select',  label: 'Select',    shortcut: 'V', icon: <MousePointer2 size={15} strokeWidth={1.5} /> },
  { id: 'frame',   label: 'Frame',     shortcut: 'F', icon: <Square size={15} strokeWidth={1.5} strokeDasharray="3 2" /> },
  { id: 'text',    label: 'Text',      shortcut: 'T', icon: <Type size={15} strokeWidth={1.5} /> },
  { id: 'image',   label: 'Image',     shortcut: 'I', icon: <ImageIcon size={15} strokeWidth={1.5} /> },
  { id: 'rect',    label: 'Rectangle', shortcut: 'R', icon: <Square size={15} strokeWidth={1.5} /> },
  { id: 'ellipse', label: 'Ellipse',   shortcut: 'O', icon: <Circle size={15} strokeWidth={1.5} /> },
]

const BREAKPOINTS: { id: Breakpoint; label: string; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', icon: <Monitor size={12} strokeWidth={1.5} /> },
  { id: 'tablet',  label: 'Tablet',  icon: <Tablet size={12} strokeWidth={1.5} /> },
  { id: 'mobile',  label: 'Phone',   icon: <Smartphone size={12} strokeWidth={1.5} /> },
]

const TOOLTIP_DURATION = DURATION.instant

interface Props {
  saveStatus?: SaveStatus
}

export default function Toolbar({ saveStatus = 'saved' }: Props) {
  const [showPublish, setShowPublish] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)
  let tooltipTimer: ReturnType<typeof setTimeout> | undefined

  const activeTool         = useEditorStore(s => s.activeTool)
  const setActiveTool      = useEditorStore(s => s.setActiveTool)
  const previewMode        = useEditorStore(s => s.previewMode)
  const setPreviewMode     = useEditorStore(s => s.setPreviewMode)
  const activeBreakpoint   = useEditorStore(s => s.activeBreakpoint)
  const setActiveBreakpoint = useEditorStore(s => s.setActiveBreakpoint)
  const setCanvas          = useEditorStore(s => s.setCanvas)

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

  const handleBreakpoint = (bp: Breakpoint) => {
    setActiveBreakpoint(bp)
    setCanvas({ scale: bp === 'mobile' ? 0.6 : bp === 'tablet' ? 0.75 : 1 })
  }

  const showTooltip = (id: string) => {
    if (tooltipTimer) clearTimeout(tooltipTimer)
    tooltipTimer = setTimeout(() => setTooltip(id), DELAY.hoverIntent)
  }

  const hideTooltip = () => {
    if (tooltipTimer) clearTimeout(tooltipTimer)
    setTooltip(null)
  }

  return (
    <>
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 12,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        height: 48,
        padding: '0 8px',
        gap: 0,
        borderRadius: 12,
        background: 'var(--panel-bg)',
        border: '0.5px solid var(--border-strong)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Breakpoints */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {BREAKPOINTS.map(bp => (
            <button
              key={bp.id}
              onClick={() => handleBreakpoint(bp.id)}
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeBreakpoint === bp.id ? 'var(--surface-3)' : 'transparent',
                color: activeBreakpoint === bp.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: `all ${TOOLTIP_DURATION}s`,
              }}
              title={bp.label}
              onMouseEnter={e => {
                if (activeBreakpoint !== bp.id) {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
              onMouseLeave={e => {
                if (activeBreakpoint !== bp.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              {bp.icon}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', marginInline: 4 }} />

        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {TOOLS.map(tool => (
            <div key={tool.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTool(tool.id)}
                style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: activeTool === tool.id ? 'var(--surface-3)' : 'transparent',
                  color: activeTool === tool.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  transition: `all ${TOOLTIP_DURATION}s`,
                }}
                onMouseEnter={e => {
                  showTooltip(tool.id)
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={e => {
                  hideTooltip()
                  if (activeTool !== tool.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }
                }}
              >
                {tool.icon}
              </button>
              {tooltip === tool.id && (
                <div className="framer-tooltip" style={{
                  position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
                }}>
                  {tool.label}
                  <span className="shortcut">{tool.shortcut}</span>
                </div>
              )}
            </div>
          ))}

          {/* Hand / pan tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'hand' ? 'select' : 'hand')}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTool === 'hand' ? 'var(--surface-3)' : 'transparent',
              color: activeTool === 'hand' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: `all ${TOOLTIP_DURATION}s`,
              marginLeft: 0,
            }}
            title="Pan (H)"
            onMouseEnter={e => {
              if (activeTool !== 'hand') {
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={e => {
              if (activeTool !== 'hand') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }
            }}
          >
            <Hand size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', marginInline: 4 }} />

        {/* Right side: Save status, Preview, Avatar, Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          {saveStatus !== 'saved' && (
            <span style={{
              fontSize: 10, color: saveStatus === 'saving' ? 'var(--text-tertiary)' : 'var(--warning)',
              marginRight: 2,
            }}>
              {saveStatus === 'saving' ? '…' : '●'}
            </span>
          )}

          {previewMode ? (
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', height: 28, borderRadius: 6,
                border: 'none', background: 'var(--surface-3)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: 11,
                fontWeight: 500, fontFamily: 'var(--font-ui)',
                transition: `all ${TOOLTIP_DURATION}s`,
              }}
            >
              <X size={11} /> Exit
            </button>
          ) : (
            <button
              onClick={() => setPreviewMode(true)}
              title="Preview (Ctrl+Shift+P)"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: 'var(--text-tertiary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${TOOLTIP_DURATION}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
            >
              <Eye size={15} strokeWidth={1.5} />
            </button>
          )}

          {/* User avatar */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600, color: 'var(--text-inverse)',
            flexShrink: 0, cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            {userInitials}
          </div>

          {/* Publish button */}
          <button
            onClick={() => setShowPublish(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', height: 28, borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: 'var(--text-inverse)',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.01em',
              fontFamily: 'var(--font-ui)',
              transition: `all ${TOOLTIP_DURATION}s`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            <Play size={10} style={{ fill: 'var(--text-inverse)', flexShrink: 0 }} />
            Publish
          </button>
        </div>
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </>
  )
}
