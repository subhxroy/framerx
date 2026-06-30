import type { Element } from '@/store/editorStore'

// ─── CSS helpers ─────────────────────────────────────────────────────────────

function px(n: number | undefined, fallback = '0'): string {
  return n !== undefined && n !== 0 ? `${n}px` : fallback
}

function elementToCSS(el: Element): string {
  const s = el.style
  const rules: string[] = []

  // Position
  rules.push(`position: absolute;`)
  rules.push(`left: ${px(el.x)};`)
  rules.push(`top: ${px(el.y)};`)
  rules.push(`width: ${px(el.width)};`)
  rules.push(`height: ${px(el.height)};`)

  if (el.rotation) rules.push(`transform: rotate(${el.rotation}deg);`)
  if (el.opacity !== undefined && el.opacity !== 1) rules.push(`opacity: ${el.opacity};`)
  if (!el.visible) rules.push(`display: none;`)

  // Background
  const fills: any[] = (s as any).fills
  if (fills && fills.length > 0) {
    const css = fills.filter(f => f.visible).map((f: any) => {
      if (f.type === 'solid') return f.color
      if (f.type === 'linear-gradient') {
        const stops = (f.stops ?? []).map((st: any) => `${st.color} ${st.position}%`).join(', ')
        return `linear-gradient(${f.angle ?? 135}deg, ${stops})`
      }
      if (f.type === 'radial-gradient') {
        const stops = (f.stops ?? []).map((st: any) => `${st.color} ${st.position}%`).join(', ')
        return `radial-gradient(ellipse at center, ${stops})`
      }
      return f.color
    }).join(', ')
    if (css) rules.push(`background: ${css};`)
  } else if (s.backgroundColor && s.backgroundColor !== 'transparent') {
    rules.push(`background-color: ${s.backgroundColor};`)
  }

  // Border / stroke
  if (s.border) rules.push(`border: ${s.border};`)
  if ((s as any).borderWidth && (s as any).borderColor) {
    rules.push(`border: ${(s as any).borderWidth}px ${(s as any).borderStyle || 'solid'} ${(s as any).borderColor};`)
  }

  // Border radius
  if (s.borderRadiusCorners) {
    const [tl, tr, br, bl] = s.borderRadiusCorners
    rules.push(`border-radius: ${px(tl)} ${px(tr)} ${px(br)} ${px(bl)};`)
  } else if (s.borderRadius) {
    rules.push(`border-radius: ${px(s.borderRadius)};`)
  }

  // Shadows
  if (s.boxShadow && s.boxShadow.length > 0) {
    const shadows = s.boxShadow.map(sh =>
      `${px(sh.x)} ${px(sh.y)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`
    ).join(', ')
    rules.push(`box-shadow: ${shadows};`)
  }

  // Blur
  if ((s as any).blur) rules.push(`filter: blur(${(s as any).blur}px);`)
  if ((s as any).backdropBlur) rules.push(`backdrop-filter: blur(${(s as any).backdropBlur}px);`)

  // Overflow
  if (s.overflow === 'hidden') rules.push(`overflow: hidden;`)

  // Auto layout → flexbox
  const al = el.autoLayout
  if (al?.enabled) {
    rules.push(`display: flex;`)
    rules.push(`flex-direction: ${al.direction === 'horizontal' ? 'row' : 'column'};`)
    if (al.gap) rules.push(`gap: ${al.gap}px;`)
    const pad = al.padding
    rules.push(`padding: ${px(pad.top)} ${px(pad.right)} ${px(pad.bottom)} ${px(pad.left)};`)
    const alignMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
    const justMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between' }
    if (al.alignItems) rules.push(`align-items: ${alignMap[al.alignItems] || al.alignItems};`)
    if (al.justifyContent) rules.push(`justify-content: ${justMap[al.justifyContent] || al.justifyContent};`)
    if (al.wrap) rules.push(`flex-wrap: wrap;`)
  }

  // Typography
  const t = el.text
  if (t) {
    if ((t as any).fontFamily) rules.push(`font-family: '${(t as any).fontFamily}', sans-serif;`)
    if (t.fontSize) rules.push(`font-size: ${px(t.fontSize)};`)
    if (t.fontWeight) rules.push(`font-weight: ${t.fontWeight};`)
    if (t.color) rules.push(`color: ${t.color};`)
    if (t.textAlign) rules.push(`text-align: ${t.textAlign};`)
    if (t.lineHeight) rules.push(`line-height: ${t.lineHeight};`)
    if (t.letterSpacing) rules.push(`letter-spacing: ${t.letterSpacing}px;`)
    if ((t as any).textTransform && (t as any).textTransform !== 'none') {
      rules.push(`text-transform: ${(t as any).textTransform};`)
    }
    rules.push(`word-break: break-word;`)
    rules.push(`white-space: pre-wrap;`)
  }

  return rules.join('\n  ')
}

