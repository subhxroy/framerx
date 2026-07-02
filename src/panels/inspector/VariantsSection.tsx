import { useState, useCallback } from 'react'
import { Copy } from 'lucide-react'
import { useEditorStore, type ComponentVariant } from '@/store/editorStore'

interface Props {
  elementId: string
}

function generateId() {
  return `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

const COMMON_FIELDS = [
  { label: 'Background color', path: 'style.backgroundColor', type: 'color' },
  { label: 'Border radius', path: 'style.borderRadius', type: 'number' },
  { label: 'Opacity', path: 'opacity', type: 'number' },
  { label: 'Scale', path: 'scale', type: 'number' },
  { label: 'Text color', path: 'style.color', type: 'color' },
  { label: 'Box shadow', path: 'style.boxShadow', type: 'text' },
  { label: 'Border width', path: 'style.borderWidth', type: 'number' },
  { label: 'Border color', path: 'style.borderColor', type: 'color' },
  { label: 'Rotation', path: 'rotate', type: 'number' },
]

function OverrideRow({
  fieldPath,
  value,
  onChange,
  onRemove,
  element,
}: {
  fieldPath: string
  value: any
  onChange: (field: string, val: any) => void
  onRemove: () => void
  element: any
}) {
  const isColor =
    typeof value === 'string' &&
    (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || COMMON_FIELDS.some((f) => f.path === fieldPath && f.type === 'color'))
  const isNumber =
    typeof value === 'number' || COMMON_FIELDS.some((f) => f.path === fieldPath && f.type === 'number')

  // Read base value for context
  const parts = fieldPath.split('.')
  let baseVal: any = undefined
  if (parts.length === 1) baseVal = element?.[parts[0]]
  else if (parts.length === 2) baseVal = element?.[parts[0]]?.[parts[1]]

  return (
    <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
      <input
        type="text"
        style={{
          width: 80,
          flexShrink: 0,
          height: '20px',
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '9px',
          padding: '0 4px',
          outline: 'none',
          fontFamily: 'monospace',
        }}
        value={fieldPath}
        onChange={(e) => onChange(e.target.value, value)}
        placeholder="field.path"
      />
      {isColor ? (
        <div className="flex items-center gap-1" style={{ flex: 1 }}>
          <input
            type="color"
            style={{
              width: 22,
              height: 20,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            value={typeof value === 'string' && value.startsWith('#') ? value : '#000000'}
            onChange={(e) => {
              const hex = e.target.value
              onChange(fieldPath, hex)
            }}
          />
          <input
            type="text"
            style={{
              flex: 1,
              height: '20px',
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '9px',
              padding: '0 4px',
              outline: 'none',
              fontFamily: 'monospace',
            }}
            value={String(value ?? '')}
            onChange={(e) => onChange(fieldPath, e.target.value)}
          />
        </div>
      ) : (
        <input
          type={isNumber ? 'number' : 'text'}
          style={{
            flex: 1,
            height: '20px',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '9px',
            padding: '0 4px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            onChange(fieldPath, isNumber ? (raw === '' ? '' : Number(raw)) : raw)
          }}
          placeholder={baseVal !== undefined ? String(baseVal) : ''}
        />
      )}
      <button
        style={{
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: '1',
          padding: '0 4px',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onClick={onRemove}
      >
        {'\u00D7'}
      </button>
    </div>
  )
}

export default function VariantsSection({ elementId }: Props) {
  const element = useEditorStore((s) => s.elements[elementId])
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const variants = element?.variants ?? []

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const addVariant = useCallback(() => {
    pushHistory()
    const newVariant: ComponentVariant = {
      id: generateId(),
      name: `Variant ${variants.length + 1}`,
      overrides: {},
      triggerOn: 'hover',
    }
    updateElement(elementId, { variants: [...variants, newVariant] })
    setExpanded((prev) => ({ ...prev, [newVariant.id]: true }))
  }, [elementId, variants, pushHistory, updateElement])

  const removeVariant = useCallback(
    (variantId: string) => {
      pushHistory()
      updateElement(elementId, {
        variants: variants.filter((v) => v.id !== variantId),
      })
    },
    [elementId, variants, pushHistory, updateElement]
  )

  const duplicateVariant = useCallback(
    (variantId: string) => {
      pushHistory()
      const source = variants.find((v) => v.id === variantId)
      if (!source) return
      const copy: ComponentVariant = {
        id: generateId(),
        name: source.name + ' Copy',
        overrides: JSON.parse(JSON.stringify(source.overrides)),
        triggerOn: source.triggerOn,
      }
      const idx = variants.findIndex((v) => v.id === variantId)
      const next = [...variants]
      next.splice(idx + 1, 0, copy)
      updateElement(elementId, { variants: next })
      setExpanded((prev) => ({ ...prev, [copy.id]: true }))
    },
    [elementId, variants, pushHistory, updateElement]
  )

  const updateVariant = useCallback(
    (variantId: string, patch: Partial<ComponentVariant>) => {
      updateElement(elementId, {
        variants: variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)),
      })
    },
    [elementId, variants, updateElement]
  )

  const setOverride = useCallback(
    (variantId: string, field: string, val: any) => {
      const variant = variants.find((v) => v.id === variantId)
      if (!variant) return
      const overrides = { ...variant.overrides }
      if (val === undefined || val === '') {
        delete overrides[field]
      } else {
        overrides[field] = val
      }
      updateVariant(variantId, { overrides })
    },
    [variants, updateVariant]
  )

  const removeOverride = useCallback(
    (variantId: string, field: string) => {
      const variant = variants.find((v) => v.id === variantId)
      if (!variant) return
      const overrides = { ...variant.overrides }
      delete overrides[field]
      updateVariant(variantId, { overrides })
    },
    [variants, updateVariant]
  )

  const addCommonField = useCallback(
    (variantId: string, path: string) => {
      const variant = variants.find((v) => v.id === variantId)
      if (!variant || variant.overrides[path] !== undefined) return
      const overrides = { ...variant.overrides, [path]: '' }
      updateVariant(variantId, { overrides })
    },
    [variants, updateVariant]
  )

  if (!element?.componentId) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          Variants
        </span>
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
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onClick={addVariant}
        >
          + Add
        </button>
      </div>

      {variants.length === 0 && (
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Create variant states (hover, tap, etc.) for this component.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {variants.map((variant) => {
          const isExpanded = expanded[variant.id] ?? false
          const overrideKeys = Object.keys(variant.overrides)
          const unusedCommon = COMMON_FIELDS.filter((f) => !(f.path in variant.overrides))

          return (
            <div
              key={variant.id}
              className="rounded"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              {/* Header row — clickable to expand */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '8px 8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => toggleExpand(variant.id)}
              >
                <span style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  transition: 'color var(--duration-normal)',
                }}>
                  {isExpanded ? '\u25BE' : '\u25B8'} {variant.name}
                  {overrideKeys.length > 0 && (
                    <span style={{ color: 'var(--accent)', marginLeft: 4, fontSize: 9 }}>
                      ({overrideKeys.length})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '1',
                      padding: '4px 4px',
                      borderRadius: 4,
                      transition: 'all var(--duration-normal)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Duplicate variant"
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateVariant(variant.id)
                    }}
                  >
                    <Copy size={11} />
                  </button>
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeVariant(variant.id)
                    }}
                  >
                    {'\u00D7'}
                  </button>
                </div>
              </div>

              {/* Trigger selector (always visible) */}
              <div
                className="flex items-center gap-2"
                style={{ padding: '0 8px 6px' }}
              >
                <span style={{
                  fontSize: '9px',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  Trigger
                </span>
                <select
                  style={{
                    flex: 1,
                    height: '20px',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '9px',
                    padding: '0 4px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  value={variant.triggerOn ?? ''}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      triggerOn: (e.target.value || undefined) as ComponentVariant['triggerOn'],
                    })
                  }
                >
                  <option value="">None (base)</option>
                  <option value="hover">Hover</option>
                  <option value="tap">Tap</option>
                  <option value="focus">Focus</option>
                </select>
              </div>

              {/* Expanded override editor */}
              {isExpanded && (
                <div style={{ padding: '0 8px 6px', borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
                  {/* Quick-add common fields */}
                  {unusedCommon.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
                        {unusedCommon.slice(0, 4).map((field) => (
                          <button
                            key={field.path}
                            style={{
                              fontSize: '8px',
                              padding: '4px 4px',
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              lineHeight: '18px',
                            }}
                            onClick={() => {
                              pushHistory()
                              addCommonField(variant.id, field.path)
                            }}
                            title={field.label}
                          >
                            +{field.label}
                          </button>
                        ))}
                        {unusedCommon.length > 4 && (
                          <select
                            style={{
                              fontSize: '8px',
                              height: '20px',
                              background: 'var(--surface-2)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0 4px',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                pushHistory()
                                addCommonField(variant.id, e.target.value)
                              }
                            }}
                          >
                            <option value="">More...</option>
                            {unusedCommon.slice(4).map((f) => (
                              <option key={f.path} value={f.path}>{f.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Override rows */}
                  {overrideKeys.length === 0 && (
                    <p style={{ margin: '0 0 8px', fontSize: 9, color: 'var(--text-tertiary)' }}>
                      No overrides yet. Add a field above or type one below.
                    </p>
                  )}

                  {overrideKeys.map((field) => (
                    <OverrideRow
                      key={field}
                      fieldPath={field}
                      value={variant.overrides[field]}
                      onChange={(newField, val) => {
                        pushHistory()
                        if (newField === field) {
                          setOverride(variant.id, field, val)
                        } else {
                          // Field path changed — remove old, add new
                          const overrides = { ...variant.overrides }
                          delete overrides[field]
                          overrides[newField] = val
                          updateVariant(variant.id, { overrides })
                        }
                      }}
                      onRemove={() => {
                        pushHistory()
                        removeOverride(variant.id, field)
                      }}
                      element={element}
                    />
                  ))}

                  {/* Add custom field */}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="+ custom field..."
                      style={{
                        flex: 1,
                        height: '20px',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '9px',
                        padding: '0 4px',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          pushHistory()
                          setOverride(variant.id, e.currentTarget.value.trim(), '')
                          e.currentTarget.value = ''
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          pushHistory()
                          setOverride(variant.id, e.target.value.trim(), '')
                          e.target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
