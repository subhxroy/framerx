import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'

const FITS = ['cover', 'contain', 'fill'] as const

export default function ImageSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const setImage = useCallback(
    (changes: Partial<NonNullable<typeof el>['image']>) => {
      if (!el) return
      pushHistory()
      updateElement(el.id, {
        image: {
          src: el.image?.src ?? '',
          objectFit: el.image?.objectFit ?? 'cover',
          ...changes,
        },
      })
    },
    [el, pushHistory, updateElement]
  )

  if (!el || el.type !== 'image') return null
  const img = el.image

  return (
    <div className="flex flex-col gap-2">
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        Image
      </span>

      <input
        value={img?.src ?? ''}
        onChange={(e) => setImage({ src: e.target.value })}
        placeholder="Image URL"
        style={{
          height: 28,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-base)',
          padding: '0 8px',
          outline: 'none',
        }}
      />

      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Fit</span>
        <div className="flex gap-1">
          {FITS.map((fit) => {
            const active = (img?.objectFit ?? 'cover') === fit
            return (
              <button
                key={fit}
                onClick={() => setImage({ objectFit: fit })}
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'capitalize',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                }}
              >
                {fit}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
