import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { POPOVER_MOTION } from '@/lib/motionTokens'

interface Props {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  children: ReactNode
  /** Preferred side. Default 'bottom'. Flips to stay in viewport. */
  placement?: 'bottom' | 'top'
  /** px gap between anchor and popover. Default 6. */
  offset?: number
  /** Transform-origin for the scale-in. Defaults to top so it grows from the anchor. */
  align?: 'start' | 'center' | 'end'
}

/**
 * Portalled, viewport-clamped popover with the canonical scale+fade enter and
 * faster fade-only exit (POPOVER_MOTION). Positions itself against `anchorEl`
 * via getBoundingClientRect — the previous color picker floated at 0,0.
 * Closes on outside click, Escape, scroll, and resize.
 */
export default function Popover({
  open,
  anchorEl,
  onClose,
  children,
  placement = 'bottom',
  offset = 6,
  align = 'start',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; origin: string } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorEl) return
    const place = () => {
      const a = anchorEl.getBoundingClientRect()
      const el = ref.current
      const w = el?.offsetWidth ?? 220
      const h = el?.offsetHeight ?? 200
      const margin = 8

      let top = placement === 'bottom' ? a.bottom + offset : a.top - h - offset
      // Flip if it would overflow the chosen side.
      if (placement === 'bottom' && top + h > window.innerHeight - margin) top = a.top - h - offset
      if (placement === 'top' && top < margin) top = a.bottom + offset
      top = Math.max(margin, Math.min(top, window.innerHeight - h - margin))

      let left = align === 'end' ? a.right - w : align === 'center' ? a.left + a.width / 2 - w / 2 : a.left
      left = Math.max(margin, Math.min(left, window.innerWidth - w - margin))

      setPos({ left, top, origin: top >= a.bottom ? 'top center' : 'bottom center' })
    }
    place()
    // Re-place once after mount so we use the real measured size.
    const raf = requestAnimationFrame(place)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [open, anchorEl, placement, offset, align, onClose])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Defer so the click that opened the popover doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, anchorEl, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={POPOVER_MOTION.initial}
          animate={POPOVER_MOTION.animate}
          exit={POPOVER_MOTION.exit}
          style={{
            position: 'fixed',
            left: pos?.left ?? -9999,
            top: pos?.top ?? -9999,
            transformOrigin: pos?.origin ?? 'top center',
            zIndex: 1000,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
