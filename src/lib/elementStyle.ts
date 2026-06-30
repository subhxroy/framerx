import type { Element, ShadowDef } from '@/store/editorStore'

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
    .map((s: ShadowDef) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
    .join(', ')
}
