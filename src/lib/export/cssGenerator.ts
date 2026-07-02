import type { Element, Interaction } from '@/store/editorStore'
import { getBorderRadiusCSS, getBoxShadowCSS } from '@/lib/elementStyle'

export interface GeneratedCSS {
  base: string
  tabletMedia: string
  mobileMedia: string
  animations: string
}

function elClass(id: string) {
  return `.e${id.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12)}`
}

function cssProps(styles: Record<string, string | number | undefined>): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n  ')
}

function fillsToBackground(style: Element['style']): string | undefined {
  const fills: any[] = (style as any).fills
  if (fills && fills.length > 0) {
    const parts = fills.filter((f: any) => f.visible).map((f: any) => {
      if (f.type === 'solid') return f.color
      if (f.type === 'linear-gradient') {
        const stops = (f.stops ?? []).map((s: any) => `${s.color} ${s.position}%`).join(', ')
        return `linear-gradient(${f.angle ?? 135}deg, ${stops})`
      }
      if (f.type === 'radial-gradient') {
        const stops = (f.stops ?? []).map((s: any) => `${s.color} ${s.position}%`).join(', ')
        return `radial-gradient(ellipse at center, ${stops})`
      }
      return f.color
    })
    return parts.join(', ') || undefined
  }
  return style.backgroundColor || undefined
}

function buildBaseStyles(el: Element, flow = false): Record<string, string | number | undefined> {
  const s: Record<string, string | number | undefined> = flow
    ? {
        position: 'relative',
        width: `${el.width}px`,
        height: `${el.height}px`,
        'flex-shrink': 0,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        opacity: el.opacity,
      }
    : {
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${el.width}px`,
        height: `${el.height}px`,
        transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)`,
        'transform-origin': '0 0',
        opacity: el.opacity,
      }

  // Background (multi-fill aware)
  const bg = fillsToBackground(el.style)
  if (bg && bg !== 'transparent') s.background = bg

  const radius = getBorderRadiusCSS(el.style)
  if (radius) s['border-radius'] = typeof radius === 'number' ? `${radius}px` : radius
  if (el.style.border) s.border = el.style.border

  // Structured border
  if ((el.style as any).borderWidth && (el.style as any).borderColor) {
    s.border = `${(el.style as any).borderWidth}px ${(el.style as any).borderStyle || 'solid'} ${(el.style as any).borderColor}`
  }

  const shadow = getBoxShadowCSS(el.style)
  if (shadow) s['box-shadow'] = shadow
  if (el.style.overflow) s.overflow = el.style.overflow

  // Blur
  if ((el.style as any).blur) s.filter = `blur(${(el.style as any).blur}px)`
  if ((el.style as any).backdropBlur) {
    s['backdrop-filter'] = `blur(${(el.style as any).backdropBlur}px)`
    s['-webkit-backdrop-filter'] = `blur(${(el.style as any).backdropBlur}px)`
  }

  if (el.autoLayout?.enabled) {
    s.display = 'flex'
    s['flex-direction'] = el.autoLayout.direction === 'horizontal' ? 'row' : 'column'
    s.gap = `${el.autoLayout.gap}px`
    s.padding = `${el.autoLayout.padding.top}px ${el.autoLayout.padding.right}px ${el.autoLayout.padding.bottom}px ${el.autoLayout.padding.left}px`
    s['align-items'] = el.autoLayout.alignItems
    s['justify-content'] = el.autoLayout.justifyContent
    if (el.autoLayout.wrap) s['flex-wrap'] = 'wrap'
  }

  if (el.text) {
    if ((el.text as any).fontFamily) s['font-family'] = `'${(el.text as any).fontFamily}', sans-serif`
    s['font-size'] = `${el.text.fontSize}px`
    s['font-weight'] = el.text.fontWeight
    s.color = el.text.color
    s['text-align'] = el.text.textAlign
    s['line-height'] = el.text.lineHeight
    s['letter-spacing'] = `${el.text.letterSpacing}px`
    if ((el.text as any).textTransform && (el.text as any).textTransform !== 'none') {
      s['text-transform'] = (el.text as any).textTransform
    }
    s.overflow = 'hidden'
    s['white-space'] = 'pre-wrap'
    s['word-break'] = 'break-word'
  }

  return s
}

