import { useState, useRef } from 'react'
import { Layers, Component, ImageIcon, Database, WandSparkles } from 'lucide-react'
import type { PanelTab } from '@/store/uiStore'
import { DELAY } from '@/lib/motionTokens'

interface Props {
  activeTab: PanelTab | null
  onTabChange: (tab: PanelTab) => void
}

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'layers',     label: 'Layers',     icon: <Layers size={16} strokeWidth={1.5} /> },
  { id: 'assets',     label: 'Assets',     icon: <ImageIcon size={16} strokeWidth={1.5} /> },
  { id: 'components', label: 'Components', icon: <Component size={16} strokeWidth={1.5} /> },
  { id: 'cms',        label: 'CMS',        icon: <Database size={16} strokeWidth={1.5} /> },
  { id: 'copilot',    label: 'Copilot',    icon: <WandSparkles size={16} strokeWidth={1.5} /> },
]

export default function LeftPanelRail({ activeTab, onTabChange }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = (id: string) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => setTooltip(id), DELAY.hoverIntent)
  }

  const hide = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltip(null)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: 'var(--left-rail-width)',
      height: '100%',
      background: 'var(--surface-0)',
      borderRight: '1px solid var(--border)',
      flexShrink: 0,
      paddingTop: 8,
      gap: 2,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <div key={tab.id} style={{ position: 'relative' }}>
            <button
              onClick={() => onTabChange(tab.id)}
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: 'none',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background var(--duration-instant) var(--ease-ui), color var(--duration-instant) var(--ease-ui)',
              }}
              onMouseEnter={() => { show(tab.id); if (!isActive) { } }}
              onMouseLeave={hide}
            >
              {tab.icon}
              {isActive && (
                <div style={{
                  position: 'absolute', left: -10, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 2, height: 16, borderRadius: 1,
                  background: 'var(--accent)',
                }} />
              )}
            </button>
            {tooltip === tab.id && (
              <div style={{
                position: 'fixed', left: 50, top: 'auto',
                pointerEvents: 'none', zIndex: 10000,
                marginTop: -14,
              }}>
                <div className="framer-tooltip" style={{ position: 'relative' }}>
                  {tab.label}
                </div>
              </div>
            )}
          </div>
        )
      })}
      <div style={{ flex: 1 }} />
    </div>
  )
}
