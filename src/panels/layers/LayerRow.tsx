import { useState, useCallback, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye, EyeOff, Lock, ChevronRight, ChevronDown,
  Type, Square, Image as ImageIcon, Circle,
} from 'lucide-react'
import type { Element } from '@/store/editorStore'

const TYPE_ICON: Record<string, React.ReactNode> = {
  frame:   <Square size={11} />,
  text:    <Type size={11} />,
  image:   <ImageIcon size={11} />,
  shape:   <Circle size={11} />,
  ellipse: <Circle size={11} />,
  rect:    <Square size={11} />,
  stack:   <Square size={11} />,
}

interface Props {
  element: Element
  depth: number
  isSelected: boolean
  isCollapsed: boolean
  onSelect: (id: string, shift: boolean) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onToggleCollapse: (id: string) => void
  onRename: (id: string, name: string) => void
  hasChildren: boolean
}

export default function LayerRow({
  element,
  depth,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleCollapse,
  onRename,
  hasChildren,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(element.name)
  const [hovered, setHovered] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: element.id })

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleDoubleClick = useCallback(() => {
    setName(element.name)
    setEditing(true)
  }, [element.name])

  const handleRenameSubmit = useCallback(() => {
    setEditing(false)
    if (name.trim() && name !== element.name) {
      onRename(element.id, name.trim())
    } else {
      setName(element.name)
    }
  }, [name, element.name, element.id, onRename])

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => onSelect(element.id, e.shiftKey)}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : element.visible ? 1 : 0.45,
        height: 26,
        paddingLeft: 8 + depth * 12,
        paddingRight: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        background: isSelected
          ? 'rgba(255,255,255,0.06)'
          : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        color: isSelected ? '#e8e8e8' : '#888',
        cursor: 'default',
        userSelect: 'none',
        borderRadius: 4,
        marginInline: 4,
        marginBlock: 0,
      }}
    >
      {/* Collapse toggle */}
      <div style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(element.id) }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 14, height: 14, borderRadius: 2,
              transition: 'color 60ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}
          >
            {isCollapsed
              ? <ChevronRight size={10} />
              : <ChevronDown size={10} />
            }
          </button>
        ) : null}
      </div>

      {/* Type icon */}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, flexShrink: 0,
        color: isSelected ? '#0091ff' : '#3a3a3a',
        transition: 'color 60ms',
      }}>
        {TYPE_ICON[element.type] ?? <Square size={11} />}
      </span>

      {/* Name / rename input */}
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit()
            if (e.key === 'Escape') { setName(element.name); setEditing(false) }
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1, height: 20, minWidth: 0,
            background: '#1a1a1a',
            border: '1px solid var(--accent)',
            borderRadius: 3,
            color: '#ececec',
            fontSize: 11,
            padding: '0 5px',
            outline: 'none',
            fontFamily: 'var(--font-ui)',
          }}
        />
      ) : (
        <span style={{
          flex: 1,
          fontSize: 11,
          fontWeight: isSelected ? 500 : 400,
          color: isSelected ? '#e8e8e8' : '#888',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          letterSpacing: '0.005em',
        }}>
          {element.name}
        </span>
      )}

      {/* Actions — visible on hover */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1,
        opacity: hovered || element.locked || !element.visible ? 1 : 0,
        transition: 'opacity 80ms',
        flexShrink: 0,
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: element.visible ? '#444' : '#333',
            borderRadius: 3, transition: 'color 60ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = element.visible ? '#444' : '#333')}
          title={element.visible ? 'Hide' : 'Show'}
        >
          {element.visible ? <Eye size={11} /> : <EyeOff size={11} />}
        </button>

        {element.locked && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(element.id) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0091ff', borderRadius: 3,
            }}
            title="Unlock"
          >
            <Lock size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
