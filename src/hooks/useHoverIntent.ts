import { useCallback, useEffect, useRef, useState } from 'react'
import { DELAY } from '@/lib/motionTokens'

/**
 * Debounced hover. Returns `hovered` that only flips true after the pointer
 * has rested for DELAY.hoverIntent (60ms), and flips false instantly on leave.
 * Prevents outline strobing when the mouse sweeps across many dense targets.
 *
 * Usage:
 *   const { hovered, onEnter, onLeave } = useHoverIntent()
 *   <div onPointerEnter={onEnter} onPointerLeave={onLeave} />
 */
export function useHoverIntent(delay: number = DELAY.hoverIntent) {
  const [hovered, setHovered] = useState(false)
  const timer = useRef<number | null>(null)

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const onEnter = useCallback(() => {
    clear()
    timer.current = window.setTimeout(() => setHovered(true), delay)
  }, [delay])

  const onLeave = useCallback(() => {
    clear()
    setHovered(false)
  }, [])

  useEffect(() => clear, [])

  return { hovered, onEnter, onLeave }
}
