import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '@/store/editorStore'
import { DURATION, EASE } from '@/lib/motionTokens'
import { useProjectStore } from '@/store/projectStore'
import { useNavigate } from 'react-router-dom'
import { Search, Layers, Command, FileText, Trash2, Copy, Square } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'layer' | 'command' | 'navigate'
}

interface Props {
  onClose: () => void
}

export default function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const elements = useEditorStore(s => s.elements)
  const selectedIds = useEditorStore(s => s.selectedIds)
  const setSelectedIds = useEditorStore(s => s.setSelectedIds)
  const deleteElement = useEditorStore(s => s.deleteElement)
  const duplicateElement = useEditorStore(s => s.duplicateElement)
  const groupSelection = useEditorStore(s => s.groupSelection)
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const setPreviewMode = useEditorStore(s => s.setPreviewMode)
  const projectList = useProjectStore(s => s.projectList)

  const close = useCallback(() => onClose(), [onClose])

  const commands: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = []

    // Layer commands
    Object.values(elements).forEach(el => {
      cmds.push({
        id: `layer-${el.id}`,
        label: el.name,
        description: `${el.type} • ${Math.round(el.x)}, ${Math.round(el.y)}`,
        icon: <Layers size={13} />,
        category: 'layer',
        action: () => { setSelectedIds([el.id]); close() },
      })
    })

    // Actions
    const actions: CommandItem[] = [
      {
        id: 'undo', label: 'Undo', description: 'Ctrl+Z', icon: <Command size={13} />,
        category: 'command', action: () => { undo(); close() },
      },
      {
        id: 'redo', label: 'Redo', description: 'Ctrl+Shift+Z', icon: <Command size={13} />,
        category: 'command', action: () => { redo(); close() },
      },
      {
        id: 'group', label: 'Group Selection', description: 'Ctrl+G', icon: <Square size={13} />,
        category: 'command', action: () => { groupSelection(); close() },
      },
      {
        id: 'duplicate', label: 'Duplicate', description: 'Ctrl+D', icon: <Copy size={13} />,
        category: 'command',
        action: () => {
          if (selectedIds.length > 0) [...selectedIds].reverse().forEach(id => duplicateElement(id))
          close()
        },
      },
      {
        id: 'delete', label: 'Delete Selected', description: 'Delete', icon: <Trash2 size={13} />,
        category: 'command',
        action: () => {
          if (selectedIds.length > 0) selectedIds.forEach(id => deleteElement(id))
          close()
        },
      },
      {
        id: 'preview', label: 'Enter Preview Mode', description: 'Ctrl+P', icon: <Command size={13} />,
        category: 'command', action: () => { setPreviewMode(true); close() },
      },
    ]
    cmds.push(...actions)

    // Projects navigation
    projectList.forEach(p => {
      cmds.push({
        id: `nav-${p.id}`,
        label: `Go to: ${p.name}`,
        description: 'Open project',
        icon: <FileText size={13} />,
        category: 'navigate',
        action: () => { navigate(`/editor/${p.id}`); close() },
      })
    })

    return cmds
  }, [elements, selectedIds, projectList])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 12)
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    ).slice(0, 12)
  }, [commands, query])

  useEffect(() => {
    setActiveIdx(0)
  }, [filtered.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      filtered[activeIdx]?.action()
    }
  }, [close, filtered, activeIdx])

  const categoryLabel = { layer: 'Layers', command: 'Commands', navigate: 'Projects' }
  const categoryColor = { layer: '#667eea', command: 'var(--accent)', navigate: '#43e97b' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE.standard }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div
        style={{
          width: 560, background: 'var(--surface-2)', border: '1px solid var(--panel-border)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search layers, commands, pages..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 3, padding: '2px 5px',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div style={{ padding: 6 }}>
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                    background: idx === activeIdx ? 'var(--surface-hover)' : 'transparent',
                    transition: 'background var(--duration-instant)',
                  }}
                >
                  <span style={{
                    color: categoryColor[item.category], flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</p>
                    {item.description && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{item.description}</p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-1)',
                    border: '1px solid var(--panel-border)', borderRadius: 3, padding: '1px 6px',
                    flexShrink: 0,
                  }}>
                    {categoryLabel[item.category]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--surface-1)', padding: '8px 14px',
          display: 'flex', gap: 12,
        }}>
          {[['↑↓', 'Navigate'], ['↵', 'Execute'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px', fontSize: 10, color: 'var(--text-tertiary)' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
