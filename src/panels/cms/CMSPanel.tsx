import { useState } from 'react'
import { useCMSStore } from '@/store/cmsStore'
import CollectionEditor from './CollectionEditor'
import ItemsTable from './ItemsTable'
import ItemEditor from './ItemEditor'

export default function CMSPanel() {
  const collections = useCMSStore((s) => s.collections)
  const addCollection = useCMSStore((s) => s.addCollection)
  const deleteCollection = useCMSStore((s) => s.deleteCollection)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ collectionId: string; itemId: string } | null>(null)
  const [newName, setNewName] = useState('')

  const collectionList = Object.values(collections)

  if (editingItem) {
    return (
      <ItemEditor
        collectionId={editingItem.collectionId}
        itemId={editingItem.itemId}
        onBack={() => setEditingItem(null)}
      />
    )
  }

  if (selectedId) {
    const collection = collections[selectedId]
    if (!collection) {
      setSelectedId(null)
      return null
    }
    return (
      <div className="flex flex-col h-full">
        <CollectionEditor collection={collection} onBack={() => setSelectedId(null)} />
        <div className="flex-1 overflow-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <ItemsTable
            collection={collection}
            onEditItem={(itemId) => setEditingItem({ collectionId: collection.id, itemId })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center gap-1">
        <input
          className="flex-1 text-xs px-1.5 py-1 rounded"
          style={{ background: 'var(--surface-1)', color: 'var(--text-primary)', border: '1px solid var(--border)', outline: 'none' }}
          placeholder="Collection name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && newName.trim()) {
              const id = await addCollection(newName.trim())
              setSelectedId(id)
              setNewName('')
            }
          }}
        />
        <button
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          onClick={async () => {
            if (newName.trim()) {
              const id = await addCollection(newName.trim())
              setSelectedId(id)
              setNewName('')
            }
          }}
        >
          + New
        </button>
      </div>

      <div className="flex flex-col gap-1 overflow-auto">
        {collectionList.length === 0 && (
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)', padding: 16 }}>
            No collections yet. Create one above.
          </p>
        )}
        {collectionList.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            onClick={() => setSelectedId(c.id)}
          >
            <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-primary)' }}>
              {c.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {c.fields.length} fields
            </span>
            <button
              className="text-xs px-1 rounded"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                deleteCollection(c.id)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
