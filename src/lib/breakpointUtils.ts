import type { Element, Breakpoint } from '@/store/editorStore'

export function getBPMerged(
  element: Element,
  bp: Breakpoint
): Element {
  if (bp === 'desktop') return element
  const overrides = element.breakpoints?.[bp]
  if (!overrides) return element

  return {
    ...element,
    ...(overrides.x !== undefined ? { x: overrides.x } : {}),
    ...(overrides.y !== undefined ? { y: overrides.y } : {}),
    ...(overrides.width !== undefined ? { width: overrides.width } : {}),
    ...(overrides.height !== undefined ? { height: overrides.height } : {}),
    ...(overrides.visible !== undefined ? { visible: overrides.visible } : {}),
    ...(overrides.opacity !== undefined ? { opacity: overrides.opacity } : {}),
    ...(overrides.rotation !== undefined ? { rotation: overrides.rotation } : {}),
  }
}

export function getBPValue(
  element: Element,
  bp: Breakpoint,
  field: string
): number | boolean | undefined {
  if (bp === 'desktop') return undefined
  const overrides = element.breakpoints?.[bp]
  if (!overrides) return undefined
  return (overrides as any)[field]
}

export function isOverridden(
  element: Element,
  bp: Breakpoint,
  field: string
): boolean {
  if (bp === 'desktop') return false
  const overrides = element.breakpoints?.[bp]
  if (!overrides) return false
  return (overrides as any)[field] !== undefined
}

export const breakpointWidths: Record<Breakpoint, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
}
