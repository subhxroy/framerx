import { ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { DURATION, toMs, toCssBezier, EASE } from '@/lib/motionTokens'

interface Props {
  id: string
  label: string
  children: React.ReactNode
  rightSlot?: React.ReactNode
  defaultOpen?: boolean
}

export default function InspectorSection({ id, label, children, rightSlot, defaultOpen = true }: Props) {
  const collapsed = useUIStore(s => s.collapsedSections[id])
  const toggle = useUIStore(s => s.toggleCollapsedSection)
  const isOpen = collapsed === undefined ? defaultOpen : !collapsed

  return (
    <div>
      <button
        onClick={() => toggle(id)}
        style={{
          display: 'flex', alignItems: 'center',
          height: 32, width: '100%',
          padding: '0 12px', gap: 6,
          background: 'transparent', border: 'none',
          borderTop: '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
          flexShrink: 0,
        }}
      >
        <ChevronRight
          size={10}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transform: `rotate(${isOpen ? 90 : 0}deg)`,
            transition: `transform ${toMs(DURATION.fast)} ${toCssBezier(EASE.standard)}`,
          }}
        />
        <span style={{
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          flex: 1, textAlign: 'left',
        }}>
          {label}
        </span>
        {rightSlot}
      </button>
      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: `grid-template-rows ${toMs(DURATION.base)} ${toCssBezier(EASE.standard)}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflow: 'hidden', padding: '8px 12px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
