import { useState } from 'react'
import { Link2, Link2Off, Layers } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import NumberInput from '@/panels/inspector/NumberInput'

export default function TransformPanel() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const pushHistory = useEditorStore(s => s.pushHistory)
  const updateElement = useEditorStore(s => s.updateElement)

  const [proportionLocked, setProportionLocked] = useState(false)

  if (selectedIds.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>
          Select an element to transform
        </p>
      </div>
    )
  }

  if (selectedIds.length === 1) {
    const el = elements[selectedIds[0]]
    if (!el) return null

    const proportionLocked_ = proportionLocked && el.width > 0 && el.height > 0
    const ratio = el.width / el.height

    const handleChange = (field: string, value: number) => {
      pushHistory()
      const changes: Record<string, number> = { [field]: value }
      if (proportionLocked_) {
        if (field === 'width') {
          changes.height = Math.round(value / ratio)
        } else if (field === 'height') {
          changes.width = Math.round(value * ratio)
        }
      }
      updateElement(el.id, changes)
    }

    return (
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
          Transform
        </span>

        <div className="grid grid-cols-2 gap-1">
          <NumberInput label="X" value={el.x} onChange={v => handleChange('x', v)} min={-9999} max={99999} />
          <NumberInput label="Y" value={el.y} onChange={v => handleChange('y', v)} min={-9999} max={99999} />
        </div>

        <div className="grid grid-cols-2 gap-1" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <NumberInput label="W" value={el.width} onChange={v => handleChange('width', v)} min={0} max={99999} suffix="px" />
          <button
            onClick={() => setProportionLocked(v => !v)}
            title={proportionLocked ? 'Unlock proportions' : 'Lock proportions'}
            style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', border: 'none',
              background: proportionLocked ? 'var(--accent-bg)' : 'transparent',
              color: proportionLocked ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', marginTop: 18,
            }}
          >
            {proportionLocked ? <Link2 size={13} /> : <Link2Off size={13} />}
          </button>
          <NumberInput label="H" value={el.height} onChange={v => handleChange('height', v)} min={0} max={99999} suffix="px" />
        </div>

        <div className="grid grid-cols-2 gap-1">
          <NumberInput label="Rotate" value={el.rotation} onChange={v => handleChange('rotation', v)} min={-360} max={360} suffix="°" />
          <NumberInput label="Opacity" value={Math.round(el.opacity * 100)} onChange={v => handleChange('opacity', v / 100)} min={0} max={100} suffix="%" />
        </div>
      </div>
    )
  }

  // Multi-select: apply W, H, Rotation, Opacity to all selected elements
  const selected = selectedIds.map(id => elements[id]).filter(Boolean)
  if (selected.length === 0) return null

  const allSame = (field: string) => selected.every(e => (e as any)[field] === (selected[0] as any)[field])
  const getVal = (field: string) => (selected[0] as any)[field]

  const allWidth = allSame('width') ? getVal('width') : null
  const allHeight = allSame('height') ? getVal('height') : null
  const allRotation = allSame('rotation') ? getVal('rotation') : null
  const allOpacity = allSame('opacity') ? getVal('opacity') : null

  const handleMultiChange = (field: string, value: number) => {
    pushHistory()
    for (const id of selectedIds) {
      updateElement(id, { [field]: value })
    }
  }

  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
        Transform
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 4 }}>
        <Layers size={12} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          Editing {selectedIds.length} layers
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <NumberInput label="W" value={allWidth ?? 0} mixed={allWidth === null} onChange={v => handleMultiChange('width', v)} min={0} max={99999} suffix="px" />
        <button
          onClick={() => setProportionLocked(v => !v)}
          title={proportionLocked ? 'Unlock proportions' : 'Lock proportions'}
          style={{
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: proportionLocked ? 'var(--accent-bg)' : 'transparent',
            color: proportionLocked ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', marginTop: 18,
          }}
        >
          {proportionLocked ? <Link2 size={13} /> : <Link2Off size={13} />}
        </button>
        <NumberInput label="H" value={allHeight ?? 0} mixed={allHeight === null} onChange={v => handleMultiChange('height', v)} min={0} max={99999} suffix="px" />
      </div>

      <div className="grid grid-cols-2 gap-1">
        <NumberInput label="Rotate" value={allRotation ?? 0} mixed={allRotation === null} onChange={v => handleMultiChange('rotation', v)} min={-360} max={360} suffix="°" />
        <NumberInput label="Opacity" value={allOpacity !== null ? Math.round(allOpacity * 100) : 0} mixed={allOpacity === null} onChange={v => handleMultiChange('opacity', v / 100)} min={0} max={100} suffix="%" />
      </div>
    </div>
  )
}
