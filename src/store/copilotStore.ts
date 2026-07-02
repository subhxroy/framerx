import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useEditorStore } from '@/store/editorStore'
import type { Element } from '@/store/editorStore'
import { extractDesignTokens } from '@/lib/extractDesignTokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  explanation?: AIDesignResponse['explanation']
  usage?: AIDesignResponse['usage']
}

export interface AIDesignResponse {
  mode: 'generate' | 'redesign'
  elements?: Record<string, unknown>[]
  patch?: Record<string, unknown>
  explanation: {
    summary: string
    categories: Array<{
      category: 'typography' | 'spacing' | 'color' | 'layout' | 'structure'
      title: string
      description: string
    }>
  }
  usage: {
    promptTokens: number
    completionTokens: number
    model: string
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCanvasContext(): Record<string, unknown>[] {
  const state = useEditorStore.getState()
  return Object.values(state.elements)
    .slice(0, 30)
    .map((el) => ({
      id: el.id,
      type: el.type,
      name: el.name,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      parentId: el.parentId,
      children: el.children,
      style: el.style
        ? { backgroundColor: el.style.backgroundColor, borderRadius: el.style.borderRadius }
        : undefined,
      text: el.text
        ? { content: el.text.content, fontSize: el.text.fontSize, fontWeight: el.text.fontWeight, color: el.text.color, textAlign: el.text.textAlign }
        : undefined,
      autoLayout: el.autoLayout
        ? { direction: el.autoLayout.direction, gap: el.autoLayout.gap, padding: el.autoLayout.padding }
        : undefined,
    }))
}

function flattenAIDesignElements(nodes: Record<string, unknown>[]): { parts: Partial<Element>[]; rootId: string } {
  const parts: Partial<Element>[] = []
  let idCounter = 0

  function walk(node: Record<string, unknown>, parentId: string | null): string {
    const id = `ai-gen-${idCounter++}`
    const children = Array.isArray(node.children) ? node.children : []
    const childIds: string[] = children.map((child: unknown) => walk(child as Record<string, unknown>, id))
    parts.push({
      id,
      parentId,
      children: childIds,
      type: node.type as Element['type'],
      name: node.name as string,
      x: node.x as number,
      y: node.y as number,
      width: node.width as number,
      height: node.height as number,
      rotation: (node.rotation as number) ?? 0,
      opacity: (node.opacity as number) ?? 1,
      visible: (node.visible as boolean) ?? true,
      locked: (node.locked as boolean) ?? false,
      style: node.style as Element['style'],
      text: node.text as Element['text'],
      image: node.image as Element['image'],
      autoLayout: node.autoLayout as Element['autoLayout'],
      sizing: node.sizing as Element['sizing'],
    })
    return id
  }

  const rootId = nodes.length > 0 ? walk(nodes[0], null) : ''
  return { parts, rootId }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CopilotStore {
  messages: CopilotMessage[]
  isGenerating: boolean
  error: string | null
  generatedOutput: AIDesignResponse | null

  sendMessage: (prompt: string, mode: 'generate' | 'redesign') => Promise<void>
  clearConversation: () => void
  acceptGeneration: () => void
  discardGeneration: () => void
}

export const useCopilotStore = create<CopilotStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  error: null,
  generatedOutput: null,

  sendMessage: async (prompt, mode) => {
    if (!prompt.trim() || get().isGenerating) return

    if (!isSupabaseConfigured) {
      set({ error: 'Supabase is not configured. Check your .env file.' })
      return
    }

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
      timestamp: Date.now(),
    }

    set((s) => ({
      messages: [...s.messages, userMsg],
      isGenerating: true,
      error: null,
      generatedOutput: null,
    }))

    const state = useEditorStore.getState()
    const selectedId = state.selectedIds[0]
    const canvasContext = buildCanvasContext()
    const elementId = mode === 'redesign' && selectedId ? selectedId : undefined
    const designTokens = extractDesignTokens(state.elements)

    const TIMEOUT_MS = 30_000
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), TIMEOUT_MS)

    try {
      const { data, error } = await supabase!.functions.invoke('ai-design', {
        body: {
          prompt: prompt.trim(),
          mode,
          canvasContext,
          elementId,
          designTokens,
        },
        signal: abortController.signal as any,
      })

      if (error) {
        throw new Error(error.message || 'Edge function error')
      }

      const response = data as AIDesignResponse

      if (!response || !response.explanation) {
        throw new Error('AI returned an incomplete response. Try rephrasing.')
      }

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.explanation.summary,
        timestamp: Date.now(),
        explanation: response.explanation,
        usage: response.usage,
      }

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isGenerating: false,
        generatedOutput: response,
      }))
    } catch (err: unknown) {
      const isTimeout = abortController.signal.aborted
      const msg = isTimeout
        ? 'Request timed out after 30s. Try a simpler prompt or check your connection.'
        : err instanceof Error ? err.message : 'Failed to send message'
      set({ isGenerating: false, error: msg })
    } finally {
      clearTimeout(timer)
    }
  },

  clearConversation: () => {
    set({ messages: [], error: null, generatedOutput: null })
  },

  acceptGeneration: () => {
    const output = get().generatedOutput
    if (!output) return

    const editor = useEditorStore.getState()

    if (output.mode === 'generate' && output.elements && output.elements.length > 0) {
      const { parts, rootId } = flattenAIDesignElements(output.elements)
      if (rootId) {
        editor.pushHistory()
        editor.addElementTree(parts, rootId)
      }
    } else if (output.mode === 'redesign' && output.patch) {
      const selectedId = editor.selectedIds[0]
      if (selectedId && output.patch) {
        editor.pushHistory()
        editor.updateElement(selectedId, output.patch as Partial<Element>)
      }
    }

    set({ generatedOutput: null })
  },

  discardGeneration: () => {
    set({ generatedOutput: null })
  },
}))
