import { useCallback, useState } from 'react'
import { Link, Unlink } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { SizeMode } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'
import { getBPValue } from '@/lib/breakpointUtils'
import RespNumberInput from './RespNumberInput'
import NumberInput from './NumberInput'
import { flashElements } from '@/lib/flashElements'

const SIZE_LABEL: Record<SizeMode, string> = { fixed: 'Fixed', fill: 'Fill', hug: 'Hug' }

function SizeModeButton({ axis, mode, onClick }: { axis: 'W' | 'H'; mode: SizeMode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${axis === 'W' ? 'Width' : 'Height'}: ${SIZE_LABEL[mode]} (click to cycle)`}
      style={{
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        padding: '0 8px',
        borderRadius: 'var(--radius-sm)',
        background: mode === 'fixed' ? 'transparent' : 'var(--accent-bg)',
        border: mode === 'fixed' ? '1px solid var(--border)' : '1px solid var(--accent-border)',
        color: mode === 'fixed' ? 'var(--text-secondary)' : 'var(--accent)',
        cursor: 'pointer',
        fontSize: 'var(--text-xs)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{axis}</span>
      <span>{SIZE_LABEL[mode]}</span>
    </button>
  )
}

export default function LayoutSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const [aspectLocked, setAspectLocked] = useState(false)

  const isDesktop = activeBreakpoint === 'desktop'
  const single = selectedIds.length === 1 ? elements[selectedIds[0]] : null
  const multi = selectedIds.length > 1 ? selectedIds.map((id) => elements[id]).filter(Boolean) : null

  const updateWithBP = useCallback(
    (field: string, rawValue: number) => {
      if (!single) return
      const value = field === 'opacity' ? Math.max(0, Math.min(1, rawValue / 100)) : rawValue
      pushHistory()
      if (isDesktop) {
        applyChanges(single, { [field]: value } as any)
        // maintain aspect ratio when locked (desktop base only)
        if (aspectLocked && (field === 'width' || field === 'height') && single.width && single.height) {
          if (field === 'width') {
            applyChanges(single, { height: Math.round((value * single.height) / single.width) } as any)
          } else {
            applyChanges(single, { width: Math.round((value * single.width) / single.height) } as any)
          }
        }
      } else {
        const currentBp: Record<string, number | boolean> = single.breakpoints?.[activeBreakpoint]
          ? { ...(single.breakpoints[activeBreakpoint] as any) }
          : {}
        currentBp[field] = value
        updateElement(single.id, {
          breakpoints: { ...single.breakpoints, [activeBreakpoint]: currentBp as any },
        })
      }
    },
    [single, isDesktop, activeBreakpoint, aspectLocked, pushHistory, applyChanges, updateElement]
  )

  const cycleSize = useCallback(
    (axis: 'width' | 'height') => {
      if (!single) return
      const order: SizeMode[] = ['fixed', 'fill', 'hug']
      const cur = single.sizing?.[axis] ?? 'fixed'
      const next = order[(order.indexOf(cur) + 1) % order.length]
      pushHistory()
      applyChanges(single, {
        sizing: {
          width: single.sizing?.width ?? 'fixed',
          height: single.sizing?.height ?? 'fixed',
          [axis]: next,
        },
      })
    },
    [single, pushHistory, applyChanges]
  )

  const addOverride = useCallback(
    (field: string) => {
      if (!single || isDesktop) return
      pushHistory()
      const currentBp: Record<string, number | boolean> = single.breakpoints?.[activeBreakpoint]
        ? { ...(single.breakpoints[activeBreakpoint] as any) }
        : {}
      currentBp[field] = single[field as keyof typeof single] as number
      updateElement(single.id, {
        breakpoints: { ...single.breakpoints, [activeBreakpoint]: currentBp as any },
      })
    },
    [single, isDesktop, activeBreakpoint, pushHistory, updateElement]
  )

  const clearOverride = useCallback(
    (field: string) => {
      if (!single || isDesktop) return
      pushHistory()
      const currentBp: Record<string, any> = single.breakpoints?.[activeBreakpoint]
        ? { ...(single.breakpoints[activeBreakpoint] as any) }
        : {}
      delete currentBp[field]
      const newBps = { ...single.breakpoints } as any
      if (Object.keys(currentBp).length === 0) delete newBps[activeBreakpoint]
      else newBps[activeBreakpoint] = currentBp
      updateElement(single.id, { breakpoints: newBps })
    },
    [single, isDesktop, activeBreakpoint, pushHistory, updateElement]
  )

  // ---- Multi-select: apply to every selected element, show "Mixed" when values differ ----
  const applyMulti = useCallback(
    (field: string, rawValue: number) => {
      if (!multi) return
      const value = field === 'opacity' ? Math.max(0, Math.min(1, rawValue / 100)) : rawValue
      pushHistory()
      for (const e of multi) applyChanges(e, { [field]: value } as any)
      // Confirm the batch landed with a brief pulse on each affected element.
      flashElements(multi.map((e) => e.id))
    },
    [multi, pushHistory, applyChanges]
  )

  if (multi) {
    const valOf = (f: string): number => (multi[0] as any)[f]
    const isMixed = (f: string) =>
      multi.some((e) => (e as any)[f] !== (multi[0] as any)[f])
    const num = (field: string, label: string, suffix?: string) => (
      <NumberInput
        label={label}
        value={valOf(field)}
        mixed={isMixed(field)}
        onChange={(v) => applyMulti(field, v)}
        suffix={suffix}
      />
    )
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {num('x', 'X')}
          {num('y', 'Y')}
          {num('width', 'W')}
          {num('height', 'H')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {num('rotation', 'Rotation', '°')}
          <NumberInput
            label="Opacity"
            value={Math.round((valOf('opacity') ?? 1) * 100)}
            mixed={isMixed('opacity')}
            onChange={(v) => applyMulti('opacity', v)}
            suffix="%"
            min={0}
            max={100}
          />
        </div>
      </div>
    )
  }

  if (!single) return null
  const el = single

  const renderInput = (
    field: string,
    label: string,
    value: number,
    suffix?: string,
    min?: number,
    max?: number,
    step?: number
  ) => {
    if (isDesktop) {
      return (
        <NumberInput
          label={label}
          value={value}
          onChange={(v) => updateWithBP(field, v)}
          suffix={suffix}
          min={min}
          max={max}
          step={step}
        />
      )
    }
    return (
      <RespNumberInput
        label={label}
        value={value}
        field={field}
        elementId={el.id}
        onChange={(v) => updateWithBP(field, v)}
        onAddOverride={() => addOverride(field)}
        onClearOverride={() => clearOverride(field)}
        suffix={suffix}
        min={min}
        max={max}
        step={step}
      />
    )
  }

  const bpX = getBPValue(el, activeBreakpoint, 'x') as number | undefined
  const bpY = getBPValue(el, activeBreakpoint, 'y') as number | undefined
  const bpW = getBPValue(el, activeBreakpoint, 'width') as number | undefined
  const bpH = getBPValue(el, activeBreakpoint, 'height') as number | undefined
  const bpR = getBPValue(el, activeBreakpoint, 'rotation') as number | undefined
  const bpO = getBPValue(el, activeBreakpoint, 'opacity') as number | undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {renderInput('x', 'X', bpX ?? el.x)}
        {renderInput('y', 'Y', bpY ?? el.y)}
      </div>
      <div className="flex items-end gap-1">
        <div className="flex-1">{renderInput('width', 'W', bpW ?? el.width, undefined, 1)}</div>
        <button
          onClick={() => setAspectLocked((v) => !v)}
          title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          style={{
            height: 28,
            width: 24,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            color: aspectLocked ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {aspectLocked ? <Link size={13} /> : <Unlink size={13} />}
        </button>
        <div className="flex-1">{renderInput('height', 'H', bpH ?? el.height, undefined, 1)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SizeModeButton axis="W" mode={el.sizing?.width ?? 'fixed'} onClick={() => cycleSize('width')} />
        <SizeModeButton axis="H" mode={el.sizing?.height ?? 'fixed'} onClick={() => cycleSize('height')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {renderInput('rotation', 'Rotation', bpR ?? el.rotation, '°')}
        {renderInput('opacity', 'Opacity', Math.round((bpO ?? el.opacity) * 100), '%', 0, 100)}
      </div>
    </div>
  )
}
