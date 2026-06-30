import { useEditorStore } from '@/store/editorStore'
import { useCMSStore } from '@/store/cmsStore'

interface Props {
  elementId: string
}

export default function CMSBindingSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const updateElement = useEditorStore((s) => s.updateElement)
  const collections = useCMSStore((s) => s.collections)

  const binding = element?.cmsBinding
  const collectionList = Object.values(collections)
  const selectedCollection = binding ? collections[binding.collectionId] : undefined

  const hasBindableType = element?.type === 'text' || element?.type === 'image' || element?.type === 'frame'

  if (!hasBindableType) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          CMS Binding
        </span>
        {binding && (
          <button
            style={{ 
              fontSize: '10px',
              color: 'var(--text-secondary)', 
              border: 'none', 
              background: 'transparent', 
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onClick={() => {
              updateElement(elementId, { cmsBinding: undefined })
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <select
          style={{ 
            width: '100%',
            height: 28,
            background: 'var(--surface-2)', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-sm)',
            padding: '0 8px',
            fontSize: '11px',
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
          value={binding?.collectionId ?? ''}
          onChange={(e) => {
            const colId = e.target.value
            if (!colId) {
              updateElement(elementId, { cmsBinding: undefined })
              return
            }
            const col = collections[colId]
            const firstField = col?.fields[0]
            updateElement(elementId, {
              cmsBinding: { collectionId: colId, fieldId: binding?.fieldId ?? firstField?.id ?? '' },
            })
          }}
        >
          <option value="">— No collection —</option>
          {collectionList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {binding?.collectionId && selectedCollection && (
          <select
            style={{ 
              width: '100%',
              height: 28,
              background: 'var(--surface-2)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm)',
              padding: '0 8px',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
            value={binding.fieldId}
            onChange={(e) => {
              updateElement(elementId, {
                cmsBinding: { ...binding, fieldId: e.target.value },
              })
            }}
          >
            <option value="">— Select field —</option>
            {selectedCollection.fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
            ))}
          </select>
        )}

        {element?.type === 'frame' && binding?.collectionId && (
          <label className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              style={{
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
              checked={binding?.isCollectionFrame ?? false}
              onChange={(e) => {
                updateElement(elementId, {
                  cmsBinding: {
                    ...binding,
                    isCollectionFrame: e.target.checked,
                    collectionFrameCollectionId: e.target.checked ? binding.collectionId : undefined,
                  },
                })
              }}
            />
            Collection Frame (repeat per item)
          </label>
        )}
      </div>
    </div>
  )
}
