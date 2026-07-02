import { Layers, Component, ImageIcon, Database, WandSparkles } from 'lucide-react'
import type { PanelTab } from '@/store/uiStore'
import { DURATION } from '@/lib/motionTokens'

interface Props {
  activeTab: PanelTab | null
  onTabChange: (tab: PanelTab) => void
}

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'layers',     label: 'Layers',     icon: <Layers size={16} strokeWidth={1.5} /> },
  { id: 'assets',     label: 'Assets',     icon: <ImageIcon size={16} strokeWidth={1.5} /> },
  { id: 'components', label: 'Components', icon: <Component size={16} strokeWidth={1.5} /> },
  { id: 'cms',        label: 'CMS',        icon: <Database size={16} strokeWidth={1.5} /> },
  { id: 'copilot',    label: 'AI Copilot', icon: <WandSparkles size={16} strokeWidth={1.5} /> },
]

export default function LeftPanelRail({ activeTab, onTabChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'var(--left-rail-width)',
      height: '100%',
      background: 'var(--app-bg)',
      borderRight: '0.5px solid var(--border)',
      flexShrink: 0,
      paddingTop: 12,
      gap: 8,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
              border: 'none',
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: `all ${DURATION.instant}s`,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }
            }}
          >
            {tab.icon}
          </button>
        )
      })}
      <div style={{ flex: 1 }} />
    </div>
  )
}
