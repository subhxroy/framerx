import { Component } from 'lucide-react'

interface Props {
  elementId: string
  scale?: number
}

export default function InstanceBadge({ elementId, scale = 1 }: Props) {
  const s = 1 / Math.max(scale, 0.1)

  return (
    <div
      data-instance-badge={elementId}
      style={{
        position: 'absolute',
        top: 4 * s,
        left: 4 * s,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4 * s,
        padding: `${1 * s}px ${4 * s}px`,
        borderRadius: 'var(--radius-xs)',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        fontSize: Math.round(8 * s),
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        pointerEvents: 'none',
        lineHeight: `${Math.round(12 * s)}px`,
        opacity: 0,
        transition: 'opacity 120ms ease',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Component size={Math.round(8 * s)} strokeWidth={1.5} />
      Instance
    </div>
  )
}
