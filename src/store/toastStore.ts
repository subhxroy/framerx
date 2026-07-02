import { create } from 'zustand'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface ToastState {
  toasts: Toast[]
  /** Show a toast. Returns its id. Auto-dismisses after `duration` ms (default 3200; errors linger longer). */
  push: (message: string, kind?: ToastKind, duration?: number) => string
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, kind = 'info', duration) => {
    const id = `t${++seq}`
    const ms = duration ?? (kind === 'error' ? 5000 : 3200)
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
    if (ms > 0) window.setTimeout(() => get().dismiss(id), ms)
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Imperative helper for non-component code (stores, async handlers). */
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().push(msg, 'success', duration),
  error: (msg: string, duration?: number) => useToastStore.getState().push(msg, 'error', duration),
  info: (msg: string, duration?: number) => useToastStore.getState().push(msg, 'info', duration),
}
