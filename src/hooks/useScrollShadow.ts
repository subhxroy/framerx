import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/**
 * Tracks whether a scroll container has hidden content above/below, so a
 * component can fade in top/bottom shadows only when there's more to scroll.
 * A small premium detail (present in Figma/Framer, absent in "good enough" UIs).
 *
 * Usage:
 *   const { ref, top, bottom } = useScrollShadow<HTMLDivElement>()
 *   <div ref={ref} style={{ overflowY: 'auto' }} />
 *   // then render gradient overlays gated on `top` / `bottom`
 *
 * Returns booleans (not opacity) so the consumer controls the exact visual.
 */
export function useScrollShadow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [top, setTop] = useState(false)
  const [bottom, setBottom] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    // 1px slack absorbs sub-pixel rounding so shadows fully clear at the edges.
    setTop(scrollTop > 1)
    setBottom(scrollTop + clientHeight < scrollHeight - 1)
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // Content can grow/shrink without the container resizing (e.g. expanding
    // an inspector section) — observe the first child too when present.
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  return { ref, top, bottom, measure }
}
