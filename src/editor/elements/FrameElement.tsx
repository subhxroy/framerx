import type { ReactNode } from 'react'
import type { Element } from '@/store/editorStore'
import { getBorderRadiusCSS, getBoxShadowCSS, getBorderStyles } from '@/lib/elementStyle'

interface Props {
  element: Element
  children?: ReactNode
}

const alignMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
}

function buildFilter(style: Element['style']): string {
  const parts: string[] = []
  if (style.blur && style.blur > 0) parts.push(`blur(${style.blur}px)`)
  return parts.join(' ') || 'none'
}

function buildBackdropFilter(style: Element['style']): string {
  if (style.backdropBlur && style.backdropBlur > 0) return `blur(${style.backdropBlur}px)`
  return 'none'
}

export default function FrameElement({ element, children }: Props) {
  const al = element.autoLayout
  const s = element.style
  const radius = getBorderRadiusCSS(s)
  const boxShadow = getBoxShadowCSS(s)
  const filter = buildFilter(s)
  const backdropFilter = buildBackdropFilter(s)

  // A "hug" axis must size to its content rather than fill the wrapper.
  const wHug = element.sizing?.width === 'hug'
  const hHug = element.sizing?.height === 'hug'
  const sizeStyle: React.CSSProperties = {
    width: wHug ? 'fit-content' : '100%',
    height: hHug ? 'fit-content' : '100%',
  }

  const borderStyles = getBorderStyles(s)

  const sharedStyle: React.CSSProperties = {
    backgroundColor: s.backgroundColor || 'transparent',
    borderRadius: radius,
    ...borderStyles,
    boxShadow,
    overflow: s.overflow || 'visible',
    filter: filter !== 'none' ? filter : undefined,
    backdropFilter: backdropFilter !== 'none' ? backdropFilter : undefined,
    WebkitBackdropFilter: backdropFilter !== 'none' ? backdropFilter : undefined,
  }

  if (al?.enabled) {
    return (
      <div
        style={{
          ...sizeStyle,
          display: 'flex',
          flexDirection: al.direction === 'horizontal' ? 'row' : al.direction === 'horizontal-reverse' ? 'row-reverse' : al.direction === 'vertical-reverse' ? 'column-reverse' : 'column',
          gap: al.gap,
          padding: `${al.padding.top}px ${al.padding.right}px ${al.padding.bottom}px ${al.padding.left}px`,
          alignItems: alignMap[al.alignItems] ?? 'stretch',
          justifyContent: alignMap[al.justifyContent] ?? 'flex-start',
          flexWrap: al.wrap ? 'wrap' : 'nowrap',
          minHeight: 0,
          minWidth: 0,
          ...sharedStyle,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div style={{ ...sizeStyle, ...sharedStyle }}>
      {children}
    </div>
  )
}
