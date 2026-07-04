import type { Element, ShadowDef, BorderDef } from '@/store/editorStore'

type Style = Element['style']

/**
 * Border-radius CSS value. Returns a 4-value string when independent corners
 * are set, otherwise the uniform radius (number → px). Order: TL TR BR BL.
 */
export function getBorderRadiusCSS(style: Style): string | number {
  const c = style.borderRadiusCorners
  if (c && c.some((v, i) => v !== c[0] || i === 0) && c.some((v) => v > 0)) {
    // emit only when at least one corner differs or is non-zero
    if (c[0] === c[1] && c[1] === c[2] && c[2] === c[3]) return c[0]
    return `${c[0]}px ${c[1]}px ${c[2]}px ${c[3]}px`
  }
  return style.borderRadius ?? 0
}

/** Convert the shadow stack to a CSS box-shadow string (undefined when empty). */
export function getBoxShadowCSS(style: Style): string | undefined {
  const shadows = style.boxShadow
  if (!shadows || shadows.length === 0) return undefined
  return shadows
    .map((s: ShadowDef) => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
    .join(', ')
}

function sideToString(side: BorderDef['top']): string {
  return `${side.width}px ${side.style} ${side.color}`
}

function isUniformBorder(b: BorderDef): boolean {
  return (
    b.top.width === b.right.width && b.right.width === b.bottom.width && b.bottom.width === b.left.width &&
    b.top.color === b.right.color && b.right.color === b.bottom.color && b.bottom.color === b.left.color &&
    b.top.style === b.right.style && b.right.style === b.bottom.style && b.bottom.style === b.left.style
  )
}

/**
 * Compute border CSS properties from the BorderDef array. Returns an object
 * with either a single `border` (when uniform or legacy) or individual
 * `borderTop/Right/Bottom/Left` properties. Falls back to the legacy
 * `style.border` string when no BorderDef array exists.
 */
export function getBorderStyles(style: Style): React.CSSProperties {
  const borders = style.borders
  if (borders && borders.length > 0) {
    const visible = borders.filter((b) => b.visible)
    if (visible.length > 0) {
      const b = visible[0]
      if (isUniformBorder(b)) {
        return { border: sideToString(b.top) }
      }
      return {
        borderTop: sideToString(b.top),
        borderRight: sideToString(b.right),
        borderBottom: sideToString(b.bottom),
        borderLeft: sideToString(b.left),
      }
    }
    return { border: 'none' }
  }
  return { border: style.border || 'none' }
}
