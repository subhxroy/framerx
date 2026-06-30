import { useState, useMemo, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { exportToHTML, downloadHTML } from '@/lib/export/htmlExporter'
import { exportToReact, downloadReactComponent } from '@/lib/export/reactExporter'
import { deployToSupabase } from '@/lib/supabase-deploy'
import { useParams } from 'react-router-dom'
import { X, Download, Copy, Globe, Check } from 'lucide-react'

interface Props {
  onClose: () => void
}

type ExportFormat = 'html' | 'react'

export default function PublishModal({ onClose }: Props) {
  const elements = useEditorStore((s) => s.elements)
  const rootElementIds = useEditorStore((s) => s.rootElementIds)
  const { projectId } = useParams<{ projectId: string }>()
  const [format, setFormat] = useState<ExportFormat>('html')
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url: string } | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const hasElements = rootElementIds.length > 0

  const generatedCode = useMemo(() => {
    if (!hasElements) return ''
    try {
      return format === 'html'
        ? exportToHTML(elements, rootElementIds)
        : exportToReact(elements, rootElementIds)
    } catch {
      return 'Error generating export'
    }
  }, [elements, rootElementIds, format, hasElements])

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [generatedCode])

  const handleDownload = useCallback(() => {
    if (!hasElements) return
    if (format === 'html') {
      downloadHTML(elements, rootElementIds)
    } else {
      downloadReactComponent(elements, rootElementIds)
    }
  }, [format, elements, rootElementIds, hasElements])

  const handleDeploy = useCallback(async () => {
    if (!hasElements || !projectId) return
    setDeploying(true)
    setDeployResult(null)
    setDeployError(null)

    const html = exportToHTML(elements, rootElementIds, { includeAnimations: true })
    const result = await deployToSupabase(html, projectId)

    if (result.success && result.url) {
      setDeployResult({ url: result.url })
    } else {
      setDeployError(result.error || 'Deploy failed')
    }
    setDeploying(false)
  }, [elements, rootElementIds, hasElements, projectId])

  const handleCopyLink = useCallback(async () => {
    if (!deployResult?.url) return
    try {
      await navigator.clipboard.writeText(deployResult.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [deployResult])


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col rounded-lg overflow-hidden"
        style={{
          width: 720,
          maxHeight: '80vh',
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Publish / Export</span>
          <button
            className="flex items-center justify-center w-6 h-6 rounded"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className="flex flex-col gap-3 p-3" style={{ width: 200, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            {/* Export format */}
            <div>
              <span className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Export Format</span>
              <div className="flex flex-col gap-1">
                {(['html', 'react'] as const).map((f) => (
                  <button
                    key={f}
                    className="text-xs px-2 py-1.5 rounded text-left"
                    style={{
                      background: format === f ? 'var(--accent)' : 'var(--surface-2)',
                      color: format === f ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setFormat(f)}
                  >
                    {f === 'html' ? 'HTML + CSS' : 'React + Tailwind'}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              <button
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={handleDownload}
                disabled={!hasElements}
              >
                <Download size={12} /> Download
              </button>
              <button
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={handleCopy}
                disabled={!hasElements}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Deploy */}
            <div>
              <span className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Deploy to Supabase</span>

              <div className="flex flex-col gap-1.5">
                <button
                  className="flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: deploying ? 'wait' : 'pointer' }}
                  onClick={handleDeploy}
                  disabled={deploying || !hasElements}
                >
                  {deploying ? 'Deploying...' : <><Globe size={12} /> Deploy</>}
                </button>
              </div>
            </div>

            {/* Deploy result */}
            {deployResult && (
              <div className="flex flex-col gap-1 mt-1 p-2 rounded" style={{ background: 'var(--surface-2)' }}>
                <span className="text-xs" style={{ color: '#4ade80' }}>Deployed!</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--accent)' }}>{deployResult.url}</span>
                  <button
                    className="flex items-center justify-center w-5 h-5 rounded"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            )}

            {deployError && (
              <p className="text-xs mt-1" style={{ color: '#f87171' }}>{deployError}</p>
            )}
          </div>

          {/* Code preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center px-3 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {format === 'html' ? 'index.html' : 'Page.tsx'} — {format === 'html' ? 'HTML + CSS' : 'React + Tailwind'}
              </span>
            </div>
            <textarea
              readOnly
              className="flex-1 w-full p-3 font-mono text-xs leading-relaxed resize-none"
              style={{
                background: 'var(--surface-1)',
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
              }}
              value={generatedCode || '// Add elements to the canvas to generate export code'}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
