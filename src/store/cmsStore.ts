import { create } from 'zustand'
import { createContext, useContext } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { toast } from './toastStore'

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
  error: string | null

  setActiveProject: (id: string) => void
  clearError: () => void
  loadCMSData: (projectId: string) => Promise<void>

  addCollection: (name: string) => Promise<string>
  updateCollection: (id: string, changes: Partial<CMSCollection>) => Promise<void>
  deleteCollection: (id: string) => Promise<void>

  addField: (collectionId: string, field: Omit<CMSField, 'id'>) => string
  updateField: (collectionId: string, fieldId: string, changes: Partial<CMSField>) => void
  removeField: (collectionId: string, fieldId: string) => void

  addItem: (collectionId: string, values: Record<string, unknown>) => Promise<string>
  updateItem: (collectionId: string, itemId: string, values: Record<string, unknown>) => Promise<void>
  deleteItem: (collectionId: string, itemId: string) => Promise<void>

  getCollection: (id: string) => CMSCollection | undefined
  getItems: (collectionId: string) => CMSItem[]
}

const CMS_COLLECTIONS_KEY = 'framer_cms_collections'
const CMS_ITEMS_KEY = 'framer_cms_items'

function saveToLocal(collections: Record<string, CMSCollection>, items: Record<string, CMSItem[]>, projectId: string) {
  try {
    localStorage.setItem(CMS_COLLECTIONS_KEY + '_' + projectId, JSON.stringify(collections))
    localStorage.setItem(CMS_ITEMS_KEY + '_' + projectId, JSON.stringify(items))
  } catch { /* quota exceeded */ }
}

function loadFromLocal(projectId: string): { collections: Record<string, CMSCollection>; items: Record<string, CMSItem[]> } | null {
  try {
    const c = localStorage.getItem(CMS_COLLECTIONS_KEY + '_' + projectId)
    const i = localStorage.getItem(CMS_ITEMS_KEY + '_' + projectId)
    if (c && i) return { collections: JSON.parse(c), items: JSON.parse(i) }
  } catch { /* invalid data */ }
  return null
}

const genId = () => crypto.randomUUID()

