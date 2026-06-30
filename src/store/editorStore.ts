import { create } from 'zustand'

export type Tool = 'select' | 'frame' | 'text' | 'image' | 'rect' | 'ellipse'
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'
export type SizeMode = 'fixed' | 'fill' | 'hug'

export interface Element {
  id: string
  type: 'frame' | 'text' | 'image' | 'shape' | 'stack'
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  children: string[]
  parentId: string | null
  /** Width/height sizing behaviour. Absent ⇒ treated as 'fixed'. */
  sizing?: { width: SizeMode; height: SizeMode }
  style: {
    backgroundColor?: string
    borderRadius?: number
    // optional independent corners [topLeft, topRight, bottomRight, bottomLeft]
    borderRadiusCorners?: [number, number, number, number]
    border?: string
    overflow?: 'visible' | 'hidden'
    boxShadow?: ShadowDef[]
    blur?: number           // layer blur: filter: blur(Npx)
    backdropBlur?: number   // background blur: backdrop-filter: blur(Npx)
    strokeAlignment?: 'inside' | 'center' | 'outside'
    borderWidth?: number
    borderColor?: string
    borderStyle?: 'solid' | 'dashed' | 'dotted'
  }
  text?: {
    content: string
    fontSize: number
    fontWeight: number
    color: string
    textAlign: 'left' | 'center' | 'right'
    lineHeight: number
    letterSpacing: number
  }
  image?: {
    src: string
    objectFit: 'cover' | 'contain' | 'fill'
  }
  autoLayout?: {
    enabled: boolean
    direction: 'horizontal' | 'vertical'
    gap: number
    padding: { top: number; right: number; bottom: number; left: number }
    alignItems: 'start' | 'center' | 'end' | 'stretch'
    justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
    wrap: boolean
  }
  breakpoints?: {
    tablet?: BreakpointOverrides
    mobile?: BreakpointOverrides
  }
  interactions?: Interaction[]
  cmsBinding?: CMSBinding
}

export interface ShadowDef {
  x: number
  y: number
  blur: number
  spread: number
  color: string
}

export interface CMSBinding {
  collectionId: string
  fieldId: string
  isCollectionFrame?: boolean
  collectionFrameCollectionId?: string
}

export interface Interaction {
  id: string
  trigger: 'hover' | 'tap' | 'appear'
  animation?: {
    opacity?: [number, number]
    scale?: [number, number]
    x?: [number, number]
    y?: [number, number]
    rotate?: [number, number]
  }
  transition?: {
    type: 'tween' | 'spring'
    duration?: number
    easing?: string
    stiffness?: number
    damping?: number
  }
  action?: {
    type: 'navigate' | 'overlay'
    url?: string
    overlayId?: string
  }
}

export interface BreakpointOverrides {
  x?: number
  y?: number
  width?: number
  height?: number
  visible?: boolean
  opacity?: number
  rotation?: number
}

interface CanvasState {
  x: number
  y: number
  scale: number
}

interface EditorStore {
  elements: Record<string, Element>
  rootElementIds: string[]
  selectedIds: string[]
  editingId: string | null
  activeTool: Tool
  activeBreakpoint: Breakpoint
  previewMode: boolean
  canvas: CanvasState
  history: {
    entries: Array<Record<string, Element>>
    index: number
  }

