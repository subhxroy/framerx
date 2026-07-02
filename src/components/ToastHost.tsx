import { AnimatePresence, motion } from 'motion/react'
import { useToastStore } from '@/store/toastStore'
import type { ToastKind } from '@/store/toastStore'
import { TOAST_MOTION } from '@/lib/motionTokens'

const ACCENT: Record<ToastKind, string> = {
  success: 'var(--success)',
  error: 'var(--error)',
  info: 'var(--accent)',
}

/**
 * Mounted once near the app root. Renders the toast stack bottom-center with
 * rise+fade motion (TOAST_MOTION) — pure fades read as unfinished. A left
 * accent bar encodes kind. Click to dismiss early.
 */
export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={TOAST_MOTION.initial}
            animate={TOAST_MOTION.animate}
            exit={TOAST_MOTION.exit}
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 220,
              maxWidth: 380,
              padding: '10px 14px',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-strong)',
              borderLeft: `3px solid ${ACCENT[t.kind]}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-popup)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              lineHeight: 1.4,
            }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
