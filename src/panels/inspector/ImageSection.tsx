import { useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useInstanceUpdate } from './useInstanceUpdate'

const FITS = ['cover', 'contain', 'fill'] as const

export default function ImageSection() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const applyChanges = useInstanceUpdate()

  const el = selectedIds.length === 1 ? elements[selectedIds[0]] : null

  const setImage = useCallback(
    (changes: Partial<NonNullable<typeof el>['image']>) => {
      if (!el) return
      pushHistory()
      applyChanges(el, {
        image: {
          src: el.image?.src ?? '',
          objectFit: el.image?.objectFit ?? 'cover',
          ...changes,
        },
      })
    },
    [el, pushHistory, applyChanges]
  )

  if (selectedIds.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-tertiary)', fontSize: 10 }}>
        Editing {selectedIds.length} layers
      </div>
    )
  }

  if (!el || el.type !== 'image') return null
  const img = el.image
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setImage({ src: reader.result as string })
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [setImage]
  )

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

      <div className="flex gap-1">
        <input
          value={img?.src ?? ''}
          onChange={(e) => setImage({ src: e.target.value })}
          placeholder="Image URL"
          style={{
            flex: 1,
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
        <button
          onClick={handleUpload}
          title="Upload image"
          style={{
            height: 28,
            width: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Upload size={14} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {img?.src && (
        <div
          style={{
            width: '100%',
            height: 80,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          <img
            src={img.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

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
