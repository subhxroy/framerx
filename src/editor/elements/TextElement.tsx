import { useEffect, useRef } from 'react'
import type { Element } from '@/store/editorStore'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  element: Element
}

export default function TextElement({ element }: Props) {
  if (!element.text) return null
  const t = element.text
  const editingId = useEditorStore((s) => s.editingId)
  const setEditingId = useEditorStore((s) => s.setEditingId)
  const updateElement = useEditorStore((s) => s.updateElement)
  const ref = useRef<HTMLDivElement>(null)

  const editing = editingId === element.id

  // Seed the editable node once when entering edit mode, then focus + select all.
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.textContent = t.content
      ref.current.focus()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const commit = () => {
    if (ref.current) {
      const next = ref.current.innerText
      if (next !== t.content) updateElement(element.id, { text: { ...t, content: next } })
    }
    setEditingId(null)
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
    )
  }

  return <div style={base}>{t.content}</div>
}
