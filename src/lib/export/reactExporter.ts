import type { Element } from '@/store/editorStore'

function twClass(id: string) {
  return `el_${id.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12)}`
}

function styleObj(el: Element): Record<string, string | number | undefined> {
  const s: Record<string, string | number | undefined> = {}

  s.left = 0
  s.top = 0
  s.width = `${el.width}px`
  s.height = `${el.height}px`
  s.transform = `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)`
  s.transformOrigin = '0 0'
  s.opacity = el.opacity

  if (el.style.backgroundColor) s.backgroundColor = el.style.backgroundColor
  if (el.style.borderRadius !== undefined) s.borderRadius = `${el.style.borderRadius}px`
  if (el.style.border) s.border = el.style.border
  if (el.style.overflow) s.overflow = el.style.overflow

  if (el.autoLayout?.enabled) {
    s.display = 'flex'
    s.flexDirection = el.autoLayout.direction === 'horizontal' ? 'row' : 'column'
    s.gap = `${el.autoLayout.gap}px`
    s.padding = `${el.autoLayout.padding.top}px ${el.autoLayout.padding.right}px ${el.autoLayout.padding.bottom}px ${el.autoLayout.padding.left}px`
    s.alignItems = el.autoLayout.alignItems
    s.justifyContent = el.autoLayout.justifyContent
    if (el.autoLayout.wrap) s.flexWrap = 'wrap'
  }

  if (el.text) {
    s.fontSize = `${el.text.fontSize}px`
    s.fontWeight = el.text.fontWeight
    s.color = el.text.color
    s.textAlign = el.text.textAlign
    s.lineHeight = el.text.lineHeight
    s.letterSpacing = `${el.text.letterSpacing}px`
    s.overflow = 'hidden'
    s.whiteSpace = 'pre-wrap'
    s.wordBreak = 'break-word'
  }

  return s
}

function styleString(obj: Record<string, string | number | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: "${v}"`)
    .join(', ')
}

function renderElementReact(el: Element, elements: Record<string, Element>, indent = 2): string {
  const pad = '  '.repeat(indent)
  const cls = twClass(el.id)
  const st = styleObj(el)
  const stStr = styleString(st)

  let inner = ''

  if (el.type === 'text' && el.text) {
    inner = escapeJs(el.text.content)
  }

  if (el.type === 'image' && el.image && el.image.src) {
    inner = `<img src="${escapeJs(el.image.src)}" alt="" style={{ width: '100%', height: '100%', objectFit: '${el.image.objectFit}', pointerEvents: 'none' }} />`
  }

  const childHtml = (el.children || [])
    .map((cid) => {
      const child = elements[cid]
      return child ? renderElementReact(child, elements, indent + 1) : ''
    })
    .filter(Boolean)
    .join('\n')

  if (inner && childHtml) {
    return `${pad}<div className="${cls}" style={{ ${stStr} }}>\n${childHtml}\n${pad}  {${inner}}\n${pad}</div>`
  }
  if (inner) {
    return `${pad}<div className="${cls}" style={{ ${stStr} }}>{${inner}}</div>`
  }
  if (childHtml) {
    return `${pad}<div className="${cls}" style={{ ${stStr} }}>\n${childHtml}\n${pad}</div>`
  }
  return `${pad}<div className="${cls}" style={{ ${stStr} }} />`
}

function escapeJs(s: string): string {
  return s.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '')
}

export function exportToReact(
  elements: Record<string, Element>,
  rootIds: string[]
): string {
  const bodyContent = rootIds
    .map((id) => {
      const el = elements[id]
      return el ? renderElementReact(el, elements) : ''
    })
    .join('\n')

  return `import type { CSSProperties } from 'react'

const pageStyle: CSSProperties = {
  position: 'relative',
  width: 1440,
  minHeight: '100vh',
  margin: '0 auto',
  overflow: 'hidden',
  background: '#111',
}

export default function Page() {
  return (
    <div style={pageStyle}>
${bodyContent}
    </div>
  )
}`
}

export function downloadReactComponent(
  elements: Record<string, Element>,
  rootIds: string[],
  filename = 'Page.tsx'
): void {
  const code = exportToReact(elements, rootIds)
  const blob = new Blob([code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
