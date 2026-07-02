import { useRef, useState, useCallback } from 'react'
import { Upload, Link2, Trash2, Image as ImageIcon } from 'lucide-react'
import { useAssetsStore } from '@/store/assetsStore'
import type { Asset } from '@/store/assetsStore'
import { useEditorStore } from '@/store/editorStore'

export const ASSET_DND_TYPE = 'application/x-framer-asset'

export default function AssetsPanel() {
  const assets = useAssetsStore((s) => s.assets)
  const addAssetFromFile = useAssetsStore((s) => s.addAssetFromFile)
  const addAssetFromUrl = useAssetsStore((s) => s.addAssetFromUrl)
  const removeAsset = useAssetsStore((s) => s.removeAsset)
  const fileRef = useRef<HTMLInputElement>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const addElement = useEditorStore((s) => s.addElement)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      setUploading(true)
      setUploadError('')
      try {
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) await addAssetFromFile(file)
        }
      } catch (e) {
        setUploadError('Failed to upload one or more files')
      }
      setUploading(false)
    },
    [addAssetFromFile]
  )

  const placeAsset = useCallback(
    (asset: Asset) => {
      // if a single image element is selected, set its source; else create a new image
      const { selectedIds, elements } = useEditorStore.getState()
      pushHistory()
      const sel = selectedIds.length === 1 ? elements[selectedIds[0]] : null
      if (sel && sel.type === 'image') {
        updateElement(sel.id, { image: { src: asset.src, objectFit: sel.image?.objectFit ?? 'cover' } })
        return
      }
      const w = asset.width ? Math.min(asset.width, 400) : 240
      const ratio = asset.width && asset.height ? asset.height / asset.width : 160 / 240
      const id = addElement({
        type: 'image',
        name: asset.name,
        x: 120,
        y: 120,
        width: w,
        height: Math.round(w * ratio),
        image: { src: asset.src, objectFit: 'cover' },
      })
      useEditorStore.getState().setSelectedIds([id])
    },
    [addElement, updateElement, pushHistory]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-3)',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button
          onClick={() => setShowUrl((v) => !v)}
          title="Add from URL"
          style={{
            width: 30,
            height: 30,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius-sm)',
            background: showUrl ? 'var(--accent-bg)' : 'var(--surface-3)',
            border: 'none',
            color: showUrl ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Link2 size={13} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {showUrl && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://image.url/photo.jpg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim()) {
                addAssetFromUrl(url.trim())
                setUrl('')
                setShowUrl(false)
              }
            }}
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
        </div>
      )}

      {uploadError && (
        <div style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', color: 'var(--error)' }}>
          {uploadError}
        </div>
      )}
      {/* Grid */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
        {assets.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ height: '100%', gap: 8, color: 'var(--text-muted)' }}
          >
            <ImageIcon size={28} strokeWidth={1.5} />
            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              Upload images to use<br />on your canvas
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy'
                  e.dataTransfer.setData(
                    ASSET_DND_TYPE,
                    JSON.stringify({ src: asset.src, width: asset.width, height: asset.height, name: asset.name })
                  )
                }}
                onDoubleClick={() => placeAsset(asset)}
                title={`${asset.name} — drag to canvas or double-click to place`}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  cursor: 'grab',
                }}
              >
                <img
                  src={asset.src}
                  alt={asset.name}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="opacity-0 group-hover:opacity-100"
                  title="Delete asset"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    transition: 'opacity var(--duration-normal)',
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
