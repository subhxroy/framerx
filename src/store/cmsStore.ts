import { create } from 'zustand'
import { createContext, useContext } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type CMSFieldType =
  | 'text' | 'rich-text' | 'image' | 'number' | 'boolean'
  | 'date' | 'color' | 'link' | 'file' | 'video' | 'enum'

export interface CMSField {
  id: string
  name: string
  type: CMSFieldType
  required: boolean
  defaultValue?: unknown
  options?: string[]
}

export interface CMSCollection {
  id: string
  name: string
  fields: CMSField[]
  createdAt: number
}

export interface CMSItem {
  id: string
  collectionId: string
  values: Record<string, unknown>
  createdAt: number
}

interface CMSStore {
  activeProjectId: string | null
  collections: Record<string, CMSCollection>
  items: Record<string, CMSItem[]>

  setActiveProject: (id: string) => void
  loadCMSData: (projectId: string) => Promise<void>

  addCollection: (name: string) => string
  updateCollection: (id: string, changes: Partial<CMSCollection>) => void
  deleteCollection: (id: string) => void

  addField: (collectionId: string, field: Omit<CMSField, 'id'>) => string
  updateField: (collectionId: string, fieldId: string, changes: Partial<CMSField>) => void
  removeField: (collectionId: string, fieldId: string) => void

  addItem: (collectionId: string, values: Record<string, unknown>) => string
  updateItem: (collectionId: string, itemId: string, values: Record<string, unknown>) => void
  deleteItem: (collectionId: string, itemId: string) => void

  getCollection: (id: string) => CMSCollection | undefined
  getItems: (collectionId: string) => CMSItem[]
}

const genId = () => crypto.randomUUID()

export const useCMSStore = create<CMSStore>((set, get) => ({
  activeProjectId: null,
  collections: {},
  items: {},

  setActiveProject: (id) => set({ activeProjectId: id }),

  loadCMSData: async (projectId) => {
    set({ activeProjectId: projectId, collections: {}, items: {} })
    if (!isSupabaseConfigured || !supabase) return

    const { data: cols } = await supabase.from('cms_collections').select('*').eq('project_id', projectId)
    if (!cols) return

    const collections: Record<string, CMSCollection> = {}
    for (const c of cols) {
      collections[c.id] = {
        id: c.id,
        name: c.name,
        fields: c.fields || [],
        createdAt: new Date(c.created_at).getTime(),
      }
    }

    const { data: itms } = await supabase.from('cms_items').select('*').in('collection_id', cols.map(c => c.id))
    const items: Record<string, CMSItem[]> = {}
    
    if (itms) {
      for (const i of itms) {
        if (!items[i.collection_id]) items[i.collection_id] = []
        items[i.collection_id].push({
          id: i.id,
          collectionId: i.collection_id,
          values: i.values || {},
          createdAt: new Date(i.created_at).getTime(),
        })
      }
    }

    set({ collections, items })
  },

  addCollection: (name) => {
    const id = genId()
    const { activeProjectId } = get()
    
    // Optimistic UI
    set((s) => ({
      collections: { ...s.collections, [id]: { id, name, fields: [], createdAt: Date.now() } },
      items: { ...s.items, [id]: [] },
    }))

    // DB Update
    if (activeProjectId && isSupabaseConfigured && supabase) {
      supabase.from('cms_collections').insert({
        id, project_id: activeProjectId, name, fields: []
      }).then(({ error }) => { if (error) console.error(error) })
    }

    return id
  },

  updateCollection: (id, changes) => {
    const { collections } = get()
    const c = collections[id]
    if (!c) return

    // Optimistic UI
    set((s) => ({
      collections: { ...s.collections, [id]: { ...c, ...changes } }
    }))

    // DB Update
    if (isSupabaseConfigured && supabase) {
      const payload: any = {}
      if (changes.name !== undefined) payload.name = changes.name
      if (changes.fields !== undefined) payload.fields = changes.fields
      if (Object.keys(payload).length > 0) {
        supabase.from('cms_collections').update(payload).eq('id', id)
          .then(({ error }) => { if (error) console.error(error) })
      }
    }
  },

  deleteCollection: (id) => {
    // Optimistic UI
    set((s) => {
      const { [id]: _, ...rest } = s.collections
      const { [id]: __, ...itemsRest } = s.items
      return { collections: rest, items: itemsRest }
    })

    // DB Update
    if (isSupabaseConfigured && supabase) {
      supabase.from('cms_collections').delete().eq('id', id)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  addField: (collectionId, field) => {
    const id = genId()
    const { collections, updateCollection } = get()
    const c = collections[collectionId]
    if (!c) return id
    updateCollection(collectionId, { fields: [...c.fields, { id, ...field }] })
    return id
  },

  updateField: (collectionId, fieldId, changes) => {
    const { collections, updateCollection } = get()
    const c = collections[collectionId]
    if (!c) return
    updateCollection(collectionId, {
      fields: c.fields.map((f) => (f.id === fieldId ? { ...f, ...changes } : f))
    })
  },

  removeField: (collectionId, fieldId) => {
    const { collections, updateCollection } = get()
    const c = collections[collectionId]
    if (!c) return
    updateCollection(collectionId, {
      fields: c.fields.filter((f) => f.id !== fieldId)
    })
  },

  addItem: (collectionId, values) => {
    const id = genId()
    
    // Optimistic UI
    set((s) => {
      const items = s.items[collectionId] || []
      return { items: { ...s.items, [collectionId]: [...items, { id, collectionId, values, createdAt: Date.now() }] } }
    })

    // DB Update
    if (isSupabaseConfigured && supabase) {
      supabase.from('cms_items').insert({
        id, collection_id: collectionId, values
      }).then(({ error }) => { if (error) console.error(error) })
    }

    return id
  },

  updateItem: (collectionId, itemId, values) => {
    // Optimistic UI
    set((s) => {
      const items = s.items[collectionId] || []
      return {
        items: {
          ...s.items,
          [collectionId]: items.map((item) => item.id === itemId ? { ...item, values } : item),
        },
      }
    })

    // DB Update
    if (isSupabaseConfigured && supabase) {
      supabase.from('cms_items').update({ values }).eq('id', itemId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  deleteItem: (collectionId, itemId) => {
    // Optimistic UI
    set((s) => ({
      items: {
        ...s.items,
        [collectionId]: (s.items[collectionId] || []).filter((item) => item.id !== itemId),
      },
    }))

    // DB Update
    if (isSupabaseConfigured && supabase) {
      supabase.from('cms_items').delete().eq('id', itemId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  getCollection: (id) => get().collections[id],
  getItems: (collectionId) => get().items[collectionId] || [],
}))

export interface CMSContextValue {
  item: CMSItem | null
  items: CMSItem[]
}

export const CMSDataContext = createContext<CMSContextValue>({ item: null, items: [] })

export function useCMSData() {
  return useContext(CMSDataContext)
}
