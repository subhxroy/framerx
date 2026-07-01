import type { Element, Breakpoint, ShadowDef } from '@/store/editorStore'

/**
 * Merge an element's breakpoint overrides for a given viewport, with a proper
 * desktop-first CASCADE:
 *   desktop = base
 *   tablet  = desktop + tablet overrides
 *   mobile  = desktop + tablet overrides + mobile overrides   ← mobile inherits tablet
 *
 * So a value set only on tablet flows down to mobile (mobile shows the tablet
 * value unless mobile has its own override). Overrides are applied per-field;
 * fields that aren't explicitly set are never written (no undefined clobbering).
 */
export function getBPMerged(element: Element, bp: Breakpoint): Element {
  if (bp === 'desktop') return element

  const tablet = element.breakpoints?.tablet
  const mobile = element.breakpoints?.mobile
  // Cascade: mobile inherits the already-merged tablet overrides.
  const ov: BreakpointOverrides =
    bp === 'tablet'
      ? { ...(tablet ?? {}) }
      : { ...(tablet ?? {}), ...(mobile ?? {}) }

  if (Object.keys(ov).length === 0) return element

  const merged: Element = { ...element }

  // Geometry / top-level
  if (ov.x !== undefined) merged.x = ov.x
  if (ov.y !== undefined) merged.y = ov.y
  if (ov.width !== undefined) merged.width = ov.width
  if (ov.height !== undefined) merged.height = ov.height
  if (ov.visible !== undefined) merged.visible = ov.visible
  if (ov.opacity !== undefined) merged.opacity = ov.opacity
  if (ov.rotation !== undefined) merged.rotation = ov.rotation

  // Style overrides
  if (ov.backgroundColor !== undefined || ov.borderRadius !== undefined || ov.boxShadow !== undefined) {
    merged.style = {
      ...element.style,
      ...(ov.backgroundColor !== undefined ? { backgroundColor: ov.backgroundColor } : {}),
      ...(ov.borderRadius !== undefined ? { borderRadius: ov.borderRadius } : {}),
      ...(ov.boxShadow !== undefined ? { boxShadow: ov.boxShadow } : {}),
    }
  }

  // Text overrides (only if the element actually has text)
  if (element.text && (ov.fontSize !== undefined || ov.color !== undefined || ov.textAlign !== undefined)) {
    merged.text = {
      ...element.text,
      ...(ov.fontSize !== undefined ? { fontSize: ov.fontSize } : {}),
      ...(ov.color !== undefined ? { color: ov.color } : {}),
      ...(ov.textAlign !== undefined ? { textAlign: ov.textAlign } : {}),
    }
  }

  return merged
}

/** Raw value of a field's OWN override on a breakpoint (no cascade). */
export function getBPValue(
  element: Element,
  bp: Breakpoint,
  field: string
): number | boolean | string | undefined {
  if (bp === 'desktop') return undefined
  const overrides = element.breakpoints?.[bp as Exclude<Breakpoint, 'desktop'>]
  if (!overrides) return undefined
  return (overrides as any)[field]
}

/** True when this breakpoint has its OWN explicit override for the field (not inherited). */
export function isOverridden(
  element: Element,
  bp: Breakpoint,
  field: string
): boolean {
  if (bp === 'desktop') return false
  const overrides = element.breakpoints?.[bp as Exclude<Breakpoint, 'desktop'>]
  if (!overrides) return false
  return (overrides as any)[field] !== undefined
}

/** Pure helper: returns a new `breakpoints` map with `field` set on `bp`. */
export function withBPOverride(
  element: Element,
  bp: Breakpoint,
  field: string,
  value: number | boolean | string | ShadowDef[]
): Element['breakpoints'] {
  if (bp === 'desktop') return element.breakpoints
  const key = bp as Exclude<Breakpoint, 'desktop'>
  const cur: Record<string, any> = { ...(element.breakpoints?.[key] ?? {}) }
  cur[field] = value
  return { ...element.breakpoints, [key]: cur } as Element['breakpoints']
}

/** Pure helper: returns a new `breakpoints` map with `field` removed from `bp` (drops the bp if empty). */
export function withoutBPOverride(
  element: Element,
  bp: Breakpoint,
  field: string
): Element['breakpoints'] {
  if (bp === 'desktop') return element.breakpoints
  const key = bp as Exclude<Breakpoint, 'desktop'>
  const cur: Record<string, any> = { ...(element.breakpoints?.[key] ?? {}) }
  delete cur[field]
  const next: Record<string, any> = { ...element.breakpoints }
  if (Object.keys(cur).length === 0) delete next[key]
  else next[key] = cur
  return next as Element['breakpoints']
}

export const breakpointWidths: Record<Breakpoint, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
}

export interface BreakpointOverrides {
  // Geometry / visibility
  x?: number
  y?: number
  width?: number
  height?: number
  visible?: boolean
  opacity?: number
  rotation?: number
  // Style
  backgroundColor?: string
  borderRadius?: number
  boxShadow?: ShadowDef[]
  // Text
  fontSize?: number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}
