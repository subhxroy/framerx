import { useState } from 'react'
import { useEditorStore, type Interaction } from '@/store/editorStore'

interface Props {
  elementId: string
}

export default function InteractionSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const [adding, setAdding] = useState(false)

  const actions = element?.interactions?.filter((i) => i.action) ?? []

  const addAction = (type: 'navigate' | 'overlay') => {
    pushHistory()
    const newInt: Interaction = {
      id: `int_${Date.now()}`,
      trigger: 'tap',
      action: {
        type,
        url: type === 'navigate' ? 'https://' : undefined,
        overlayId: type === 'overlay' ? '' : undefined,
      },
    }
    const current = element?.interactions ?? []
    updateElement(elementId, { interactions: [...current, newInt] })
    setAdding(false)
  }

  const removeAction = (intId: string) => {
    pushHistory()
    const current = element?.interactions ?? []
    updateElement(elementId, {
      interactions: current.filter((i) => i.id !== intId),
    })
  }

  const updateAction = (intId: string, updates: Partial<Interaction>) => {
    const current = element?.interactions ?? []
    updateElement(elementId, {
      interactions: current.map((i) => (i.id === intId ? { ...i, ...updates } : i)),
    })
  }

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
          Interaction
        </span>
        {!adding && (
          <button
            style={{ 
              fontSize: '10px',
              color: 'var(--accent)', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              padding: 0,
              fontWeight: 500,
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--accent)'}
            onClick={() => setAdding(true)}
          >
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-1 mb-2 p-1 rounded" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <button
            style={{ 
              color: 'var(--text-secondary)', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px 8px',
              fontSize: '11px',
              textAlign: 'left',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onClick={() => addAction('navigate')}
          >
            Navigate
          </button>
          <button
            style={{ 
              color: 'var(--text-secondary)', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px 8px',
              fontSize: '11px',
              textAlign: 'left',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onClick={() => addAction('overlay')}
          >
            Open Overlay
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {actions.map((int) => (
          <div
            key={int.id}
            className="rounded p-2"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2 pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                {int.action?.type === 'navigate' ? 'Navigate' : 'Open Overlay'}
              </span>
              <button
                style={{ 
                  color: 'var(--text-secondary)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '1',
                  padding: 0,
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onClick={() => removeAction(int.id)}
              >
                ×
              </button>
            </div>

            {int.action?.type === 'navigate' ? (
              <input
                style={{ 
                  width: '100%',
                  height: '24px',
                  background: 'var(--surface-2)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  padding: '0 6px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                value={int.action?.url ?? ''}
                placeholder="https://example.com"
                onChange={(e) =>
                  updateAction(int.id, {
                    action: { ...int.action!, url: e.target.value },
                  } as Partial<Interaction>)
                }
              />
            ) : (
              <input
                style={{ 
                  width: '100%',
                  height: '24px',
                  background: 'var(--surface-2)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  padding: '0 6px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                value={int.action?.overlayId ?? ''}
                placeholder="Overlay element ID"
                onChange={(e) =>
                  updateAction(int.id, {
                    action: { ...int.action!, overlayId: e.target.value },
                  } as Partial<Interaction>)
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
