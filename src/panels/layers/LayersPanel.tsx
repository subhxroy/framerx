import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Copy, FileText, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useHoverStore } from '@/store/hoverStore'
import LayerRow from './LayerRow'
import ScrollArea from '@/components/ScrollArea'
import type { Element } from '@/store/editorStore'

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
  const [pageMenuId, setPageMenuId] = useState<string | null>(null)
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [pageName, setPageName] = useState('')
  const elements = useEditorStore((s) => s.elements)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const addElement = useEditorStore((s) => s.addElement)
  const duplicateElement = useEditorStore((s) => s.duplicateElement)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const setCanvas = useEditorStore((s) => s.setCanvas)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)
  const pageMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pageMenuId) return
    const handler = (e: MouseEvent) => {
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target as Node)) {
        setPageMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pageMenuId])

  const getPageAncestor = useCallback((id: string | undefined) => {
    if (!id) return null
    let current = id
    const seen = new Set<string>()
    while (current && elements[current] && !seen.has(current)) {
      seen.add(current)
      const parentId = elements[current].parentId
      if (!parentId) return current
      current = parentId
    }
    return null
  }, [elements])

  const activePageId = getPageAncestor(selectedIds[selectedIds.length - 1]) ?? rootElementIds[0] ?? null

  const focusPage = useCallback((id: string) => {
    const page = useEditorStore.getState().elements[id]
    if (!page) return
    setSelectedIds([id])
    setCanvas({
      x: 120 - page.x * 0.62,
      y: 48 - page.y * 0.62,
      scale: 0.62,
    })
  }, [setCanvas, setSelectedIds])

  const createPage = useCallback(() => {
    const index = rootElementIds.length + 1
    const lastPage = rootElementIds.length > 0 ? elements[rootElementIds[rootElementIds.length - 1]] : null
    pushHistory()
    const id = addElement({
      type: 'frame',
      name: index === 1 ? 'Home' : `Page ${index}`,
      x: lastPage ? lastPage.x + lastPage.width + 96 : 96,
      y: lastPage ? lastPage.y : 72,
      width: 1440,
      height: 900,
      style: {
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: [{ x: 0, y: 18, blur: 60, spread: 0, color: 'rgba(0,0,0,0.35)' }],
      },
    })
    focusPage(id)
  }, [addElement, elements, focusPage, pushHistory, rootElementIds])

  const startRenamePage = useCallback((page: Element) => {
    setPageMenuId(null)
    setRenamingPageId(page.id)
    setPageName(page.name)
  }, [])

  const submitRenamePage = useCallback((id: string) => {
    const nextName = pageName.trim()
    setRenamingPageId(null)
    if (!nextName || nextName === elements[id]?.name) return
    pushHistory()
    updateElement(id, { name: nextName })
  }, [elements, pageName, pushHistory, updateElement])

  const duplicatePage = useCallback((id: string) => {
    setPageMenuId(null)
    pushHistory()
    duplicateElement(id)
  }, [duplicateElement, pushHistory])

  const removePage = useCallback((id: string) => {
    setPageMenuId(null)
    if (rootElementIds.length <= 1) return
    pushHistory()
    deleteElement(id)
    const next = rootElementIds.find((rootId) => rootId !== id)
    if (next) focusPage(next)
  }, [deleteElement, focusPage, pushHistory, rootElementIds])

  // Auto-scroll a row into view when it's selected or hovered on the canvas,
  // so canvas ↔ Layers stays in sync even when the target is scrolled off.
  const hoveredId = useHoverStore((s) => s.hoveredId)
  const hoverSource = useHoverStore((s) => s.source)
  const scrollTargetId = hoverSource === 'canvas' ? hoveredId : selectedIds[selectedIds.length - 1]
  useEffect(() => {
    if (!scrollTargetId || !listRef.current) return
    const row = listRef.current.querySelector(`[data-layer-row="${scrollTargetId}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [scrollTargetId])

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

      const activeId = active.id as string
      const overId = over.id as string
      const store = useEditorStore.getState()
      const activeEl = store.elements[activeId]
      const overEl = store.elements[overId]
      if (!activeEl || !overEl) return

      pushHistory()

      const activeParentId = activeEl.parentId ?? null
      const overParentId = overEl.parentId ?? null

      if (activeParentId === null && overParentId === null) {
        // Both root elements — existing behavior
        const oldIdx = rootElementIds.indexOf(activeId)
        const newIdx = rootElementIds.indexOf(overId)
        if (oldIdx < 0 || newIdx < 0) return
        useEditorStore.setState({
          rootElementIds: arrayMove(rootElementIds, oldIdx, newIdx),
        })
      } else if (activeParentId !== null && activeParentId === overParentId) {
        // Same parent — reorder within parent's children
        store.reorderChild(activeParentId, activeId, overId)
      }
      // Different parents or other cases — no-op (cross-parent reparenting not supported yet)
    },
    [rootElementIds, pushHistory]
  )

  const sortableIds = filteredItems.map(item => item.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 8px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="section-label" style={{ letterSpacing: '0.04em' }}>Pages</span>
          <button
            onClick={createPage}
            title="New page"
            style={{
              width: 20, height: 20, borderRadius: 4, border: 'none',
              background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background var(--duration-instant), color var(--duration-instant)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <Plus size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rootElementIds.map((id) => {
            const page = elements[id]
            if (!page) return null
            const isActive = activePageId === id
            const isRenaming = renamingPageId === id
            return (
              <div
                key={id}
                onClick={() => focusPage(id)}
                onDoubleClick={() => startRenamePage(page)}
                style={{
                  height: 28,
                  display: 'flex',
alignItems: 'center',
                  gap: 8,
                  padding: '0 4px 0 8px',
                  borderRadius: 4,
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  cursor: 'default',
                  transition: 'background var(--duration-instant), color var(--duration-instant)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <FileText size={12} strokeWidth={1.6} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                {isRenaming ? (
                  <input
                    autoFocus
                    value={pageName}
                    onChange={e => setPageName(e.target.value)}
                    onBlur={() => submitRenamePage(id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRenamePage(id)
                      if (e.key === 'Escape') setRenamingPageId(null)
                      e.stopPropagation()
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 20,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--accent)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      padding: '0 8px',
                      outline: 'none',
                      fontFamily: 'var(--font-ui)',
                    }}
                  />
                ) : (
                  <span style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                    fontWeight: isActive ? 500 : 400,
                  }}>
                    {page.name}
                  </span>
                )}
                <div style={{ position: 'relative', flexShrink: 0 }} ref={pageMenuId === id ? pageMenuRef : undefined}>
                  <button
                    onClick={e => { e.stopPropagation(); setPageMenuId(pageMenuId === id ? null : id) }}
                    title="Page actions"
                    style={{
                      width: 20, height: 20, borderRadius: 4, border: 'none',
                      background: pageMenuId === id ? 'var(--surface-3)' : 'transparent',
                      color: 'var(--text-tertiary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = pageMenuId === id ? 'var(--surface-3)' : 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                  {pageMenuId === id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: 22,
                        top: 0,
                        zIndex: 50,
                        width: 140,
                        padding: 4,
                        background: 'var(--panel-bg)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: 8,
                        boxShadow: 'var(--shadow-dropdown)',
                      }}
                    >
                      {[
                        { label: 'Rename', icon: <FileText size={11} />, action: () => startRenamePage(page), danger: false },
                        { label: 'Duplicate', icon: <Copy size={11} />, action: () => duplicatePage(id), danger: false },
                        { label: 'Delete', icon: <Trash2 size={11} />, action: () => removePage(id), danger: true, disabled: rootElementIds.length <= 1 },
                      ].map(item => (
                        <button
                          key={item.label}
                          disabled={item.disabled}
                          onClick={item.action}
                          style={{
                            width: '100%',
                            height: 25,
                            border: 'none',
                            borderRadius: 4,
                            background: 'transparent',
                            color: item.danger ? 'var(--error)' : 'var(--text-secondary)',
                            opacity: item.disabled ? 0.35 : 1,
                            cursor: item.disabled ? 'not-allowed' : 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0 8px',
                            fontFamily: 'var(--font-ui)',
                          }}
                          onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? 'rgba(255,59,48,0.08)' : 'var(--surface-2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search bar — Framer style: very low-profile */}
      <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={10} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-disabled)', pointerEvents: 'none',
          }} />
          <input
            placeholder="Search layers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 24, paddingRight: 8, height: 28,
              background: 'var(--toolbar-bg)',
              border: '1px solid transparent',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color var(--duration-instant)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
            onBlur={e => (e.target.style.borderColor = 'transparent')}
          />
        </div>
      </div>
      <ScrollArea style={{ paddingTop: 4, paddingBottom: 4 }}>
        <div ref={listRef}>
          {filteredItems.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 80, gap: 8, padding: '0 16px',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>
                {search ? 'No layers match' : 'No elements yet'}
              </p>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {filteredItems.filter((item) => elements[item.id]).map((item) => (
                <LayerRow
                  key={item.id}
                  element={elements[item.id]!}
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
      </ScrollArea>
    </div>
  )
}
