import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const mountedRef = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])

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
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
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

    try {
      const html = exportToHTML(elements, rootElementIds, { includeAnimations: true })
      const result = await deployToSupabase(html, projectId)
      if (!mountedRef.current) return
      if (result.success && result.url) {
        setDeployResult({ url: result.url })
      } else {
        setDeployError(result.error || 'Deploy failed')
      }
    } catch (e) {
      if (mountedRef.current) setDeployError('Export failed: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
    if (mountedRef.current) setDeploying(false)
  }, [elements, rootElementIds, hasElements, projectId])

  const handleCopyLink = useCallback(async () => {
    if (!deployResult?.url) return
    try {
      await navigator.clipboard.writeText(deployResult.url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch { /* ignore */ }
  }, [deployResult])


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(5, 5, 5, 0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          width: 760,
          height: 480,
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-blue-400" />
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
              Publish / Export
            </span>
          </div>
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-150"
            style={{
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div
            className="flex flex-col gap-4 p-4"
            style={{
              width: 220,
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(15, 15, 15, 0.5)',
              overflowY: 'auto',
            }}
          >
            {/* Export format */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Export Options
              </span>
              <div className="flex flex-col gap-1">
                {(['html', 'react'] as const).map((f) => {
                  const isActive = format === f
                  return (
                    <button
                      key={f}
                      className="text-xs px-2.5 py-2 rounded-md text-left flex items-center justify-between transition-all duration-150 group"
                      style={{
                        background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: '1px solid ' + (isActive ? 'var(--border-subtle)' : 'transparent'),
                        cursor: 'pointer',
                        fontWeight: isActive ? 500 : 400,
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }
                      }}
                      onClick={() => setFormat(f)}
                    >
                      <span>{f === 'html' ? 'HTML + CSS' : 'React Component'}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />

            {/* Actions */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Local Files
              </span>
              <div className="flex flex-col gap-1">
                <button
                  className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all duration-150"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: hasElements ? 'pointer' : 'not-allowed',
                    opacity: hasElements ? 1 : 0.5,
                  }}
                  onMouseEnter={e => {
                    if (hasElements) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (hasElements) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.transform = 'none'
                    }
                  }}
                  onClick={handleDownload}
                  disabled={!hasElements}
                >
                  <Download size={13} className="text-gray-400" />
                  <span>Download Code</span>
                </button>
                <button
                  className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all duration-150"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: hasElements ? 'pointer' : 'not-allowed',
                    opacity: hasElements ? 1 : 0.5,
                  }}
                  onMouseEnter={e => {
                    if (hasElements) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (hasElements) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.transform = 'none'
                    }
                  }}
                  onClick={handleCopy}
                  disabled={!hasElements}
                >
                  {copiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-gray-400" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />

            {/* Deploy */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Production Host
              </span>

              <div className="flex flex-col gap-1.5">
                <button
                  className="flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-md font-semibold transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-active) 100%)',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    cursor: deploying ? 'wait' : hasElements ? 'pointer' : 'not-allowed',
                    opacity: deploying || !hasElements ? 0.6 : 1,
                    boxShadow: hasElements ? '0 4px 12px rgba(0, 153, 255, 0.25)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (hasElements && !deploying) {
                      e.currentTarget.style.transform = 'scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 153, 255, 0.4)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (hasElements && !deploying) {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 153, 255, 0.25)'
                    }
                  }}
                  onClick={handleDeploy}
                  disabled={deploying || !hasElements}
                >
                  {deploying ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deploying...
                    </span>
                  ) : (
                    <>
                      <Globe size={13} />
                      <span>Publish Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Deploy result */}
            {deployResult && (
              <div
                className="flex flex-col gap-2 mt-1 p-3 rounded-lg border transition-all duration-200"
                style={{
                  background: 'rgba(74, 222, 128, 0.04)',
                  borderColor: 'rgba(74, 222, 128, 0.15)',
                }}
              >
                <div className="flex items-center gap-1.5 text-green-400 font-medium text-[11px]">
                  <Check size={12} />
                  <span>Successfully Published!</span>
                </div>
                <div className="flex flex-col gap-1">
                  <a
                    href={deployResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] underline truncate text-blue-400 hover:text-blue-300"
                  >
                    {deployResult.url}
                  </a>
                  <button
                    className="flex items-center justify-center gap-1.5 text-[10px] mt-1 py-1 rounded bg-[rgba(255,255,255,0.04)] text-gray-300 hover:text-white border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] cursor-pointer transition-all"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Website URL'}</span>
                  </button>
                </div>
              </div>
            )}

            {deployError && (
              <div
                className="p-2.5 rounded-lg border text-xs mt-1"
                style={{
                  background: 'rgba(248, 113, 113, 0.04)',
                  borderColor: 'rgba(248, 113, 113, 0.15)',
                  color: 'var(--error)',
                }}
              >
                {deployError}
              </div>
            )}
          </div>

          {/* Code preview */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {format === 'html' ? 'index.html' : 'Page.tsx'}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                {format === 'html' ? 'HTML + CSS' : 'React Component'}
              </span>
            </div>
            <textarea
              readOnly
              className="flex-1 w-full p-4 font-mono text-[11px] leading-relaxed resize-none bg-transparent"
              style={{
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                tabSize: 2,
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
