import { useState } from 'react'
import type { CMSCollection, CMSFieldType } from '@/store/cmsStore'
import { useCMSStore } from '@/store/cmsStore'
import { ArrowLeft } from 'lucide-react'

interface Props {
  collection: CMSCollection
  onBack: () => void
}

const fieldTypes: CMSFieldType[] = [
  'text', 'rich-text', 'image', 'number', 'boolean',
  'date', 'color', 'link', 'file', 'video', 'enum',
]

export default function CollectionEditor({ collection, onBack }: Props) {
  const updateCollection = useCMSStore((s) => s.updateCollection)
  const addField = useCMSStore((s) => s.addField)
  const removeField = useCMSStore((s) => s.removeField)
  const [name, setName] = useState(collection.name)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<CMSFieldType>('text')

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="flex items-center gap-1">
        <button
          className="flex items-center justify-center w-5 h-5 rounded"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={onBack}
        >
          <ArrowLeft size={12} />
        </button>
        <input
          className="flex-1 text-xs font-medium px-1 py-0.5 rounded"
          style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none' }}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            updateCollection(collection.id, { name: e.target.value })
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Fields</span>
        {collection.fields.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-1 px-1.5 py-1 rounded"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.type}</span>
            <button
              className="text-xs px-1"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => removeField(collection.id, f.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <input
          className="flex-1 text-xs px-1.5 py-1 rounded"
          style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none' }}
          placeholder="Field name"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
        />
        <select
          className="text-xs px-1 py-1 rounded"
          style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none' }}
          value={newFieldType}
          onChange={(e) => setNewFieldType(e.target.value as CMSFieldType)}
        >
          {fieldTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          className="text-xs px-1.5 py-1 rounded"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (newFieldName.trim()) {
              addField(collection.id, { name: newFieldName.trim(), type: newFieldType, required: false })
              setNewFieldName('')
            }
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