function buildOverrideStyles(el: Element, bp: 'tablet' | 'mobile'): Record<string, string | number | undefined> {
  const o = el.breakpoints?.[bp]
  if (!o) return {}

  const s: Record<string, string | number | undefined> = {}

  if (o.width !== undefined) s.width = `${o.width}px`
  if (o.height !== undefined) s.height = `${o.height}px`
  if (o.x !== undefined || o.y !== undefined || o.rotation !== undefined) {
    const tx = o.x ?? el.x
    const ty = o.y ?? el.y
    const rot = o.rotation ?? el.rotation
    s.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`
  }
  if (o.opacity !== undefined) s.opacity = o.opacity
  if (o.visible === false) s.display = 'none'

  return s
}

function buildAnimationCSS(id: string, interactions?: Interaction[]): string {
  if (!interactions || interactions.length === 0) return ''
  let css = ''

  for (const int of interactions) {
    if (!int.animation) continue
    const anim = int.animation
    const cls = elClass(id)
    const dur = int.transition?.duration ?? 0.2
    const easing = int.transition?.type === 'spring' ? `cubic-bezier(0.175, 0.885, 0.32, 1.275)` : (int.transition?.easing ?? 'ease-out')

    if (int.trigger === 'appear') {
      const fromProps: string[] = []
      const toProps: string[] = []
      for (const [prop, [from, to]] of Object.entries(anim)) {
        if (from !== undefined) fromProps.push(`${prop}: ${from}`)
        if (to !== undefined) toProps.push(`${prop}: ${to}`)
      }
      css += `\n@keyframes anim_${id} {\n  from { ${fromProps.join('; ')} }\n  to { ${toProps.join('; ')} }\n}\n`
      css += `${cls} {\n  animation: anim_${id} ${dur}s ${easing} forwards;\n}\n`
    }

    if (int.trigger === 'hover') {
      const props: string[] = []
      for (const [prop, [, to]] of Object.entries(anim)) {
        if (to !== undefined) props.push(`${prop}: ${to}`)
      }
      css += `${cls} {\n  transition: all ${dur}s ${easing};\n}\n`
      css += `${cls}:hover {\n  ${props.join('; ')};\n}\n`
    }

    if (int.trigger === 'tap') {
      const props: string[] = []
      for (const [prop, [, to]] of Object.entries(anim)) {
        if (to !== undefined) props.push(`${prop}: ${to}`)
      }
      css += `${cls} {\n  transition: all ${dur}s ${easing};\n}\n`
      css += `${cls}:active {\n  ${props.join('; ')};\n}\n`
    }
  }

  return css
}

export function generateCSS(
  elements: Record<string, Element>,
  rootIds: string[],
  includeAnimations = true,
  skipVisibilityCheck = false
): GeneratedCSS {
  const base: string[] = []
  const tabletOverrides: string[] = []
  const mobileOverrides: string[] = []
  const animParts: string[] = []

  function walk(id: string, parentFlow = false, skipVisibility = false) {
    const el = elements[id]
    if (!el || (!skipVisibility && !el.visible)) return

    const cls = elClass(id)
    const baseS = buildBaseStyles(el, parentFlow)
    base.push(`${cls} {\n  ${cssProps(baseS)}\n}`)

    const tabletS = buildOverrideStyles(el, 'tablet')
    if (Object.keys(tabletS).length > 0) {
      tabletOverrides.push(`${cls} {\n  ${cssProps(tabletS)}\n}`)
    }

    const mobileS = buildOverrideStyles(el, 'mobile')
    if (Object.keys(mobileS).length > 0) {
      mobileOverrides.push(`${cls} {\n  ${cssProps(mobileS)}\n}`)
    }

    if (includeAnimations && el.interactions) {
      const a = buildAnimationCSS(id, el.interactions)
      if (a) animParts.push(a)
    }

    const childFlow = !!el.autoLayout?.enabled
    for (const cid of el.children || []) {
      walk(cid, childFlow, skipVisibility)
    }
  }

  for (const rid of rootIds) walk(rid, false, skipVisibilityCheck)

  return {
    base: base.join('\n\n'),
    tabletMedia: tabletOverrides.length > 0
      ? `@media (max-width: 768px) {\n${tabletOverrides.join('\n\n')}\n}`
      : '',
    mobileMedia: mobileOverrides.length > 0
      ? `@media (max-width: 390px) {\n${mobileOverrides.join('\n\n')}\n}`
      : '',
    animations: animParts.join('\n'),
  }
}
