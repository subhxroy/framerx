import { Plus } from 'lucide-react'

export type PanelTab = 'layers' | 'components' | 'assets' | 'cms'

interface Props {
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'layers',     label: 'Layers' },
  { id: 'components', label: 'Components' },
  { id: 'assets',     label: 'Assets' },
  { id: 'cms',        label: 'CMS' },
]

export default function LeftPanelTabs({ activeTab, onTabChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 36,
      borderBottom: '1px solid var(--border)',
      background: 'var(--panel-bg)',
      flexShrink: 0,
      paddingLeft: 4,
      paddingRight: 4,
      gap: 0,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              height: 28,
              paddingInline: 8,
              borderRadius: 5,
              border: 'none',
              background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? '#e0e0e0' : '#4a4a4a',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 500 : 400,
              fontFamily: 'var(--font-ui)',
              transition: 'background 80ms, color 80ms',
              whiteSpace: 'nowrap',
              letterSpacing: '0.005em',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#888'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#4a4a4a'
              }
            }}
          >
            {tab.label}
          </button>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Add page / section button */}
      <button
        style={{
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4, border: 'none',
          background: 'transparent', color: '#3a3a3a',
          cursor: 'pointer', transition: 'background 80ms, color 80ms',
          flexShrink: 0,
        }}
        title="Add"
        onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#888' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a3a3a' }}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
