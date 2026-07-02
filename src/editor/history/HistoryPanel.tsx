import { useEditorStore } from '@/store/editorStore'
import { RotateCcw, RotateCw, History } from 'lucide-react'

export default function HistoryPanel() {
  const history = useEditorStore(s => s.history)
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const canUndo = useEditorStore(s => s.canUndo)
  const canRedo = useEditorStore(s => s.canRedo)

  const entries = history.entries
  const currentIndex = history.index

  const timeStr = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const handleJump = (index: number) => {
    const state = useEditorStore.getState()
    if (index < 0 || index >= state.history.entries.length) return
    const entry = state.history.entries[index]
    if (!entry) return
    useEditorStore.setState({
      elements: JSON.parse(JSON.stringify(entry.elements)),
      rootElementIds: [...entry.rootElementIds],
      selectedIds: [...entry.selectedIds],
      editingId: entry.editingId,
      history: { ...state.history, index },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={undo}
          disabled={!canUndo()}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: canUndo() ? 'var(--text-secondary)' : 'var(--text-disabled)',
            cursor: canUndo() ? 'pointer' : 'default', fontSize: 11,
          }}
          title="Undo"
        >
          <RotateCcw size={12} /> Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: canRedo() ? 'var(--text-secondary)' : 'var(--text-disabled)',
            cursor: canRedo() ? 'pointer' : 'default', fontSize: 11,
          }}
          title="Redo"
        >
          <RotateCw size={12} /> Redo
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
        {entries.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 11 }}>
            No history yet
          </div>
        ) : (
          entries.map((entry, i) => {
            const isCurrent = i === currentIndex
            const elementCount = Object.keys(entry.elements).length
            return (
              <div
                key={i}
                onClick={() => handleJump(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                  background: isCurrent ? 'rgba(0,145,255,0.08)' : 'transparent',
                  border: isCurrent ? '1px solid rgba(0,145,255,0.2)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
              >
                <History size={12} style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isCurrent ? 500 : 400 }}>
                    State {i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {elementCount} elements · {timeStr(entry.timestamp)}
                  </div>
                </div>
                {isCurrent && (
                  <span style={{ fontSize: 9, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '0 4px', borderRadius: 4 }}>
                    Current
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
