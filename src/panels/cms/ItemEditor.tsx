import { useState, useEffect } from 'react'
import { useCMSStore, type CMSFieldType } from '@/store/cmsStore'
import { ArrowLeft } from 'lucide-react'

interface Props {
  collectionId: string
  itemId: string
  onBack: () => void
}

export default function ItemEditor({ collectionId, itemId, onBack }: Props) {
  const collection = useCMSStore((s) => s.collections[collectionId])
  const items = useCMSStore((s) => s.items[collectionId] || [])
  const updateItem = useCMSStore((s) => s.updateItem)
  const item = items.find((i) => i.id === itemId)
  const [values, setValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (item) setValues({ ...item.values })
  }, [item])

  if (!collection || !item) return null

  const setVal = (fieldId: string, val: unknown) => {
    const next = { ...values, [fieldId]: val }
    setValues(next)
    updateItem(collectionId, itemId, next)
  }

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center gap-1">
        <button
          className="flex items-center justify-center w-5 h-5 rounded"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={onBack}
        >
          <ArrowLeft size={12} />
        </button>
        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          Edit {collection.name}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-auto">
        {collection.fields.map((f) => (
          <div key={f.id} className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.name}</span>
            <FieldInput
              type={f.type}
              value={values[f.id] ?? f.defaultValue ?? ''}
              options={f.options}
              onChange={(v) => setVal(f.id, v)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function FieldInput({
  type,
  value,
  options,
  onChange,
}: {
  type: CMSFieldType
  value: unknown
  options?: string[]
  onChange: (val: unknown) => void
}) {
  const strVal = String(value ?? '')
  const numVal = typeof value === 'number' ? value : 0
  const boolVal = typeof value === 'boolean' ? value : false

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: 'var(--text-xs)',
    padding: '2px 4px',
    borderRadius: 4,
    background: 'var(--surface-1)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    outline: 'none',
  }

  switch (type) {
    case 'rich-text':
      return <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={strVal} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return <input type="number" style={inputStyle} value={numVal} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    case 'boolean':
      return <input type="checkbox" checked={boolVal} onChange={(e) => onChange(e.target.checked)} />
    case 'date':
      return <input type="date" style={inputStyle} value={strVal} onChange={(e) => onChange(e.target.value)} />
    case 'color':
      return <input type="color" style={{ ...inputStyle, width: 40, height: 24, padding: 0 }} value={strVal || '#000000'} onChange={(e) => onChange(e.target.value)} />
    case 'enum':
      return (
        <select style={inputStyle} value={strVal} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {(options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )
    default:
      return <input style={inputStyle} value={strVal} onChange={(e) => onChange(e.target.value)} />
  }
}
