import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export function useViewportBounds(containerRef: React.RefObject<HTMLDivElement | null>): Bounds {
  const canvas = useEditorStore((s) => s.canvas)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  const margin = 800
  const left = -canvas.x / canvas.scale - margin
  const top = -canvas.y / canvas.scale - margin
  const right = left + size.w / canvas.scale + margin * 2
  const bottom = top + size.h / canvas.scale + margin * 2

  return { left, top, right, bottom }
}

export function isElementVisible(
  elX: number,
  elY: number,
  elW: number,
  elH: number,
  bounds: Bounds
): boolean {
  return (
    elX + elW >= bounds.left &&
    elX <= bounds.right &&
    elY + elH >= bounds.top &&
    elY <= bounds.bottom
  )
}
