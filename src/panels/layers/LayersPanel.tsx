import { useCallback, useState, useMemo } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Search } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import LayerRow from './LayerRow'

interface FlatItem {
  id: string
  depth: number
  hasChildren: boolean
}

function flattenTree(
  ids: string[],
  elements: Record<string, any>,
  collapsed: Set<string>,
  depth = 0,
): FlatItem[] {
  const result: FlatItem[] = []
  for (const id of ids) {
    result.push({ id, depth, hasChildren: elements[id]?.children?.length > 0 })
    if (
      elements[id]?.children?.length > 0 &&
      !collapsed.has(id)
    ) {
      result.push(...flattenTree(elements[id].children, elements, collapsed, depth + 1))
    }
  }
  return result
}

export default function LayersPanel() {
  const [search, setSearch] = useState('')
  const elements = useEditorStore((s) => s.elements)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const flatItems = useMemo(
    () => flattenTree(rootElementIds, elements, collapsed),
    [rootElementIds, elements, collapsed]
  )
  const filteredItems = useMemo(
    () => search.trim() ? flatItems.filter(item => elements[item.id]?.name.toLowerCase().includes(search.toLowerCase())) : flatItems,
    [flatItems, search, elements]
  )

  const handleSelect = useCallback(
    (id: string, shift: boolean) => {
      if (shift) {
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((sid) => sid !== id)
            : [...selectedIds, id]
        )
      } else {
        setSelectedIds([id])
      }
    },
    [selectedIds, setSelectedIds]
  )

  const handleToggleVisibility = useCallback(
    (id: string) => {
      const el = elements[id]
      if (!el) return
      pushHistory()
      updateElement(id, { visible: !el.visible })
    },
    [elements, pushHistory, updateElement]
  )

  const handleToggleLock = useCallback(
    (id: string) => {
      const el = elements[id]
      if (!el) return
      pushHistory()
      updateElement(id, { locked: !el.locked })
    },
    [elements, pushHistory, updateElement]
  )

  const handleToggleCollapse = useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    []
  )

  const handleRename = useCallback(
    (id: string, name: string) => {
      pushHistory()
      updateElement(id, { name })
    },
    [pushHistory, updateElement]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIdx = rootElementIds.indexOf(active.id as string)
      const newIdx = rootElementIds.indexOf(over.id as string)
      if (oldIdx < 0 || newIdx < 0) return

      pushHistory()
      useEditorStore.setState({
        rootElementIds: arrayMove(rootElementIds, oldIdx, newIdx),
      })
    },
    [rootElementIds, pushHistory]
  )

  const sortableIds = filteredItems.map(item => item.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search bar — Framer style: very low-profile */}
      <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={10} style={{
            position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
            color: '#3a3a3a', pointerEvents: 'none',
          }} />
          <input
            placeholder="Search layers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 22, paddingRight: 8, height: 26,
              background: '#161616',
              border: '1px solid transparent',
              borderRadius: 5, color: '#c0c0c0', fontSize: 11, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color 80ms',
            }}
            onFocus={e => (e.target.style.borderColor = '#2e2e2e')}
            onBlur={e => (e.target.style.borderColor = 'transparent')}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 3, paddingBottom: 4 }}>
        {filteredItems.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 80, gap: 6, padding: '0 16px',
          }}>
            <p style={{ color: '#2e2e2e', fontSize: 11, textAlign: 'center' }}>
              {search ? 'No layers match' : 'No elements yet'}
            </p>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {filteredItems.map((item) => (
              <LayerRow
                key={item.id}
                element={elements[item.id]}
                depth={item.depth}
                isSelected={selectedIds.includes(item.id)}
                isCollapsed={collapsed.has(item.id)}
                onSelect={handleSelect}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onToggleCollapse={handleToggleCollapse}
                onRename={handleRename}
                hasChildren={item.hasChildren}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
