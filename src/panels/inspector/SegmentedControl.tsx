import { motion } from 'motion/react'
import { SPRING } from '@/lib/motionTokens'

export interface SegmentedOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface Props {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
}

export default function SegmentedControl({ options, value, onChange }: Props) {
  return (
    <div style={{
      display: 'flex', gap: 2,
      background: 'var(--surface-1)',
      borderRadius: 6, padding: 2,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, height: 24,
            borderRadius: 4, border: 'none',
            background: 'transparent',
            color: value === opt.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: 10,
            fontFamily: 'var(--font-ui)', fontWeight: 500,
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'color var(--duration-instant)',
          }}
        >
          {opt.icon}
          {opt.label}
          {value === opt.value && (
            <motion.div
              layoutId="segmented-pill"
              style={{
                position: 'absolute', inset: 0, zIndex: -1,
                background: 'var(--surface-3)',
                borderRadius: 4,
              }}
              transition={SPRING.snappy}
            />
          )}
        </button>
      ))}
    </div>
  )
}
