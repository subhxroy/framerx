import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import NumberInput from './NumberInput'


export default function AutoLayoutSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

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
      applyChanges(el, {
        autoLayout: { ...current, ...changes },
      })
    },
    [el, pushHistory, applyChanges]
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

  if (selectedIds.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-tertiary)', fontSize: 10 }}>
        Editing {selectedIds.length} layers
      </div>
    )
  }

  if (!el || (el.type !== 'frame' && el.type !== 'stack')) return null

  const isOn = al?.enabled ?? false

  return (
    <div className="flex flex-col gap-2">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>
          Enabled
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
            transition: 'background var(--duration-slow)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
            borderRadius: '50%',
            background: 'var(--text-inverse)',
            position: 'absolute',
            top: 4,
            left: isOn ? 14 : 4,
              transition: 'left var(--duration-slow)',
            }}
          />
        </button>
      </div>

      {isOn && (
        <>
          <div className="flex gap-1">
            {(['horizontal', 'horizontal-reverse', 'vertical', 'vertical-reverse'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setAutoLayout({ direction: d })}
                title={d}
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  background: (al?.direction ?? 'vertical') === d ? 'var(--accent-bg)' : 'transparent',
                  border: (al?.direction ?? 'vertical') === d ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  color: (al?.direction ?? 'vertical') === d ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {d === 'horizontal' && '→'}
                {d === 'horizontal-reverse' && '←'}
                {d === 'vertical' && '↓'}
                {d === 'vertical-reverse' && '↑'}
              </button>
            ))}
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
                  title={a}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    background: al?.alignItems === a ? 'var(--accent-bg)' : 'transparent',
                    border: al?.alignItems === a ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    color: al?.alignItems === a ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    {a === 'start' && <><rect x="1" y="1" width="12" height="3" rx="1" fill="currentColor"/><rect x="1" y="10" width="6" height="3" rx="1" fill="currentColor" opacity="0.5"/></>}
                    {a === 'center' && <><rect x="1" y="1" width="12" height="3" rx="1" fill="currentColor"/><rect x="4" y="10" width="6" height="3" rx="1" fill="currentColor" opacity="0.5"/></>}
                    {a === 'end' && <><rect x="1" y="1" width="12" height="3" rx="1" fill="currentColor"/><rect x="7" y="10" width="6" height="3" rx="1" fill="currentColor" opacity="0.5"/></>}
                    {a === 'stretch' && <><rect x="1" y="1" width="12" height="3" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="3" rx="1" fill="currentColor" opacity="0.5"/></>}
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Justify
            </span>
            <div className="flex gap-1">
              {(['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'] as const).map((j) => (
                <button
                  key={j}
                  onClick={() => setAutoLayout({ justifyContent: j })}
                  title={j}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    background: al?.justifyContent === j ? 'var(--accent-bg)' : 'transparent',
                    border: al?.justifyContent === j ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    color: al?.justifyContent === j ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    {j === 'start' && <><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="6" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.5"/></>}
                    {j === 'center' && <><rect x="3" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5"/><rect x="8" y="2" width="3" height="10" rx="1" fill="currentColor"/></>}
                    {j === 'end' && <><rect x="5" y="4" width="3" height="8" rx="1" fill="currentColor" opacity="0.5"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/></>}
                    {j === 'space-between' && <><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/></>}
                    {j === 'space-around' && <><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5"/></>}
                    {j === 'space-evenly' && <><rect x="1" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5"/><rect x="6" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5"/><rect x="11" y="2" width="2" height="10" rx="1" fill="currentColor"/></>}
                  </svg>
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
                transition: 'background var(--duration-slow)',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--text-inverse)',
                  position: 'absolute',
                  top: 4,
                  left: al?.wrap ? 14 : 4,
                  transition: 'left var(--duration-slow)',
                }}
              />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
