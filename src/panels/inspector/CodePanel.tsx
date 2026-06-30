import { useState, useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { exportElementHtml } from '@/lib/exportHtml'
import { Check, Copy } from 'lucide-react'

export default function CodePanel() {
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements = useEditorStore(s => s.elements)
  const [copied, setCopied] = useState(false)

  const elementId = selectedIds[0]
  const element = elements[elementId]

  const code = useMemo(() => {
    if (!element) return ''
    return exportElementHtml(element, elements, { format: 'pretty' })
  }, [element, elements])

  if (!element) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', gap: 8,
      }}>
        <p style={{ color: '#4a4a4a', fontSize: 11, lineHeight: 1.6 }}>
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
        padding: '10px 12px', borderBottom: '1px solid #1e1e1e'
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#e0e0e0' }}>
          HTML & CSS Output
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 8px', borderRadius: 4,
            background: copied ? 'rgba(39,201,63,0.1)' : '#252525',
            border: `1px solid ${copied ? 'rgba(39,201,63,0.3)' : '#333'}`,
            color: copied ? '#27c93f' : '#ccc',
            cursor: 'pointer', fontSize: 10,
            transition: 'all 0.15s',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code viewer */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px', background: '#0d0d0d' }}>
        <pre style={{
          margin: 0, padding: 0, width: '100%', height: '100%',
          overflow: 'auto', fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: '#d4d4d4', lineHeight: 1.5, tabSize: 2,
        }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
