import { forwardRef } from 'react'
import type { CSSProperties, ReactNode, UIEvent } from 'react'
import { useScrollShadow } from '@/hooks/useScrollShadow'
import { toMs, DURATION } from '@/lib/motionTokens'

/**
 * A vertical scroll container that fades in subtle top/bottom shadows only
 * when there's more content to scroll in that direction. Wraps any scrollable
 * panel (Layers, Inspector, CMS table) to add the "considered" edge feel.
 */
interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Height of the gradient fade. Default 20px. */
  shadowSize?: number
  onScroll?: (e: UIEvent<HTMLDivElement>) => void
}

const ScrollArea = forwardRef<HTMLDivElement, Props>(function ScrollArea(
  { children, className, style, shadowSize = 20, onScroll },
  _ref
) {
  const { ref, top, bottom } = useScrollShadow<HTMLDivElement>()

  const fade = (edge: 'top' | 'bottom', visible: boolean): CSSProperties => ({
    position: 'absolute',
    left: 0,
    right: 0,
    [edge]: 0,
    height: shadowSize,
    pointerEvents: 'none',
    zIndex: 2,
    opacity: visible ? 1 : 0,
    transition: `opacity ${toMs(DURATION.fast)} var(--ease-ui)`,
    background:
      edge === 'top'
        ? 'linear-gradient(to bottom, var(--panel-bg), transparent)'
        : 'linear-gradient(to top, var(--panel-bg), transparent)',
  })

  return (
    <div style={{ position: 'relative', minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={fade('top', top)} />
      <div
        ref={ref}
        className={className}
        style={{ overflowY: 'auto', flex: 1, minHeight: 0, ...style }}
        onScroll={onScroll}
      >
        {children}
      </div>
      <div style={fade('bottom', bottom)} />
    </div>
  )
})

export default ScrollArea
