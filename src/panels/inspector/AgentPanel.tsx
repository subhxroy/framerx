import { useState, useRef, useCallback } from 'react'
import { Sparkles, SendHorizonal, StopCircle } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { chat, abortAI, buildElementContext, parsePatchResponse, SYSTEM_PROMPT, type AIChatMessage } from '@/lib/ai'

interface ChatEntry {
  role: 'user' | 'assistant' | 'error'
  text: string
}

export default function AgentPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [streaming, setStreaming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const elementId = selectedIds[0]
  const element = elementId ? elements[elementId] : null

  const sendPrompt = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming || !elementId || !element) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setStreaming(true)

    const context = buildElementContext(element)
    const msgs: AIChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Current element state:\n${context}\n\nUser request: ${text}` },
    ]

    let fullResponse = ''
    setMessages((prev) => [...prev, { role: 'assistant', text: '' }])

    try {
      fullResponse = await chat(msgs, (chunk) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, text: last.text + chunk }
          }
          return next
        })
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessages((prev) => [...prev.slice(0, -1), { role: 'error', text: 'Cancelled.' }])
      } else {
        setMessages((prev) => [...prev.slice(0, -1), { role: 'error', text: err?.message ?? 'AI request failed' }])
      }
      setStreaming(false)
      return
    }

    setStreaming(false)

    // Parse and apply the patch
    const patch = parsePatchResponse(fullResponse)
    if (patch) {
      pushHistory()
      // Filter out autoLayout padding string shorthand
      const cleanPatch = { ...patch }
      if (cleanPatch.style?.padding && typeof cleanPatch.style.padding === 'string') {
        // padding strings like "12px 24px" aren't valid style props in our model
        delete cleanPatch.style.padding
      }
      updateElement(elementId, cleanPatch)
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, text: last.text + '\n\n✅ Changes applied.' }
        }
        return next
      })
    } else {
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, text: last.text + '\n\n⚠️ Could not parse response as element changes.' }
        }
        return next
      })
    }
  }, [input, streaming, elementId, element, pushHistory, updateElement])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendPrompt()
    }
  }

  const hasKey = !!import.meta.env.VITE_OPENROUTER_API_KEY

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!hasKey && (
        <div style={{
          padding: 10, margin: 8, borderRadius: 6,
          background: 'rgba(255, 160, 0, 0.08)',
          border: '1px solid rgba(255, 160, 0, 0.2)',
          fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          Set <code style={{ color: '#e0e0e0' }}>VITE_OPENROUTER_API_KEY</code> in <code style={{ color: '#e0e0e0' }}>.env</code> to enable AI.
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 5,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sparkles size={12} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Design Agent</p>
        </div>
        {streaming && (
          <button
            onClick={abortAI}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'transparent', border: 'none',
              color: '#f44', cursor: 'pointer', fontSize: 10,
              padding: '2px 6px', borderRadius: 3,
            }}
          >
            <StopCircle size={11} /> Stop
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!elementId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: '#555', fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
              Select an element to<br />get AI suggestions
            </p>
          </div>
        )}

        {messages.length === 0 && elementId && (
          <div style={{
            padding: 10, background: 'var(--surface-1)',
            border: '1px solid var(--border)', borderRadius: 6,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Try asking: <br />
              <span style={{ color: '#888' }}>• "Change the background color to blue"</span><br />
              <span style={{ color: '#888' }}>• "Make this text bold and larger"</span><br />
              <span style={{ color: '#888' }}>• "Add padding around this element"</span><br />
              <span style={{ color: '#888' }}>• "Convert to a button"</span>
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: msg.role === 'user'
                ? 'var(--surface-2)'
                : msg.role === 'error'
                  ? 'rgba(255,68,68,0.08)'
                  : 'var(--surface-1)',
              border: '1px solid var(--border)',
              fontSize: 10,
              color: msg.role === 'error' ? '#f66' : 'var(--text-primary)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.role === 'user' && (
              <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 9, display: 'block', marginBottom: 2 }}>You</span>
            )}
            {msg.role === 'assistant' && (
              <span style={{ fontWeight: 600, color: '#a78bfa', fontSize: 9, display: 'block', marginBottom: 2 }}>AI</span>
            )}
            {msg.text || (i === messages.length - 1 && streaming ? '\u2022\u2022\u2022' : '')}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 4, padding: 8, borderTop: '1px solid var(--border)' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!elementId || streaming}
          placeholder={streaming ? 'Waiting for AI...' : elementId ? 'Describe what you want...' : 'Select an element first'}
          style={{
            flex: 1, height: 30, padding: '0 8px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 5, color: 'var(--text-primary)',
            fontSize: 11, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={sendPrompt}
          disabled={!input.trim() || streaming || !elementId}
          style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input.trim() && !streaming && elementId
              ? 'linear-gradient(135deg, #667eea, #764ba2)'
              : 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 5, cursor: input.trim() && !streaming && elementId ? 'pointer' : 'default',
            color: input.trim() && !streaming && elementId ? '#fff' : '#555',
            flexShrink: 0, transition: 'all 0.1s',
          }}
        >
          <SendHorizonal size={13} />
        </button>
      </div>
    </div>
  )
}
