import type { Element } from '@/store/editorStore'

export interface DesignTokens {
  colors: string[]
  fontSizes: number[]
  fontWeights: number[]
  spacingValues: number[]
  borderRadiusValues: number[]
}

function hexNormalize(c: string): string {
  if (!c || typeof c !== 'string') return ''
  let h = c.trim().toLowerCase()
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-f]{6}$/.test(h)) return ''
  return '#' + h
}

export function extractDesignTokens(elements: Record<string, Element>): DesignTokens {
  const colorCount = new Map<string, number>()
  const fontSizeCount = new Map<number, number>()
  const fontWeightCount = new Map<number, number>()
  const spacingCount = new Map<number, number>()
  const borderRadiusCount = new Map<number, number>()

  const inc = (map: Map<number, number>, val: number) => {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return
    const rounded = Math.round(val * 10) / 10
    map.set(rounded, (map.get(rounded) ?? 0) + 1)
  }

  const incColor = (c: string | undefined) => {
    if (!c) return
    const n = hexNormalize(c)
    if (!n) return
    colorCount.set(n, (colorCount.get(n) ?? 0) + 1)
  }

  const incSpacing = (v: number) => {
    if (typeof v !== 'number' || isNaN(v)) return
    const nearest4 = Math.round(v / 4) * 4
    if (nearest4 >= 0 && nearest4 <= 1600) {
      spacingCount.set(nearest4, (spacingCount.get(nearest4) ?? 0) + 1)
    }
  }

  for (const el of Object.values(elements)) {
    if (el.style) {
      incColor(el.style.backgroundColor)
      incColor(el.style.borderColor)
      if (el.style.borderRadius) inc(borderRadiusCount, el.style.borderRadius)
    }
    if (el.text) {
      incColor(el.text.color)
      inc(fontSizeCount, el.text.fontSize)
      inc(fontWeightCount, el.text.fontWeight)
    }
    incSpacing(el.x)
    incSpacing(el.y)
    incSpacing(el.width)
    incSpacing(el.height)
  }

  const sortByFreq = (map: Map<number, number>): number[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 6)
      .map(([k]) => k)

  const colors = [...colorCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([c]) => c)

  return {
    colors,
    fontSizes: sortByFreq(fontSizeCount),
    fontWeights: sortByFreq(fontWeightCount),
    spacingValues: sortByFreq(spacingCount),
    borderRadiusValues: sortByFreq(borderRadiusCount),
  }
}
