import { useState, useMemo } from 'react'
import { useEditorStore, type Interaction } from '@/store/editorStore'
import { SPRING, SPRING_PRESETS } from '@/lib/motionTokens'

interface Props {
  elementId: string
}

const triggers = ['hover', 'tap', 'appear', 'inview'] as const
const animProps = ['opacity', 'scale', 'x', 'y', 'rotate'] as const

const EASING_PRESETS = [
  { label: 'Linear', value: 'linear', bezier: [0, 0, 1, 1] as const },
  { label: 'Ease In', value: 'easeIn', bezier: [0.42, 0, 1, 1] as const },
  { label: 'Ease Out', value: 'easeOut', bezier: [0, 0, 0.58, 1] as const },
  { label: 'Ease In Out', value: 'easeInOut', bezier: [0.42, 0, 0.58, 1] as const },
] as const

const ALL_PRESETS = [...EASING_PRESETS, { label: 'Custom', value: 'custom' }] as const

function getActivePreset(easing: string | undefined): string {
  if (!easing) return 'easeOut'
  const n = easing.trim().toLowerCase().replace(/[-_]/g, '')
  for (const p of EASING_PRESETS) {
    if (n === p.value.toLowerCase()) return p.value
  }
  return 'custom'
}

function getBezier(easing: string | undefined): [number, number, number, number] | null {
  if (!easing) return null
  const n = easing.trim().toLowerCase().replace(/[-_]/g, '')
  for (const p of EASING_PRESETS) {
    if (n === p.value.toLowerCase()) return [...p.bezier]
  }
  const match = easing.match(/cubic-bezier\(([^)]+)\)/)
  const str = match?.[1] ?? easing
  const nums = str.split(',').map(s => parseFloat(s.trim()))
  if (nums.length === 4 && nums.every(v => !isNaN(v))) return nums as [number, number, number, number]
  return null
}

