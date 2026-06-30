import { useState, useCallback, useMemo } from 'react'
import { Search } from 'lucide-react'
import { componentDefinitions } from './ComponentDefinitions'

const categories = Array.from(
  new Set(componentDefinitions.map((c) => c.category))
)

export default function ComponentsPanel() {
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories)
  )

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

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-1.5 flex-1 px-2 rounded"
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
        {Object.entries(grouped).map(([category, defs]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-1 w-full px-3 py-1.5"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              <span style={{ transform: expandedCategories.has(category) ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                ▶
              </span>
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
                      onDragStart={(e) => handleDragStart(e, def.id)}
                      className="flex flex-col items-center justify-center rounded p-2 gap-1 cursor-grab active:cursor-grabbing"
                      style={{
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border)',
                        height: 64,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'
                      }}
                      title={def.description}
                    >
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
        {Object.keys(grouped).length === 0 && search && (
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
