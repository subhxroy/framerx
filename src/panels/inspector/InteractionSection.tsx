import { useState } from 'react'
import { useEditorStore, type Interaction } from '@/store/editorStore'

const TRIGGERS = [
  { value: 'tap' as const, label: 'Tap' },
  { value: 'hover' as const, label: 'Hover' },
  { value: 'appear' as const, label: 'Appear' },
  { value: 'inview' as const, label: 'In View' },
]

const TRIGGER_SHORT: Record<string, string> = {
  tap: 'Tap',
  hover: 'Hover',
  appear: 'Appear',
  inview: 'In View',
}

interface Props {
  elementId: string
}

export default function InteractionSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const [adding, setAdding] = useState(false)
  const [selectedTrigger, setSelectedTrigger] = useState<'tap' | 'hover' | 'appear' | 'inview'>('tap')
  const [actionType, setActionType] = useState<'navigate' | 'overlay'>('navigate')

  const actions = element?.interactions?.filter((i) => i.action) ?? []

  const overlayCandidates = Object.values(elements).filter(
    (el) => (el.type === 'frame' || el.type === 'stack') && el.id !== elementId
  )

  const addAction = () => {
    pushHistory()
    const newInt: Interaction = {
      id: `int_${Date.now()}`,
      trigger: selectedTrigger,
      action: {
        type: actionType,
        url: actionType === 'navigate' ? 'https://' : undefined,
        overlayId: actionType === 'overlay' ? '' : undefined,
      },
    }
    const current = element?.interactions ?? []
    updateElement(elementId, { interactions: [...current, newInt] })
    setAdding(false)
    setSelectedTrigger('tap')
    setActionType('navigate')
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
              transition: 'color var(--duration-normal)',
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
        <div className="flex flex-col gap-2 mb-2 p-2 rounded" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Trigger
          </span>
          <div className="flex gap-1">
            {TRIGGERS.map((t) => (
              <button
                key={t.value}
                style={{
                  flex: 1,
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '4px 2px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedTrigger === t.value ? 'var(--accent)' : 'var(--surface-1)',
                  color: selectedTrigger === t.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  transition: 'background var(--duration-fast), color var(--duration-fast)',
                }}
                onClick={() => setSelectedTrigger(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Action
          </span>
          <div className="flex gap-1">
            <button
              style={{
                flex: 1,
                fontSize: '10px',
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: actionType === 'navigate' ? 'var(--accent)' : 'var(--surface-1)',
                color: actionType === 'navigate' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                transition: 'background var(--duration-fast), color var(--duration-fast)',
              }}
              onClick={() => setActionType('navigate')}
            >
              Navigate
            </button>
            <button
              style={{
                flex: 1,
                fontSize: '10px',
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: actionType === 'overlay' ? 'var(--accent)' : 'var(--surface-1)',
                color: actionType === 'overlay' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                transition: 'background var(--duration-fast), color var(--duration-fast)',
              }}
              onClick={() => setActionType('overlay')}
            >
              Open Overlay
            </button>
          </div>

          <button
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              marginTop: '4px',
              transition: 'background var(--duration-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            onClick={addAction}
          >
            Add {TRIGGER_SHORT[selectedTrigger]} {actionType === 'navigate' ? 'Navigate' : 'Overlay'}
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
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                  }}
                >
                  {TRIGGER_SHORT[int.trigger] ?? int.trigger}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                  {int.action?.type === 'navigate' ? 'Navigate' : 'Open Overlay'}
                </span>
              </div>
              <button
                style={{
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '1',
                  padding: 0,
                  transition: 'color var(--duration-normal)',
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
                  padding: '0 8px',
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
              <select
                style={{
                  width: '100%',
                  height: '24px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  padding: '0 4px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
                value={int.action?.overlayId ?? ''}
                onChange={(e) =>
                  updateAction(int.id, {
                    action: { ...int.action!, overlayId: e.target.value },
                  } as Partial<Interaction>)
                }
              >
                <option value="" disabled style={{ color: 'var(--text-muted)' }}>
                  Select overlay...
                </option>
                {overlayCandidates.map((el) => (
                  <option key={el.id} value={el.id} style={{ color: 'var(--text-primary)' }}>
                    {el.name || el.id}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-1 mt-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t.value}
                  style={{
                    flex: 1,
                    fontSize: '9px',
                    fontWeight: 500,
                    padding: '2px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: int.trigger === t.value ? 'var(--accent)' : 'var(--surface-2)',
                    color: int.trigger === t.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    transition: 'background var(--duration-fast), color var(--duration-fast)',
                  }}
                  onMouseEnter={e => {
                    if (int.trigger !== t.value) {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (int.trigger !== t.value) {
                      e.currentTarget.style.background = 'var(--surface-2)'
                    }
                  }}
                  onClick={() => updateAction(int.id, { trigger: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
