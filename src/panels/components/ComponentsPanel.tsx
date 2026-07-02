import { useState, useCallback, useMemo } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { componentDefinitions } from './ComponentDefinitions'

const categories = Array.from(
  new Set(componentDefinitions.map((c) => c.category))
)

export default function ComponentsPanel() {
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories)
  )

  const componentMasters = useEditorStore((s) => s.componentMasters)
  const elements = useEditorStore((s) => s.elements)
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds)

  const userComponents = useMemo(() => {
    return Object.entries(componentMasters).map(([compId, elId]) => ({
      compId,
      elId,
      name: elements[elId]?.name ?? 'Unknown',
    }))
  }, [componentMasters, elements])

  const filteredUser = useMemo(() => {
    if (!search.trim()) return userComponents
    const q = search.toLowerCase()
    return userComponents.filter((uc) => uc.name.toLowerCase().includes(q))
  }, [search, userComponents])

  const filtered = useMemo(() => {
    if (!search.trim()) return componentDefinitions
    const q = search.toLowerCase()
    return componentDefinitions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [search])

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const handleDragStart = useCallback(
    (e: React.DragEvent, data: string, mime: string) => {
      e.dataTransfer.setData(mime, data)
      e.dataTransfer.effectAllowed = 'copy'
    },
    []
  )

  const handleGoToMaster = useCallback((elId: string) => {
    setSelectedIds([elId])
  }, [setSelectedIds])

  const handlePresetDragStart = useCallback(
    (e: React.DragEvent, defId: string) => {
      e.dataTransfer.setData('text/plain', defId)
      e.dataTransfer.effectAllowed = 'copy'
    },
    []
  )

  const grouped = useMemo(() => {
    const map: Record<string, typeof componentDefinitions> = {}
    for (const def of filtered) {
      if (!map[def.category]) map[def.category] = []
      map[def.category].push(def)
    }
    return map
  }, [filtered])

  const showUser = filteredUser.length > 0
  const showPresets = Object.keys(grouped).length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-2 flex-1 px-2 rounded"
          style={{
            height: 28,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-base)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* User components */}
        {showUser && (
          <div>
            <div
              className="flex items-center gap-1 w-full px-3 py-2"
              style={{
                color: 'var(--text-tertiary)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Your Components
            </div>
            <div className="px-2 pb-2">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: '1fr 1fr' }}
              >
                {filteredUser.map((uc) => (
                  <div
                    key={uc.compId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, uc.compId, 'text/x-framer-master')}
                    onClick={() => handleGoToMaster(uc.elId)}
                    className="flex flex-col items-center justify-center rounded p-2 gap-1 cursor-pointer"
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      height: 64,
                      transition: 'background var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'
                    }}
                    title={`Click to select — drag to add instance`}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                        <path d="M9 3v18" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {uc.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preset component categories */}
        {showPresets && (
          <div style={{ borderTop: showUser ? '1px solid var(--border)' : undefined }}>
            {Object.entries(grouped).map(([category, defs]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-1 w-full px-3 py-2"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid var(--border)',
                    color: 'var(--text-tertiary)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <ChevronRight
                    size={10}
                    style={{
                      color: 'var(--text-muted)',
                      transform: expandedCategories.has(category) ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform var(--duration-fast)',
                    }}
                  />
                  {category}
                </button>
                {expandedCategories.has(category) && (
                  <div className="px-2 pb-2">
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: '1fr 1fr' }}
                    >
                      {defs.map((def) => (
                        <div
                          key={def.id}
                          draggable
                          onDragStart={(e) => handlePresetDragStart(e, def.id)}
                          className="flex flex-col items-center justify-center rounded p-2 gap-1 cursor-grab active:cursor-grabbing"
                          style={{
                            background: 'var(--surface-1)',
                            border: '1px solid var(--border)',
                            height: 64,
                            transition: 'background var(--duration-fast)',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'
                          }}
                          title={def.description}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 14,
                          }}>
                            {def.category === 'Navigation' ? '☰' : def.category === 'Forms' ? '✓' : def.category === 'Layout' ? '⊞' : 'T'}
                          </div>
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-primary)',
                              textAlign: 'center',
                              lineHeight: 1.3,
                            }}
                          >
                            {def.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!showUser && !showPresets && search && (
          <div className="flex items-center justify-center h-20 px-3">
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No components match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
