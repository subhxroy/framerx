import { create } from 'zustand'

export const RIGHT_MIN = 200
export const RIGHT_MAX = 400
export const RIGHT_DEFAULT = 256

export const COPILOT_WIDTH = 360

export type PanelTab = 'layers' | 'components' | 'assets' | 'cms' | 'copilot' | 'history' | 'transform'

export type InspectorTab = 'style' | 'agent' | 'code'

interface UIState {
  activeLeftPanel: PanelTab | null
  setActiveLeftPanel: (tab: PanelTab) => void
  rightTab: InspectorTab
  setRightTab: (tab: InspectorTab) => void
  collapsedSections: Record<string, boolean>
  toggleCollapsedSection: (id: string) => void
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  showRuler: boolean
  setShowRuler: (v: boolean) => void
  rightPanelWidth: number
  setRightPanelWidth: (w: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeLeftPanel: 'layers',
  setActiveLeftPanel: (tab) => set((s) => ({
    activeLeftPanel: s.activeLeftPanel === tab ? null : tab,
  })),
  rightTab: 'style',
  setRightTab: (tab) => set({ rightTab: tab }),
  collapsedSections: {},
  toggleCollapsedSection: (id) => set((s) => ({
    collapsedSections: { ...s.collapsedSections, [id]: !s.collapsedSections[id] },
  })),
  showGrid: true,
  setShowGrid: (v) => set({ showGrid: v }),
  showRuler: false,
  setShowRuler: (v) => set({ showRuler: v }),
  rightPanelWidth: RIGHT_DEFAULT,
  setRightPanelWidth: (w) => set({ rightPanelWidth: Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, w)) }),
}))
