import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WandSparkles, Sparkles, Pencil, Send, X, Trash2, Check, RotateCcw, Type, Move, Palette, LayoutPanelTop, Layers } from 'lucide-react'
import { useCopilotStore } from '@/store/copilotStore'
import { useUIStore } from '@/store/uiStore'
import { DURATION, EASE } from '@/lib/motionTokens'
import type { CopilotMessage } from '@/store/copilotStore'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  typography: <Type size={14} />,
  spacing: <Move size={14} />,
  color: <Palette size={14} />,
  layout: <LayoutPanelTop size={14} />,
  structure: <Layers size={14} />,
}

// ---------------------------------------------------------------------------
// Shimmer placeholder
// ---------------------------------------------------------------------------

function Shimmer() {
  return (
    <div style={{ padding: '8px 12px' }}>
      <div className="copilot-shimmer-line" style={{ height: 12, width: '80%', marginBottom: 8, borderRadius: 4, background: 'var(--surface-2)', opacity: 0.6 }} />
      <div className="copilot-shimmer-line" style={{ height: 12, width: '55%', marginBottom: 8, borderRadius: 4, background: 'var(--surface-2)', opacity: 0.4 }} />
      <div className="copilot-shimmer-line" style={{ height: 12, width: '65%', borderRadius: 4, background: 'var(--surface-2)', opacity: 0.5 }} />
      <style>{`
        @keyframes copilot-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .copilot-shimmer-line { animation: copilot-pulse 1.4s ease-in-out infinite; }
        .copilot-shimmer-line:nth-child(2) { animation-delay: 0.2s; }
        .copilot-shimmer-line:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: CopilotMessage }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'var(--accent-bg)',
          color: 'var(--text-primary)',
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {msg.content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        padding: '8px 12px',
        borderRadius: 8,
        background: 'var(--surface-2)',
        color: 'var(--text-primary)',
        fontSize: 13,
        lineHeight: 1.5,
        marginBottom: msg.explanation ? 8 : 0,
      }}>
        {msg.content}
      </div>

      {/* Explanation cards */}
      {msg.explanation && msg.explanation.categories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {msg.explanation.categories.map((cat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'var(--surface-1)',
              border: '0.5px solid var(--border)',
              fontSize: 12, lineHeight: 1.4,
            }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
                {CATEGORY_ICONS[cat.category] ?? <Layers size={14} />}
              </span>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.title}</span>
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>{cat.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage info */}
      {msg.usage && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
          {msg.usage.model} · {msg.usage.promptTokens + msg.usage.completionTokens} tokens
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CopilotPanel
// ---------------------------------------------------------------------------

export default function CopilotPanel() {
  const {
    messages, isGenerating, error, generatedOutput,
    sendMessage, clearConversation, acceptGeneration, discardGeneration,
  } = useCopilotStore()
  const setActiveLeftPanel = useUIStore((s) => s.setActiveLeftPanel)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'generate' | 'redesign'>('generate')
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  const handleSend = () => {
    if (!input.trim() || isGenerating) return
    sendMessage(input, mode)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%',
      background: 'var(--panel-bg)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 12px 8px',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WandSparkles size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>AI Copilot</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={clearConversation}
            title="Clear conversation"
            style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: 4, background: 'transparent',
              color: 'var(--text-tertiary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setActiveLeftPanel('copilot')}
            title="Close"
            style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: 4, background: 'transparent',
              color: 'var(--text-tertiary)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 12px',
        borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      }}>
        <button
          onClick={() => setMode('generate')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 6,
            border: 'none', fontSize: 11, fontWeight: 500,
            background: mode === 'generate' ? 'var(--accent-bg)' : 'var(--surface-1)',
            color: mode === 'generate' ? 'var(--accent)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            transition: `all ${DURATION.instant}s`,
          }}
        >
          <Sparkles size={12} />
          Generate
        </button>
        <button
          onClick={() => setMode('redesign')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 6,
            border: 'none', fontSize: 11, fontWeight: 500,
            background: mode === 'redesign' ? 'var(--accent-bg)' : 'var(--surface-1)',
            color: mode === 'redesign' ? 'var(--accent)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            transition: `all ${DURATION.instant}s`,
          }}
        >
          <Pencil size={12} />
          Redesign
        </button>
      </div>

      {/* Message list */}
      <div ref={listRef} style={{
        flex: 1, overflowY: 'auto', padding: 12,
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', textAlign: 'center',
            padding: 24, gap: 8,
          }}>
            <WandSparkles size={32} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              What would you like to create?
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
              Describe a design and I'll generate the elements.<br />
              Or select an element and switch to "Redesign" to modify it.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE.standard }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface-2)',
              }}
            >
              <Shimmer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons (shown when generation is ready) */}
      <AnimatePresence>
        {generatedOutput && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE.standard }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{
              display: 'flex', gap: 8, padding: '8px 12px',
              borderTop: '0.5px solid var(--border)',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <button
                onClick={acceptGeneration}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 12px', borderRadius: 6,
                  border: 'none', fontSize: 12, fontWeight: 500,
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                  cursor: 'pointer',
                }}
              >
                <Check size={14} />
                Accept
              </button>
              <button
                onClick={discardGeneration}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 12px', borderRadius: 6,
                  border: '0.5px solid var(--border)', fontSize: 12, fontWeight: 500,
                  background: 'var(--surface-1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
                Discard
              </button>
              <button
                onClick={() => {
                  // Refine: re-send with the "make it better" prompt
                  if (generatedOutput.explanation.summary) {
                    sendMessage('This looks good, but refine it: ' + generatedOutput.explanation.summary, mode)
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 12px', borderRadius: 6,
                  border: '0.5px solid var(--border)', fontSize: 12, fontWeight: 500,
                  background: 'var(--surface-1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                Refine
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.fast }}
            style={{
              background: 'var(--error)',
              color: '#fff',
              fontSize: 11,
              padding: '4px 12px',
              flexShrink: 0,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderTop: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'generate' ? 'Describe a design...' : 'Describe changes...'}
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 6,
            border: '0.5px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'var(--font-ui)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: 'none',
            background: input.trim() && !isGenerating ? 'var(--accent)' : 'var(--surface-2)',
            color: input.trim() && !isGenerating ? 'var(--text-inverse)' : 'var(--text-muted)',
            cursor: input.trim() && !isGenerating ? 'pointer' : 'default',
            transition: `all ${DURATION.instant}s`,
            flexShrink: 0,
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
