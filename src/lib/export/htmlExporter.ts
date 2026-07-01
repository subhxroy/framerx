import type { Element } from '@/store/editorStore'
import { generateCSS } from './cssGenerator'

function elClass(id: string) {
  return `.e${id.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12)}`
}

function renderElementHTML(el: Element, elements: Record<string, Element>, indent = 0): string {
  const pad = '  '.repeat(indent)
  const cls = elClass(el.id).slice(1)
  let inner = ''

  if (el.type === 'text' && el.text) {
    inner = escapeHtml(el.text.content)
  }

  if (el.type === 'image' && el.image) {
    inner = el.image.src
      ? `<img src="${escapeHtml(el.image.src)}" alt="" style="width:100%;height:100%;object-fit:${el.image.objectFit};pointer-events:none;" />`
      : ''
  }

  const childHtml = (el.children || [])
    .map((cid) => {
      const child = elements[cid]
      return child ? renderElementHTML(child, elements, indent + 1) : ''
    })
    .join('\n')

  if (inner && childHtml) {
    return `${pad}<div class="${cls}" data-el="${el.id}">\n${childHtml}\n${pad}  ${inner}\n${pad}</div>`
  }
  if (inner) {
    return `${pad}<div class="${cls}" data-el="${el.id}">${inner}</div>`
  }
  if (childHtml) {
    return `${pad}<div class="${cls}" data-el="${el.id}">\n${childHtml}\n${pad}</div>`
  }
  return `${pad}<div class="${cls}" data-el="${el.id}"></div>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function exportToHTML(
  elements: Record<string, Element>,
  rootIds: string[],
  options?: { includeAnimations?: boolean; title?: string; description?: string; ogImage?: string }
): string {
  const css = generateCSS(elements, rootIds, options?.includeAnimations !== false)
  const title = options?.title || 'Exported Page'
  const description = options?.description || ''
  const ogImage = options?.ogImage || ''

  const bodyContent = rootIds
    .map((id) => {
      const el = elements[id]
      return el ? renderElementHTML(el, elements) : ''
    })
    .join('\n')

  const mediaQueries = [css.tabletMedia, css.mobileMedia].filter(Boolean).join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description || title)}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description || title)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description || title)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
  <style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  min-height: 100vh;
}

body {
  background: #111;
  display: flex;
  justify-content: center;
}

.page {
  position: relative;
  width: 1440px;
  min-height: 100vh;
  margin: 0 auto;
  overflow: hidden;
}

${css.base}

${mediaQueries}

${css.animations}
  </style>
</head>
<body>
  <div class="page">
${bodyContent}
  </div>
</body>
</html>`
}

export function exportSingleElementHTML(
  element: Element,
  elements: Record<string, Element>,
  options?: { description?: string; ogImage?: string }
): string {
  const rootIds = [element.id]
  const css = generateCSS(elements, rootIds)
  const bodyContent = renderElementHTML(element, elements)
  const mediaQueries = [css.tabletMedia, css.mobileMedia].filter(Boolean).join('\n\n')
  const description = options?.description || element.name
  const ogImage = options?.ogImage || ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(element.name)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="${escapeHtml(element.name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(element.name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
  <style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  min-height: 100vh;
}

body {
  background: #111;
  display: flex;
  justify-content: center;
}

${css.base}

${mediaQueries}

${css.animations}
  </style>
</head>
<body>
  <div class="page">
${bodyContent}
  </div>
</body>
</html>`
}

export function downloadHTML(
  elements: Record<string, Element>,
  rootIds: string[],
  filename = 'page.html'
): void {
  const html = exportToHTML(elements, rootIds)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
