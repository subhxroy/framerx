import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { Breakpoint } from '@/store/editorStore'

const breakpoints: { id: Breakpoint; label: string; width: number; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', width: 1440, icon: <Monitor size={13} /> },
  { id: 'tablet',  label: 'Tablet',  width: 768,  icon: <Tablet size={13} /> },
  { id: 'mobile',  label: 'Mobile',  width: 390,  icon: <Smartphone size={13} /> },
]

export default function BreakpointBar() {
  const activeBreakpoint = useEditorStore(s => s.activeBreakpoint)
  const setActiveBreakpoint = useEditorStore(s => s.setActiveBreakpoint)
  const setCanvas = useEditorStore(s => s.setCanvas)

  const handleChange = (bp: Breakpoint) => {
    setActiveBreakpoint(bp)
    setCanvas({ x: 0, y: 0, scale: bp === 'mobile' ? 0.5 : bp === 'tablet' ? 0.7 : 1 })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
      height: 36, background: 'var(--toolbar-bg)',
      borderBottom: '1px solid var(--panel-border)', flexShrink: 0,
    }}>
      {breakpoints.map(bp => {
        const isActive = activeBreakpoint === bp.id
        return (
          <button
            key={bp.id}
            onClick={() => handleChange(bp.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 10px', height: 26, borderRadius: 5, border: 'none',
              background: isActive ? '#252525' : 'transparent',
              color: isActive ? '#e0e0e0' : '#555555',
              cursor: 'pointer', fontSize: 11, fontWeight: isActive ? 500 : 400,
              transition: 'all 0.1s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#8a8a8a' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#555555' }}
          >
            {bp.icon}
            {bp.label}
            <span style={{ color: isActive ? '#555' : '#333', fontSize: 10 }}>
              {bp.width}
            </span>
          </button>
        )
      })}
    </div>
  )
}