export const useCMSStore = create<CMSStore>((set, get) => ({
  activeProjectId: null,
  collections: {},
  items: {},
  error: null,

  setActiveProject: (id) => set({ activeProjectId: id }),
  clearError: () => set({ error: null }),

  loadCMSData: async (projectId) => {
    set({ activeProjectId: projectId, collections: {}, items: {} })

    if (isSupabaseConfigured && supabase) {
      const { data: cols } = await supabase.from('cms_collections').select('*').eq('project_id', projectId)
      if (cols) {
        const collections: Record<string, CMSCollection> = {}
        for (const c of cols) {
          collections[c.id] = {
            id: c.id,
            name: c.name,
            fields: c.fields || [],
            createdAt: new Date(c.created_at).getTime(),
          }
        }

        const collIds = cols.map(c => c.id)
        if (collIds.length > 0) {
          const { data: itms } = await supabase.from('cms_items').select('*').in('collection_id', collIds)
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
          saveToLocal(collections, items, projectId)
          return
        } else {
          set({ collections, items: {} })
          saveToLocal(collections, {}, projectId)
          return
        }
      }
    }

    // localStorage fallback
    const local = loadFromLocal(projectId)
    if (local) {
      set({ collections: local.collections, items: local.items })
    }
  },

  addCollection: async (name) => {
    const id = genId()
    const { activeProjectId } = get()
    set({ error: null })
    
    // Optimistic UI
    set((s) => ({
      collections: { ...s.collections, [id]: { id, name, fields: [], createdAt: Date.now() } },
      items: { ...s.items, [id]: [] },
    }))

    // DB Update
    if (activeProjectId && isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('cms_collections').insert({
        id, project_id: activeProjectId, name, fields: []
      })
      if (error) { set({ error: error.message }); toast.error(`Couldn’t sync new collection: ${error.message}`) }
    }

    // localStorage persistence
    if (activeProjectId) {
      const s = get()
      saveToLocal(s.collections, s.items, activeProjectId)
    }

    return id
  },

  updateCollection: async (id, changes) => {
    const { collections } = get()
    const c = collections[id]
    if (!c) return
    set({ error: null })

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
        const { error } = await supabase.from('cms_collections').update(payload).eq('id', id)
        if (error) { set({ error: error.message }); toast.error(`Couldn’t sync collection changes: ${error.message}`) }
      }
    }

    // localStorage persistence
    const s = get()
    if (s.activeProjectId) saveToLocal(s.collections, s.items, s.activeProjectId)
  },

  deleteCollection: async (id) => {
    set({ error: null })
    // Optimistic UI
    set((s) => {
      const { [id]: _, ...rest } = s.collections
      const { [id]: __, ...itemsRest } = s.items
      return { collections: rest, items: itemsRest }
    })

    // DB Update — cascade items first
    if (isSupabaseConfigured && supabase) {
      await supabase.from('cms_items').delete().eq('collection_id', id)
      const { error } = await supabase.from('cms_collections').delete().eq('id', id)
      if (error) { set({ error: error.message }); toast.error(`Couldn’t sync collection deletion: ${error.message}`) }
    }

    // localStorage persistence
    const s = get()
    if (s.activeProjectId) saveToLocal(s.collections, s.items, s.activeProjectId)
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

  addItem: async (collectionId, values) => {
    const { collections } = get()
    const c = collections[collectionId]
    if (c) {
      for (const field of c.fields) {
        if (field.required) {
          const v = values[field.id]
          if (v === undefined || v === '' || v === null) {
            set({ error: `"${field.name}" is required` })
            toast.error(`"${field.name}" is required`)
            return ''
          }
        }
      }
    }

    const id = genId()
    set({ error: null })
    
    // Optimistic UI
    set((s) => {
      const items = s.items[collectionId] || []
      return { items: { ...s.items, [collectionId]: [...items, { id, collectionId, values, createdAt: Date.now() }] } }
    })

    // DB Update
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('cms_items').insert({
        id, collection_id: collectionId, values
      })
      if (error) { set({ error: error.message }); toast.error(`Couldn’t sync new item: ${error.message}`) }
    }

    // localStorage persistence
    const s = get()
    if (s.activeProjectId) saveToLocal(s.collections, s.items, s.activeProjectId)

    return id
  },

  updateItem: async (collectionId, itemId, values) => {
    const { collections } = get()
    const c = collections[collectionId]
    if (c) {
      for (const field of c.fields) {
        if (field.required) {
          const v = values[field.id]
          if (v === undefined || v === '' || v === null) {
            set({ error: `"${field.name}" is required` })
            toast.error(`"${field.name}" is required`)
            return
          }
        }
      }
    }

    set({ error: null })
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
      const { error } = await supabase.from('cms_items').update({ values }).eq('id', itemId)
      if (error) { set({ error: error.message }); toast.error(`Couldn’t sync item changes: ${error.message}`) }
    }

    // localStorage persistence
    const s = get()
    if (s.activeProjectId) saveToLocal(s.collections, s.items, s.activeProjectId)
  },

  deleteItem: async (collectionId, itemId) => {
    set({ error: null })
    // Optimistic UI
    set((s) => ({
      items: {
        ...s.items,
        [collectionId]: (s.items[collectionId] || []).filter((item) => item.id !== itemId),
      },
    }))

    // DB Update
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('cms_items').delete().eq('id', itemId)
      if (error) { set({ error: error.message }); toast.error(`Couldn’t sync item deletion: ${error.message}`) }
    }

    // localStorage persistence
    const s = get()
    if (s.activeProjectId) saveToLocal(s.collections, s.items, s.activeProjectId)
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
