import { useState, useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { exportSingleElementHTML } from '@/lib/export/htmlExporter'
import { Check, Copy } from 'lucide-react'

export default function CodePanel() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const [copied, setCopied] = useState(false)

  const elementId = selectedIds[0]
  const element = elements[elementId]

  const [codeError, setCodeError] = useState('')
  const code = useMemo(() => {
    if (!element) return ''
    try {
      setCodeError('')
      return exportSingleElementHTML(element, elements)
    } catch (e) {
      setCodeError('Error generating HTML code')
      return ''
    }
  }, [element, elements])

  if (!element) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', gap: 8,
      }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 11, lineHeight: 1.6 }}>
          Select an element to view its HTML/CSS code.
        </p>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>
          HTML & CSS Output
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 4,
            background: copied ? 'rgba(52,199,89,0.1)' : 'var(--surface-2)',
            border: `1px solid ${copied ? 'rgba(52,199,89,0.3)' : 'var(--border)'}`,
            color: copied ? 'var(--success)' : 'var(--text-primary)',
            cursor: 'pointer', fontSize: 10,
            transition: 'all var(--duration-slow)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code viewer */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px', background: 'var(--canvas-bg)' }}>
        {codeError ? (
          <p style={{ color: 'var(--error)', fontSize: 11 }}>{codeError}</p>
        ) : (
          <pre style={{
            margin: 0, padding: 0, width: '100%', height: '100%',
            overflow: 'auto', fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: 'var(--text-primary)', lineHeight: 1.5, tabSize: 2,
          }}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
