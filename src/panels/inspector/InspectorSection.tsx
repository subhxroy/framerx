import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '@/store/uiStore'
import { SPRING } from '@/lib/motionTokens'

// Category dot hues. Semantic ones come from the CSS var system; typography/
// cms use fixed category hues with no semantic var equivalent (decorative).
const CATEGORY_COLORS: Record<string, string> = {
  layout: 'var(--accent)',
  'auto-layout': 'var(--accent)',
  fill: 'var(--success)',
  image: 'var(--success)',
  border: 'var(--warning)',
  'border-radius': 'var(--warning)',
  shadow: 'var(--warning)',
  blur: 'var(--warning)',
  typography: '#5ac8fa',
  cms: '#af52de',
  'cms-binding': '#af52de',
  variants: 'var(--guide)',
  animation: 'var(--guide)',
  'scroll-animation': 'var(--guide)',
  interaction: 'var(--guide)',
}

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
  const catColor = CATEGORY_COLORS[id] ?? 'var(--text-muted)'

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
          transition: 'background var(--duration-normal) var(--ease-ui)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={SPRING.chrome}
          style={{ display: 'flex', color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <ChevronRight size={10} />
        </motion.span>
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
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING.chrome}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '8px 12px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
