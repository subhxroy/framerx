import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { createStarterProjectData } from '@/lib/defaultProject'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  canvasWidth: number
  canvasHeight: number
  thumbnailUrl?: string
}

export interface ProjectData {
  elements: Record<string, any>
  rootElementIds: string[]
  canvas: { x: number; y: number; scale: number }
}

interface ProjectStore {
  projects: Record<string, Project>
  projectList: Project[]
  isLoading: boolean

  loadProjects: () => Promise<void>
  createProject: (name: string, width: number, height: number) => Promise<string>
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<string | null>
  getProject: (id: string) => Project | undefined

  saveProjectData: (id: string, data: ProjectData) => Promise<void>
  loadProjectData: (id: string) => Promise<ProjectData | null>
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage keys (fallback when Supabase not configured)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS_KEY = 'framer_projects'
const DATA_PREFIX = 'framer_project_data_'

function genLocalId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: {},
  projectList: [],
  isLoading: false,

  // ── Load all projects for the current user ──────────────────────────────────
  loadProjects: async () => {
    set({ isLoading: true })

    if (isSupabaseConfigured && supabase) {
      const userId = useAuthStore.getState().user?.uid
      if (!userId) { set({ isLoading: false }); return }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        const projects: Record<string, Project> = {}
        const projectList: Project[] = data.map((row: any) => {
          const p: Project = {
            id: row.id,
            name: row.name,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
            canvasWidth: row.canvas_width,
            canvasHeight: row.canvas_height,
            thumbnailUrl: row.thumbnail_url ?? undefined,
          }
          projects[p.id] = p
          return p
        })
        set({ projects, projectList, isLoading: false })
        return
      }
    }

    // localStorage fallback
    try {
      const raw = localStorage.getItem(PROJECTS_KEY)
      if (raw) {
        const projects: Record<string, Project> = JSON.parse(raw)
        const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
        set({ projects, projectList })
      }
    } catch { /* ignore */ }
    set({ isLoading: false })
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  createProject: async (name, width, height) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = useAuthStore.getState().user?.uid
        if (!userId) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('projects')
          .insert({ user_id: userId, name, canvas_width: width, canvas_height: height })
          .select()
          .single()

        if (error || !data) throw new Error(error?.message || 'Failed to create project')

        const project: Project = {
          id: data.id,
          name: data.name,
          createdAt: new Date(data.created_at).getTime(),
          updatedAt: new Date(data.updated_at).getTime(),
          canvasWidth: data.canvas_width,
          canvasHeight: data.canvas_height,
        }

        const starterData = createStarterProjectData(width, height)

        const { error: dataError } = await supabase.from('project_data').insert({
          project_id: data.id,
          elements: starterData.elements,
          root_element_ids: starterData.rootElementIds,
          canvas_state: starterData.canvas,
        })

        if (dataError) console.warn('project_data insert failed:', dataError.message)

        set((s) => {
          const projects = { ...s.projects, [project.id]: project }
          const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
          return { projects, projectList }
        })

        return project.id
      } catch (err) {
        console.warn('Supabase createProject failed, falling back to localStorage:', err)
      }
    }

    // localStorage fallback
    const id = genLocalId()
    const now = Date.now()
    const project: Project = { id, name, createdAt: now, updatedAt: now, canvasWidth: width, canvasHeight: height }
    set((s) => {
      const projects = { ...s.projects, [id]: project }
      const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
      return { projects, projectList }
    })
    return id
  },

  // ── Update metadata ─────────────────────────────────────────────────────────
  updateProject: async (id, changes) => {
    const now = Date.now()
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('projects')
          .update({
            name: changes.name,
            canvas_width: changes.canvasWidth,
            canvas_height: changes.canvasHeight,
            thumbnail_url: changes.thumbnailUrl,
            updated_at: new Date(now).toISOString(),
          })
          .eq('id', id)
      } catch (e) {
        console.error('updateProject failed:', e)
      }
    }

    set((s) => {
      const p = s.projects[id]
      if (!p) return s
      const updated = { ...p, ...changes, updatedAt: now }
      const projects = { ...s.projects, [id]: updated }
      const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
      if (!isSupabaseConfigured) {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
      }
      return { projects, projectList }
    })
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  deleteProject: async (id) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('project_data').delete().eq('project_id', id)
        await supabase.from('projects').delete().eq('id', id)
      } catch (e) {
        console.error('deleteProject failed:', e)
      }
    } else {
      localStorage.removeItem(DATA_PREFIX + id)
    }

    set((s) => {
      const { [id]: _, ...projects } = s.projects
      const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
      if (!isSupabaseConfigured) {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
      }
      return { projects, projectList }
    })
  },

  // ── Duplicate ──────────────────────────────────────────────────────────────
  duplicateProject: async (id) => {
    const p = get().projects[id]
    if (!p) return null
    const data = await get().loadProjectData(id)

    const newId = await get().createProject(p.name + ' Copy', p.canvasWidth, p.canvasHeight)
    if (data) {
      await get().saveProjectData(newId, data)
    }
    return newId
  },

  getProject: (id) => get().projects[id],

  // ── Save canvas data ────────────────────────────────────────────────────────
  saveProjectData: async (id, data) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('project_data').upsert({
          project_id: id,
          elements: data.elements,
          root_element_ids: data.rootElementIds,
          canvas_state: data.canvas,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'project_id' })

        // Also bump projects.updated_at
        await supabase
          .from('projects')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id)
      } catch (e) {
        console.error('saveProjectData failed:', e)
      }
    } else {
      try {
        localStorage.setItem(DATA_PREFIX + id, JSON.stringify(data))
      } catch { /* ignore */ }
    }
  },

  // ── Load canvas data ────────────────────────────────────────────────────────
  loadProjectData: async (id) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('project_data')
          .select('*')
          .eq('project_id', id)
          .single()

        if (error || !data) return null
        return {
          elements: data.elements ?? {},
          rootElementIds: data.root_element_ids ?? [],
          canvas: data.canvas_state ?? { x: 0, y: 0, scale: 1 },
        }
      } catch (e) {
        console.error('loadProjectData failed:', e)
        return null
      }
    }

    // localStorage fallback
    try {
      const raw = localStorage.getItem(DATA_PREFIX + id)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}))

// Load projects when auth state settles
useAuthStore.subscribe((state, prev) => {
  if (state.user && !prev.user) {
    useProjectStore.getState().loadProjects()
  }
  if (!state.user && prev.user) {
    useProjectStore.setState({ projects: {}, projectList: [] })
  }
})
