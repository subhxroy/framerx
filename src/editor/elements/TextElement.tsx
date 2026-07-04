import { useEffect, useRef, useState, useCallback } from 'react'
import type { Element } from '@/store/editorStore'
import { useEditorStore } from '@/store/editorStore'
import { Bold, Italic, Underline, Strikethrough, Link, Heading1, Heading2, Heading3 } from 'lucide-react'

interface Props {
  element: Element
}

const inlineButtons = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'strikeThrough', icon: Strikethrough, label: 'Strikethrough' },
] as const

const headingButtons = [
  { cmd: 'formatBlock', value: '<h1>', tag: 'h1', icon: Heading1, label: 'Heading 1' },
  { cmd: 'formatBlock', value: '<h2>', tag: 'h2', icon: Heading2, label: 'Heading 2' },
  { cmd: 'formatBlock', value: '<h3>', tag: 'h3', icon: Heading3, label: 'Heading 3' },
] as const

export default function TextElement({ element }: Props) {
  if (!element.text) return null
  const t = element.text
  const editingId = useEditorStore((s) => s.editingId)
  const setEditingId = useEditorStore((s) => s.setEditingId)
  const updateElement = useEditorStore((s) => s.updateElement)
  const ref = useRef<HTMLDivElement>(null)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const [activeCmds, setActiveCmds] = useState<Set<string>>(new Set())

  const editing = editingId === element.id

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.innerHTML = t.content
      ref.current.focus()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const updateToolbarPos = useCallback(() => {
    if (!editing || !ref.current) {
      setToolbarPos(null)
      return
    }
    const rect = ref.current.getBoundingClientRect()
    setToolbarPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }, [editing])

  useEffect(() => {
    updateToolbarPos()
    window.addEventListener('resize', updateToolbarPos)
    window.addEventListener('scroll', updateToolbarPos)
    return () => {
      window.removeEventListener('resize', updateToolbarPos)
      window.removeEventListener('scroll', updateToolbarPos)
    }
  }, [updateToolbarPos])

  useEffect(() => {
    if (!editing) {
      setActiveCmds(new Set())
      return
    }
    const checkActive = () => {
      const sel = window.getSelection()
      if (!sel || !ref.current?.contains(sel.anchorNode)) return
      const active = new Set<string>()
      for (const { cmd } of inlineButtons) {
        if (document.queryCommandState(cmd)) active.add(cmd)
      }
      const block = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '')
      if (block) active.add(block)
      setActiveCmds(active)
    }
    document.addEventListener('selectionchange', checkActive)
    checkActive()
    return () => document.removeEventListener('selectionchange', checkActive)
  }, [editing])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    ref.current?.focus()
  }

  const handleLink = () => {
    const url = prompt('Enter URL:')
    if (url) exec('createLink', url)
    ref.current?.focus()
  }

  const commit = () => {
    if (ref.current) {
      const next = ref.current.innerHTML
      if (next !== t.content) updateElement(element.id, { text: { ...t, content: next } })
    }
    setEditingId(null)
    setToolbarPos(null)
  }

  const base: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    fontFamily: (t as any).fontFamily || 'inherit',
    color: t.color,
    textAlign: t.textAlign,
    lineHeight: t.lineHeight,
    letterSpacing: `${t.letterSpacing}px`,
    textTransform: ((t as any).textTransform || 'none') as any,
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  if (editing) {
    return (
      <>
        {toolbarPos && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: 'fixed',
              top: toolbarPos.top,
              left: toolbarPos.left,
              transform: 'translateX(-50%) translateY(-100%)',
              zIndex: 999,
              background: 'var(--panel-bg)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-dropdown)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '4px 6px',
              pointerEvents: 'auto',
            }}
          >
            {inlineButtons.map(({ cmd, icon: Icon, label }) => (
              <button
                key={cmd}
                title={label}
                onMouseDown={() => exec(cmd)}
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 4,
                  background: activeCmds.has(cmd) ? 'var(--surface-3)' : 'transparent',
                  color: activeCmds.has(cmd) ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} />
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
            <button
              title="Link"
              onMouseDown={handleLink}
              style={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Link size={13} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
            {headingButtons.map(({ tag, value, icon: Icon, label }) => (
              <button
                key={tag}
                title={label}
                onMouseDown={() => exec(value)}
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 4,
                  background: activeCmds.has(tag) ? 'var(--surface-3)' : 'transparent',
                  color: activeCmds.has(tag) ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') {
              e.preventDefault()
              commit()
            }
          }}
          style={{
            ...base,
            overflow: 'visible',
            outline: '1px solid var(--accent)',
            cursor: 'text',
            pointerEvents: 'auto',
          }}
        />
      </>
    )
  }

  return <div style={base} dangerouslySetInnerHTML={{ __html: t.content }} />
}
