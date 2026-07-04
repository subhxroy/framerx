import { create } from 'zustand'

interface OverlayState {
  openOverlays: string[]
  openOverlay: (elementId: string) => void
  closeOverlay: (elementId: string) => void
  closeAllOverlays: () => void
  isOverlayOpen: (elementId: string) => boolean
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  openOverlays: [],
  openOverlay: (elementId) => set((state) => ({
    openOverlays: state.openOverlays.includes(elementId)
      ? state.openOverlays
      : [...state.openOverlays, elementId]
  })),
  closeOverlay: (elementId) => set((state) => ({
    openOverlays: state.openOverlays.filter(id => id !== elementId)
  })),
  closeAllOverlays: () => set({ openOverlays: [] }),
  isOverlayOpen: (elementId) => get().openOverlays.includes(elementId),
}))
