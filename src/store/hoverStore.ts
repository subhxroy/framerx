import { create } from 'zustand'

/**
 * The element currently hovered, shared between the canvas and the Layers
 * panel for bidirectional highlight. Deliberately a SEPARATE store from the
 * editor store so high-frequency hover changes never re-render anything that
 * subscribes to editor state (elements, selection, canvas transform).
 */
interface HoverState {
  hoveredId: string | null
  /** 'canvas' | 'layers' — who set it, so each surface can style its own hover locally. */
  source: 'canvas' | 'layers' | null
  setHovered: (id: string | null, source?: 'canvas' | 'layers') => void
}

export const useHoverStore = create<HoverState>((set) => ({
  hoveredId: null,
  source: null,
  setHovered: (id, source = 'canvas') =>
    set((s) => (s.hoveredId === id ? s : { hoveredId: id, source: id ? source : null })),
}))
