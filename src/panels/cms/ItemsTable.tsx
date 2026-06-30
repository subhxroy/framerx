import type { CMSCollection } from '@/store/cmsStore'
import { useCMSStore } from '@/store/cmsStore'
import { Plus } from 'lucide-react'

interface Props {
  collection: CMSCollection
  onEditItem: (itemId: string) => void
}

export default function ItemsTable({ collection, onEditItem }: Props) {
  const items = useCMSStore((s) => s.items[collection.id] || [])
  const addItem = useCMSStore((s) => s.addItem)
  const deleteItem = useCMSStore((s) => s.deleteItem)

  const visibleFields = collection.fields.slice(0, 4)

  return (
    <div className="flex flex-col p-2 gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          Items ({items.length})
        </span>
        <button
          className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            const defaults: Record<string, unknown> = {}
            for (const f of collection.fields) {
              defaults[f.id] = f.defaultValue ?? ''
            }
            addItem(collection.id, defaults)
          }}
        >
          <Plus size={10} /> Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)', padding: 12 }}>
          No items yet
        </p>
      )}

      {visibleFields.length === 0 && items.length > 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)', padding: 12 }}>
          Add fields to see items
        </p>
      )}

      {visibleFields.length > 0 && items.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              onClick={() => onEditItem(item.id)}
            >
              {visibleFields.map((f) => {
                const val = item.values[f.id]
                const display = typeof val === 'string' ? val.slice(0, 20) : String(val ?? '')
                return (
                  <span key={f.id} className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                    {display || '—'}
                  </span>
                )
              })}
              <button
                className="text-xs px-1"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteItem(collection.id, item.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