function EasingCurve({ easing, w = 24, h = 16 }: { easing?: string; w?: number; h?: number }) {
  const d = useMemo(() => {
    const b = getBezier(easing ?? 'easeOut')
    if (!b) return `M 0,${h} L ${w},0`
    const [x1, y1, x2, y2] = b
    return `M 0,${h} C ${x1*w},${(1-y1)*h} ${x2*w},${(1-y2)*h} ${w},0`
  }, [easing, w, h])
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0, display: 'block', borderRadius: 'var(--radius-sm)' }}>
      <rect width={w} height={h} rx="2" fill="var(--surface-2)" />
      <line x1="0" y1={h} x2={w} y2="0" stroke="var(--border-strong)" strokeWidth="1" />
      <path d={d} stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function AnimationSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const [adding, setAdding] = useState(false)

  const interactions = element?.interactions?.filter((i) => i.animation) ?? []

  const addInteraction = (trigger: (typeof triggers)[number]) => {
    pushHistory()
    const newInt: Interaction = {
      id: `int_${Date.now()}`,
      trigger,
      animation: {
        opacity: [1, 1],
        scale: [1, 1],
      },
      transition: { type: 'spring', stiffness: 500, damping: 30, mass: 1 },
    }
    const current = element?.interactions ?? []
    updateElement(elementId, { interactions: [...current, newInt] })
    setAdding(false)
  }

  const removeInteraction = (intId: string) => {
    pushHistory()
    const current = element?.interactions ?? []
    updateElement(elementId, {
      interactions: current.filter((i) => i.id !== intId),
    })
  }

  const updateInteraction = (intId: string, updates: Partial<Interaction>) => {
    const current = element?.interactions ?? []
    updateElement(elementId, {
      interactions: current.map((i) => (i.id === intId ? { ...i, ...updates } : i)),
    })
  }

  const updateAnimValue = (
    intId: string,
    prop: string,
    index: 0 | 1,
    val: number
  ) => {
    const int = interactions.find((i) => i.id === intId)
    if (!int?.animation) return
    const anim = { ...int.animation }
    const current = anim[prop as keyof typeof anim] as [number, number] | undefined
    if (current) {
      const next: [number, number] = [...current]
      next[index] = val
      ;(anim as any)[prop] = next
    }
    updateInteraction(intId, { animation: anim })
  }

  const usedTriggers = new Set(interactions.map((i) => i.trigger))

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
          Animation
        </span>
        {!adding && usedTriggers.size < 3 && (
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
        <div className="flex flex-col gap-1 mb-2 p-1 rounded" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {triggers
            .filter((t) => !usedTriggers.has(t))
            .map((t) => (
              <button
                key={t}
                style={{ 
                  color: 'var(--text-secondary)', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '11px',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--duration-normal), color var(--duration-normal)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
                onClick={() => addInteraction(t)}
              >
                {t === 'hover' ? 'On Hover' : t === 'tap' ? 'On Tap' : t === 'appear' ? 'On Appear' : 'On Scroll'}
              </button>
            ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {interactions.map((int) => (
          <div
            key={int.id}
            className="rounded p-2"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2 pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                {int.trigger === 'hover' ? 'On Hover' : int.trigger === 'tap' ? 'On Tap' : int.trigger === 'appear' ? 'On Appear' : 'On Scroll'}
              </span>
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
                onClick={() => removeInteraction(int.id)}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              {animProps.map((prop) => {
                const val = int.animation?.[prop as keyof typeof int.animation]
                if (!val) return null
                return (
                  <div key={prop} className="flex items-center justify-between">
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-secondary)', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      width: 50
                    }}>
                      {prop}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        style={{ 
                          width: '45px',
                          height: '22px',
                          background: 'var(--surface-2)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          padding: '0 4px',
                          outline: 'none',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                        }}
                        value={val[0]}
                        step={prop === 'opacity' || prop === 'scale' ? 0.05 : 1}
                        onChange={(e) => updateAnimValue(int.id, prop, 0, parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→</span>
                      <input
                        type="number"
                        style={{ 
                          width: '45px',
                          height: '22px',
                          background: 'var(--surface-2)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          padding: '0 4px',
                          outline: 'none',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                        }}
                        value={val[1]}
                        step={prop === 'opacity' || prop === 'scale' ? 0.05 : 1}
                        onChange={(e) => updateAnimValue(int.id, prop, 1, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <select
                style={{ 
                  height: '22px',
                  background: 'var(--surface-2)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '10px',
                  padding: '0 4px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                value={int.transition?.type ?? 'spring'}
                onChange={(e) =>
                  updateInteraction(int.id, {
                    transition: {
                      ...int.transition,
                      type: e.target.value as 'tween' | 'spring',
                    },
                  } as Partial<Interaction>)
                }
              >
                <option value="tween">Tween</option>
                <option value="spring">Spring</option>
              </select>
              {int.transition?.type === 'tween' ? (
                <div className="flex flex-col gap-1.5" style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      style={{ 
                        width: '38px',
                        height: '22px',
                        background: 'var(--surface-2)', 
                        color: 'var(--text-primary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        padding: '0 4px',
                        outline: 'none',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                      }}
                      value={int.transition?.duration ?? 0.2}
                      step={0.1}
                      placeholder="Dur"
                      title="Duration (s)"
                      onChange={(e) =>
                        updateInteraction(int.id, {
                          transition: { ...int.transition, type: 'tween', duration: parseFloat(e.target.value) || 0.2 } as any,
                        } as Partial<Interaction>)
                      }
                    />
                    <EasingCurve easing={int.transition?.easing} />
                  </div>
                  <div className="flex items-center gap-1">
                    {ALL_PRESETS.map((preset) => {
                      const active = getActivePreset(int.transition?.easing)
                      const isActive = preset.value === active
                      return (
                        <button
                          key={preset.value}
                          style={{
                            flex: 1, height: '20px', fontSize: '9px',
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                            color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: preset.value === 'custom' && !isActive ? 'pointer' : isActive ? 'default' : 'pointer',
                            fontFamily: 'inherit',
                            padding: '0 4px',
                            transition: 'background var(--duration-normal), color var(--duration-normal)',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'
                          }}
                          onClick={() => {
                            if (preset.value === 'custom') return
                            updateInteraction(int.id, {
                              transition: { ...int.transition, type: 'tween', easing: preset.value } as any,
                            } as Partial<Interaction>)
                          }}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                  {getActivePreset(int.transition?.easing) === 'custom' && (
                    <input
                      style={{
                        width: '100%',
                        height: '22px',
                        background: 'var(--surface-2)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        padding: '0 4px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                      value={int.transition?.easing ?? ''}
                      placeholder="0.42, 0, 0.58, 1"
                      title="Custom cubic-bezier"
                      onChange={(e) =>
                        updateInteraction(int.id, {
                          transition: { ...int.transition, type: 'tween', easing: e.target.value } as any,
                        } as Partial<Interaction>)
                      }
                    />
                  )}
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Spring</span>
                  <div className="flex items-center gap-1 mb-1.5 w-full" style={{ gridColumn: '1 / -1' }}>
                    {(
                      [
                        { label: 'Snappy', ...SPRING_PRESETS.snappy },
                        { label: 'Smooth', ...SPRING_PRESETS.smooth },
                        { label: 'Bouncy', ...SPRING_PRESETS.bouncy },
                      ].map(p => ({ label: p.label, s: p.stiffness, d: p.damping, m: p.mass }))
                    ).map((preset) => {
                      const isActive =
                        int.transition?.stiffness === preset.s &&
                        int.transition?.damping === preset.d &&
                        (int.transition?.mass ?? 1) === preset.m
                      return (
                        <button
                          key={preset.label}
                          style={{
                            flex: 1, height: '20px', fontSize: '9px',
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                            color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'background var(--duration-normal), color var(--duration-normal)',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'
                          }}
                          onClick={() =>
                            updateInteraction(int.id, {
                              transition: {
                                type: 'spring',
                                stiffness: preset.s,
                                damping: preset.d,
                                mass: preset.m,
                              },
                            } as Partial<Interaction>)
                          }
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="number"
                    style={{ 
                      width: '38px',
                      height: '22px',
                      background: 'var(--surface-2)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={int.transition?.stiffness ?? SPRING.content.stiffness}
                    placeholder="Stiff"
                    title="Stiffness"
                    onChange={(e) =>
                      updateInteraction(int.id, {
                        transition: { ...int.transition, type: 'spring', stiffness: parseFloat(e.target.value) || SPRING.content.stiffness } as any,
                      } as Partial<Interaction>)
                    }
                  />
                  <input
                    type="number"
                    style={{ 
                      width: '38px',
                      height: '22px',
                      background: 'var(--surface-2)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={int.transition?.damping ?? SPRING.content.damping}
                    placeholder="Damp"
                    title="Damping"
                    onChange={(e) =>
                      updateInteraction(int.id, {
                        transition: { ...int.transition, type: 'spring', damping: parseFloat(e.target.value) || SPRING.content.damping } as any,
                      } as Partial<Interaction>)
                    }
                  />
                  <input
                    type="number"
                    style={{ 
                      width: '38px',
                      height: '22px',
                      background: 'var(--surface-2)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      padding: '0 4px',
                      outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                    value={int.transition?.mass ?? 1}
                    step={0.1}
                    placeholder="Mass"
                    title="Mass"
                    onChange={(e) =>
                      updateInteraction(int.id, {
                        transition: { ...int.transition, type: 'spring', mass: parseFloat(e.target.value) || 1 } as any,
                      } as Partial<Interaction>)
                    }
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
