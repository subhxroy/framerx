import { useEditorStore } from '@/store/editorStore'

// Inline SVG icons to avoid lucide-react version issues
const icons = {
  alignLeft: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="9" height="4" rx="1"/><rect x="3" y="12" width="14" height="4" rx="1"/><line x1="2" y1="2" x2="2" y2="22"/>
    </svg>
  ),
  alignCenterH: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="5" width="12" height="4" rx="1"/><rect x="3" y="12" width="18" height="4" rx="1"/><line x1="12" y1="2" x2="12" y2="22"/>
    </svg>
  ),
  alignRight: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="5" width="9" height="4" rx="1"/><rect x="7" y="12" width="14" height="4" rx="1"/><line x1="22" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  alignTop: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="4" height="9" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/><line x1="2" y1="2" x2="22" y2="2"/>
    </svg>
  ),
  alignCenterV: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="6" width="4" height="12" rx="1"/><rect x="12" y="3" width="4" height="18" rx="1"/><line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  alignBottom: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="12" width="4" height="9" rx="1"/><rect x="12" y="7" width="4" height="14" rx="1"/><line x1="2" y1="22" x2="22" y2="22"/>
    </svg>
  ),
  distributeH: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="6" height="14" rx="1"/><rect x="14" y="7" width="6" height="10" rx="1"/><line x1="2" y1="2" x2="2" y2="22"/><line x1="22" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  distributeV: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="6" rx="1"/><rect x="7" y="14" width="10" height="6" rx="1"/><line x1="2" y1="2" x2="22" y2="2"/><line x1="2" y1="22" x2="22" y2="22"/>
    </svg>
  ),
}

function AlignBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, border: 'none', background: 'transparent',
        color: 'var(--text-secondary)', cursor: 'pointer', transition: 'background var(--duration-normal), color var(--duration-normal)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {icon}
    </button>
  )
}

export default function AlignmentBar() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const updateElement = useEditorStore(s => s.updateElement)
  const pushHistory = useEditorStore(s => s.pushHistory)

  if (selectedIds.length < 2) return null

  const els = selectedIds.map(id => elements[id]).filter(Boolean)
  if (els.length < 2) return null

  const minX = Math.min(...els.map(e => e.x))
  const minY = Math.min(...els.map(e => e.y))
  const maxX = Math.max(...els.map(e => e.x + e.width))
  const maxY = Math.max(...els.map(e => e.y + e.height))
  const totalW = maxX - minX
  const totalH = maxY - minY

  const align = (fn: (e: typeof els[0]) => { x?: number; y?: number }) => {
    pushHistory()
    for (const el of els) updateElement(el.id, fn(el))
  }

  const distributeH = () => {
    pushHistory()
    const sorted = [...els].sort((a, b) => a.x - b.x)
    const totalElemW = sorted.reduce((s, e) => s + e.width, 0)
    const gap = (totalW - totalElemW) / Math.max(sorted.length - 1, 1)
    let cursor = minX
    for (const el of sorted) { updateElement(el.id, { x: cursor }); cursor += el.width + gap }
  }

  const distributeV = () => {
    pushHistory()
    const sorted = [...els].sort((a, b) => a.y - b.y)
    const totalElemH = sorted.reduce((s, e) => s + e.height, 0)
    const gap = (totalH - totalElemH) / Math.max(sorted.length - 1, 1)
    let cursor = minY
    for (const el of sorted) { updateElement(el.id, { y: cursor }); cursor += el.height + gap }
  }

  const divider = <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
      borderRadius: 8, padding: '4px', gap: 4,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <AlignBtn icon={icons.alignLeft}    title="Align left"        onClick={() => align(() => ({ x: minX }))} />
      <AlignBtn icon={icons.alignCenterH} title="Align center H"    onClick={() => align(e => ({ x: minX + totalW / 2 - e.width / 2 }))} />
      <AlignBtn icon={icons.alignRight}   title="Align right"       onClick={() => align(e => ({ x: maxX - e.width }))} />
      {divider}
      <AlignBtn icon={icons.alignTop}     title="Align top"         onClick={() => align(() => ({ y: minY }))} />
      <AlignBtn icon={icons.alignCenterV} title="Align middle"      onClick={() => align(e => ({ y: minY + totalH / 2 - e.height / 2 }))} />
      <AlignBtn icon={icons.alignBottom}  title="Align bottom"      onClick={() => align(e => ({ y: maxY - e.height }))} />
      {divider}
      <AlignBtn icon={icons.distributeH}  title="Distribute H"      onClick={distributeH} />
      <AlignBtn icon={icons.distributeV}  title="Distribute V"      onClick={distributeV} />
    </div>
  )
}