// ─── HTML element builder ─────────────────────────────────────────────────────

let classCounter = 0
function nextClass() { return `el-${++classCounter}` }

function buildHTML(
  el: Element,
  elements: Record<string, Element>,
  cssBlocks: string[],
  depth: number
): string {
  const indent = '  '.repeat(depth)
  const cls = nextClass()
  const css = elementToCSS(el)
  cssBlocks.push(`.${cls} {\n  ${css}\n}`)

  // Determine tag
  let tag = 'div'
  let innerContent = ''
  let attrs = `class="${cls}"`

  if (el.type === 'text' && el.text) {
    tag = el.text.fontSize && el.text.fontSize >= 32 ? 'h2' : el.text.fontSize && el.text.fontSize >= 20 ? 'h3' : 'p'
    innerContent = escapeHtml(el.text.content)
  } else if (el.type === 'image' && el.image) {
    tag = 'img'
    attrs += ` src="${el.image.src}" alt="" loading="lazy" style="object-fit:${el.image.objectFit || 'cover'};width:100%;height:100%;"`
  }

  // Build children recursively
  const childHTML = el.children
    .map(cid => {
      const child = elements[cid]
      if (!child || !child.visible) return ''
      return buildHTML(child, elements, cssBlocks, depth + 1)
    })
    .filter(Boolean)
    .join('\n')

  if (tag === 'img') {
    return `${indent}<${tag} ${attrs} />`
  }

  if (!innerContent && !childHTML) {
    return `${indent}<${tag} ${attrs}></${tag}>`
  }

  return `${indent}<${tag} ${attrs}>${innerContent ? innerContent : '\n' + childHTML + '\n' + indent}</${tag}>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportElementHtml(
  element: Element,
  elements: Record<string, Element>,
  options?: { format?: 'pretty' }
): string {
  classCounter = 0
  const cssBlocks: string[] = []
  
  const bodyHTML = buildHTML(element, elements, cssBlocks, 1)
  const css = cssBlocks.join('\n\n')

  return `<style>\n${css}\n</style>\n\n${bodyHTML}`
}

export function exportToHTML(
  elements: Record<string, Element>,
  rootElementIds: string[],
  projectName: string
): string {
  classCounter = 0
  const cssBlocks: string[] = []

  const bodyHTML = rootElementIds
    .map(id => {
      const el = elements[id]
      if (!el || !el.visible) return ''
      return buildHTML(el, elements, cssBlocks, 2)
    })
    .filter(Boolean)
    .join('\n')

  const css = cssBlocks.join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; position: relative; min-height: 100vh; }
    .canvas-root { position: relative; width: 100%; min-height: 100vh; }

${css}
  </style>
</head>
<body>
  <div class="canvas-root">
${bodyHTML}
  </div>
</body>
</html>`
}

// ─── Download helper ──────────────────────────────────────────────────────────

export function downloadHTML(
  elements: Record<string, Element>,
  rootElementIds: string[],
  projectName: string
): void {
  const html = exportToHTML(elements, rootElementIds, projectName)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
