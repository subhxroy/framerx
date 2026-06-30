import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import NumberInput from './NumberInput'

const dirIcons = {
  horizontal: '→',
  vertical: '↓',
}

export default function AutoLayoutSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const al = el?.autoLayout

  const setAutoLayout = useCallback(
    (changes: Record<string, any>) => {
      if (!el) return
      const current = el.autoLayout || {
        enabled: false,
        direction: 'vertical',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        alignItems: 'stretch',
        justifyContent: 'start',
        wrap: false,
      }
      pushHistory()
      updateElement(el.id, {
        autoLayout: { ...current, ...changes },
      })
    },
    [el, pushHistory, updateElement]
  )

  const handleToggle = useCallback(() => {
    if (!al?.enabled) {
      setAutoLayout({
        enabled: true,
        direction: 'vertical',
        gap: 8,
        padding: { top: 12, right: 12, bottom: 12, left: 12 },
        alignItems: 'stretch',
        justifyContent: 'start',
        wrap: false,
      })
    } else {
      setAutoLayout({ enabled: false })
    }
  }, [al, setAutoLayout])

  if (!el || (el.type !== 'frame' && el.type !== 'stack')) return null

  const isOn = al?.enabled ?? false

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          Auto Layout
        </span>
        <button
          onClick={handleToggle}
          style={{
            width: 28,
            height: 16,
            borderRadius: 8,
            background: isOn ? 'var(--accent)' : 'var(--surface-3)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.15s',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 2,
              left: isOn ? 14 : 2,
              transition: 'left 0.15s',
            }}
          />
        </button>
      </div>

      {isOn && (
        <>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Direction
            </span>
            <div className="flex gap-1">
              {(['horizontal', 'vertical'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setAutoLayout({ direction: dir })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    background: al?.direction === dir ? 'var(--accent-bg)' : 'transparent',
                    border: al?.direction === dir ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    color: al?.direction === dir ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {dirIcons[dir]}
                </button>
              ))}
            </div>
          </div>

          <NumberInput
            label="Gap"
            value={al?.gap ?? 0}
            onChange={(v) => setAutoLayout({ gap: Math.max(0, v) })}
            suffix="px"
            min={0}
          />

          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Padding
            </span>
            <div className="grid grid-cols-4 gap-1">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <NumberInput
                  key={side}
                  label={side.charAt(0).toUpperCase()}
                  value={al?.padding[side] ?? 0}
                  onChange={(v) =>
                    setAutoLayout({
                      padding: { ...al!.padding, [side]: Math.max(0, v) },
                    })
                  }
                  suffix="px"
                  min={0}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Align Items
            </span>
            <div className="flex gap-1">
              {(['start', 'center', 'end', 'stretch'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAutoLayout({ alignItems: a })}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    background: al?.alignItems === a ? 'var(--accent-bg)' : 'transparent',
                    border: al?.alignItems === a ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    color: al?.alignItems === a ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Justify
            </span>
            <div className="flex gap-1">
              {(['start', 'center', 'end', 'space-between', 'space-around'] as const).map((j) => (
                <button
                  key={j}
                  onClick={() => setAutoLayout({ justifyContent: j })}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    background: al?.justifyContent === j ? 'var(--accent-bg)' : 'transparent',
                    border: al?.justifyContent === j ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    color: al?.justifyContent === j ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {j === 'space-between' ? '⇿' : j === 'space-around' ? '⤄' : j}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Wrap
            </span>
            <button
              onClick={() => setAutoLayout({ wrap: !al?.wrap })}
              style={{
                width: 28,
                height: 16,
                borderRadius: 8,
                background: al?.wrap ? 'var(--accent)' : 'var(--surface-3)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: al?.wrap ? 14 : 2,
                  transition: 'left 0.15s',
                }}
              />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
