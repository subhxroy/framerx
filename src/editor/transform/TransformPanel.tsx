import { useEditorStore } from '@/store/editorStore'
import NumberInput from '@/panels/inspector/NumberInput'

export default function TransformPanel() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const pushHistory = useEditorStore(s => s.pushHistory)
  const updateElement = useEditorStore(s => s.updateElement)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  if (!el || selectedIds.length !== 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>
          Select a single element to transform
        </p>
      </div>
    )
  }

  const handleChange = (field: string, value: number) => {
    pushHistory()
    updateElement(el.id, { [field]: value })
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

      <div className="grid grid-cols-2 gap-1">
        <NumberInput label="W" value={el.width} onChange={v => handleChange('width', v)} min={0} max={99999} suffix="px" />
        <NumberInput label="H" value={el.height} onChange={v => handleChange('height', v)} min={0} max={99999} suffix="px" />
      </div>

      <div className="grid grid-cols-2 gap-1">
        <NumberInput label="Rotate" value={el.rotation} onChange={v => handleChange('rotation', v)} min={-360} max={360} suffix="°" />
        <NumberInput label="Opacity" value={Math.round(el.opacity * 100)} onChange={v => handleChange('opacity', v / 100)} min={0} max={100} suffix="%" />
      </div>
    </div>
  )
}
