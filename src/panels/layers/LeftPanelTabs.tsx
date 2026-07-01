import { Plus } from 'lucide-react'

export type PanelTab = 'layers' | 'components' | 'assets' | 'cms' | 'history' | 'transform'

interface Props {
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'layers',     label: 'Layers' },
  { id: 'components', label: 'Components' },
  { id: 'assets',     label: 'Assets' },
  { id: 'cms',        label: 'CMS' },
  { id: 'history',    label: 'History' },
  { id: 'transform',  label: 'Transform' },
]

export default function LeftPanelTabs({ activeTab, onTabChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 32,
      borderBottom: '1px solid var(--border)',
      background: 'var(--panel-bg)',
      flexShrink: 0,
      paddingInline: 6,
      gap: 1,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              height: 24,
              paddingInline: 8,
              borderRadius: 4,
              border: 'none',
              background: isActive ? 'var(--surface-3)' : 'transparent',
              color: isActive ? '#e0e0e0' : '#555',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 500 : 400,
              fontFamily: 'var(--font-ui)',
              transition: 'all 80ms',
              whiteSpace: 'nowrap',
              letterSpacing: '0.005em',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#999'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#555'
              }
            }}
          >
            {tab.label}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      <button
        style={{
          width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4, border: 'none',
          background: 'transparent', color: '#333',
          cursor: 'pointer', transition: 'all 80ms',
          flexShrink: 0,
        }}
        title="Add"
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#888' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333' }}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