  addElement: (element: Partial<Element>) => string
  addElementTree: (parts: Partial<Element>[], rootId: string) => string
  updateElement: (id: string, changes: Partial<Element>) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  moveElement: (id: string, x: number, y: number) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  groupSelection: () => void
  ungroup: (id: string) => void
  reorderChild: (parentId: string, childId: string, beforeId: string | null) => void
  setSelectedIds: (ids: string[]) => void
  setEditingId: (id: string | null) => void
  setActiveTool: (tool: Tool) => void
  setActiveBreakpoint: (breakpoint: Breakpoint) => void
  setPreviewMode: (preview: boolean) => void
  setCanvas: (state: Partial<CanvasState>) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

let nextId = 1
const generateId = () => `element_${nextId++}_${Date.now()}`

type ReorderDir = 'forward' | 'backward' | 'front' | 'back'

// Reorder an element within whichever ordered list it belongs to —
// its parent's children array, or the canvas root list.
function reorderSibling(
  state: { elements: Record<string, Element>; rootElementIds: string[] },
  id: string,
  dir: ReorderDir
): Partial<{ elements: Record<string, Element>; rootElementIds: string[] }> {
  const el = state.elements[id]
  if (!el) return {}
  const inParent = !!(el.parentId && state.elements[el.parentId])
  const list = inParent ? [...state.elements[el.parentId!].children] : [...state.rootElementIds]
  const idx = list.indexOf(id)
  if (idx < 0) return {}

  let target = idx
  if (dir === 'forward') target = Math.min(list.length - 1, idx + 1)
  else if (dir === 'backward') target = Math.max(0, idx - 1)
  else if (dir === 'front') target = list.length - 1
  else if (dir === 'back') target = 0
  if (target === idx) return {}

  list.splice(idx, 1)
  list.splice(target, 0, id)

  if (inParent) {
    const parent = state.elements[el.parentId!]
    return { elements: { ...state.elements, [el.parentId!]: { ...parent, children: list } } }
  }
  return { rootElementIds: list }
}

const createDefaultElement = (type: Element['type']): Element => ({
  id: generateId(),
  type,
  name: type.charAt(0).toUpperCase() + type.slice(1),
  x: 100,
  y: 100,
  width: type === 'text' ? 200 : 240,
  height: type === 'text' ? 40 : 160,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  children: [],
  parentId: null,
  style: {},
  text:
    type === 'text'
      ? {
          content: 'Double click to edit',
          fontSize: 16,
          fontWeight: 400,
          color: '#f0f0f0',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
        }
      : undefined,
  image:
    type === 'image'
      ? {
          src: '',
          objectFit: 'cover',
        }
      : undefined,
})

export const useEditorStore = create<EditorStore>((set, get) => ({
  elements: {},
  rootElementIds: [],
  selectedIds: [],
  editingId: null,
  activeTool: 'select',
  activeBreakpoint: 'desktop',
  previewMode: false,
  canvas: { x: 0, y: 0, scale: 1 },
  history: {
    entries: [],
    index: -1,
  },

  addElement: (partial) => {
    const id = partial.id || generateId()
    const type = partial.type || 'frame'
    const defaults = createDefaultElement(type)
    const element: Element = {
      ...defaults,
      ...partial,
      id,
      type,
    }
    set((state) => {
      const elements = { ...state.elements, [id]: element }
      // Attach to parent if a valid parentId was supplied, otherwise add to root
      const parentId = element.parentId
      if (parentId && state.elements[parentId]) {
        const parent = state.elements[parentId]
        if (!parent.children.includes(id)) {
          elements[parentId] = { ...parent, children: [...parent.children, id] }
        }
        return { elements }
      }
      return {
        elements,
        rootElementIds: [...state.rootElementIds, id],
      }
    })
    return id
  },

  // Insert a tree of elements (with temporary ids referencing each other) in one
  // atomic update. Ids are remapped to fresh ones; child/parent links are rewired.
  // The root attaches to its (external) parent if it has one, else to the canvas root.
  addElementTree: (parts, rootId) => {
    const idMap = new Map<string, string>()
    for (const p of parts) idMap.set(p.id!, generateId())
    const newRootId = idMap.get(rootId)!

    set((state) => {
      const elements = { ...state.elements }
      for (const p of parts) {
        const newId = idMap.get(p.id!)!
        const type = p.type || 'frame'
        const mappedParent = p.parentId
          ? idMap.get(p.parentId) ?? p.parentId // keep external parent untouched
          : null
        elements[newId] = {
          ...createDefaultElement(type),
          ...p,
          id: newId,
          type,
          parentId: mappedParent,
          children: (p.children || []).map((c) => idMap.get(c)!).filter(Boolean),
        }
      }
      const root = elements[newRootId]
      const externalParent = root.parentId
      if (externalParent && elements[externalParent]) {
        const parent = elements[externalParent]
        elements[externalParent] = {
          ...parent,
          children: [...parent.children, newRootId],
        }
        return { elements }
      }
      // detach root from any stale parent and place on canvas
      elements[newRootId] = { ...root, parentId: null }
      return { elements, rootElementIds: [...state.rootElementIds, newRootId] }
    })
    return newRootId
  },

  updateElement: (id, changes) => {
    set((state) => {
      const el = state.elements[id]
      if (!el) return state
      return {
        elements: { ...state.elements, [id]: { ...el, ...changes } },
      }
    })
  },

  deleteElement: (id) => {
    set((state) => {
      const el = state.elements[id]
      if (!el) return state
      // collect the element and all descendants
      const toRemove = new Set<string>()
      const stack = [id]
      while (stack.length) {
        const cur = stack.pop()!
        if (toRemove.has(cur)) continue
        toRemove.add(cur)
        const node = state.elements[cur]
        if (node) stack.push(...node.children)
      }

      const elements: Record<string, Element> = {}
      for (const [eid, e] of Object.entries(state.elements)) {
        if (toRemove.has(eid)) continue
        elements[eid] = e
      }

      // detach from parent's children list
      if (el.parentId && elements[el.parentId]) {
        const parent = elements[el.parentId]
        elements[el.parentId] = {
          ...parent,
          children: parent.children.filter((c) => c !== id),
        }
      }

      const rootElementIds = state.rootElementIds.filter((rid) => rid !== id)
      const selectedIds = state.selectedIds.filter((sid) => !toRemove.has(sid))
      return { elements, rootElementIds, selectedIds }
    })
  },

  duplicateElement: (id) => {
    const state = get()
    const el = state.elements[id]
    if (!el) return
    // gather the full subtree as parts (keeping original ids for remapping)
    const parts: Partial<Element>[] = []
    const stack = [id]
    while (stack.length) {
      const cur = stack.pop()!
      const node = state.elements[cur]
      if (!node) continue
      parts.push(JSON.parse(JSON.stringify(node)))
      stack.push(...node.children)
    }
    const newRootId = get().addElementTree(parts, id)
    set((s) => {
      const root = s.elements[newRootId]
      if (!root) return s
      return {
        elements: {
          ...s.elements,
          [newRootId]: {
            ...root,
            name: el.name + ' Copy',
            x: el.x + 20,
            y: el.y + 20,
          },
        },
        selectedIds: [newRootId],
      }
    })
  },

  groupSelection: () => {
    const state = get()
    const ids = state.selectedIds.filter((id) => state.elements[id])
    if (ids.length < 1) return
    // only group siblings sharing the same parent
    const parentId = state.elements[ids[0]].parentId ?? null
    const siblings = ids.filter((id) => (state.elements[id].parentId ?? null) === parentId)
    if (siblings.length < 1) return

    // bounding box in the parent's coordinate space
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of siblings) {
      const e = state.elements[id]
      minX = Math.min(minX, e.x)
      minY = Math.min(minY, e.y)
      maxX = Math.max(maxX, e.x + e.width)
      maxY = Math.max(maxY, e.y + e.height)
    }

    const frameId = generateId()
    const frame: Element = {
      ...createDefaultElement('frame'),
      id: frameId,
      name: 'Group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      parentId,
      children: [...siblings],
      style: {},
    }

    set((s) => {
      const elements = { ...s.elements, [frameId]: frame }
      // reparent siblings, offset to be relative to the new frame
      for (const id of siblings) {
        const e = elements[id]
        elements[id] = { ...e, parentId: frameId, x: e.x - minX, y: e.y - minY }
      }
      let rootElementIds = s.rootElementIds
      if (parentId && elements[parentId]) {
        const parent = elements[parentId]
        elements[parentId] = {
          ...parent,
          children: [
            ...parent.children.filter((c) => !siblings.includes(c)),
            frameId,
          ],
        }
      } else {
        rootElementIds = [
          ...s.rootElementIds.filter((rid) => !siblings.includes(rid)),
          frameId,
        ]
      }
      return { elements, rootElementIds, selectedIds: [frameId] }
    })
  },

  ungroup: (id) => {
    const state = get()
    const frame = state.elements[id]
    if (!frame || frame.children.length === 0) return
    const parentId = frame.parentId ?? null

    set((s) => {
      const elements = { ...s.elements }
      const released = [...frame.children]
      // move children back into the frame's parent, restoring absolute position
      for (const childId of released) {
        const child = elements[childId]
        if (!child) continue
        elements[childId] = {
          ...child,
          parentId,
          x: child.x + frame.x,
          y: child.y + frame.y,
        }
      }
      delete elements[id]

      let rootElementIds = s.rootElementIds
      if (parentId && elements[parentId]) {
        const parent = elements[parentId]
        const idx = parent.children.indexOf(id)
        const newChildren = [...parent.children]
        newChildren.splice(idx, 1, ...released)
        elements[parentId] = { ...parent, children: newChildren }
      } else {
        const idx = s.rootElementIds.indexOf(id)
        rootElementIds = [...s.rootElementIds]
        rootElementIds.splice(idx, 1, ...released)
      }
      return { elements, rootElementIds, selectedIds: released }
    })
  },

  // Reorder a child within its auto-layout parent's children[]. The dragged child
  // is inserted immediately before `beforeId` (or appended when beforeId is null).
  reorderChild: (parentId, childId, beforeId) => {
    set((state) => {
      const parent = state.elements[parentId]
      if (!parent) return state
      const children = parent.children.filter((c) => c !== childId)
      if (children.length === parent.children.length) return state // child not in parent
      let idx = beforeId ? children.indexOf(beforeId) : -1
      if (idx < 0) idx = children.length
      children.splice(idx, 0, childId)
      return { elements: { ...state.elements, [parentId]: { ...parent, children } } }
    })
  },

  moveElement: (id, x, y) => {
    set((state) => {
      const el = state.elements[id]
      if (!el) return state
      return {
        elements: { ...state.elements, [id]: { ...el, x, y } },
      }
    })
  },

  bringForward: (id: string) => {
    set((state) => reorderSibling(state, id, 'forward'))
  },

  sendBackward: (id: string) => {
    set((state) => reorderSibling(state, id, 'backward'))
  },

  bringToFront: (id: string) => {
    set((state) => reorderSibling(state, id, 'front'))
  },

  sendToBack: (id: string) => {
    set((state) => reorderSibling(state, id, 'back'))
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setEditingId: (id) => set({ editingId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveBreakpoint: (bp) => set({ activeBreakpoint: bp }),
  setPreviewMode: (preview) => set({ previewMode: preview }),

  setCanvas: (canvas) =>
    set((state) => ({ canvas: { ...state.canvas, ...canvas } })),

  pushHistory: () => {
    set((state) => {
      const entries = state.history.entries.slice(
        0,
        state.history.index + 1
      )
      entries.push(JSON.parse(JSON.stringify(state.elements)))
      if (entries.length > 100) entries.shift()
      return { history: { entries, index: entries.length - 1 } }
    })
  },

  undo: () => {
    const state = get()
    if (state.history.index < 0) return
    const index = state.history.index - 1
    set({
      elements: JSON.parse(
        JSON.stringify(state.history.entries[index])
      ),
      history: { ...state.history, index },
    })
  },

  redo: () => {
    const state = get()
    if (state.history.index >= state.history.entries.length - 1) return
    const index = state.history.index + 1
    set({
      elements: JSON.parse(
        JSON.stringify(state.history.entries[index])
      ),
      history: { ...state.history, index },
    })
  },

  canUndo: () => get().history.index >= 0,
  canRedo: () => get().history.index < get().history.entries.length - 1,
}))
