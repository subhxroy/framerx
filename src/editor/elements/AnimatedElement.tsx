import { type ReactNode, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { Interaction, ScrollLink } from '@/store/editorStore'
import { useOverlayStore } from '@/store/overlayStore'
import { SPRING } from '@/lib/motionTokens'

interface VariantTrigger {
  trigger: 'hover' | 'tap'
  target: Record<string, any>
}

interface Props {
  interactions?: Interaction[]
  scrollLinks?: ScrollLink[]
  variantTriggers?: VariantTrigger[]
  style: React.CSSProperties
  children: ReactNode
  className?: string
  dataAttrs?: Record<string, string>
  previewMode?: boolean
  isInAutoLayout?: boolean
  isAutoLayoutFrame?: boolean
}

function getToValues(animation: NonNullable<Interaction['animation']>): Record<string, number> {
  const values: Record<string, number> = {}
  for (const [key, val] of Object.entries(animation)) {
    if (val) values[key] = val[1]
  }
  return values
}

function getFromValues(animation: NonNullable<Interaction['animation']>): Record<string, number> {
  const values: Record<string, number> = {}
  for (const [key, val] of Object.entries(animation)) {
    if (val) values[key] = val[0]
  }
  return values
}

export default function AnimatedElement({
  interactions,
  scrollLinks,
  variantTriggers,
  style,
  children,
  className,
  dataAttrs,
  previewMode,
  isInAutoLayout,
  isAutoLayoutFrame,
}: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const hasInteractions = (interactions?.length ?? 0) > 0
  const hasVariantTriggers = (variantTriggers?.length ?? 0) > 0
  const hasScrollLinks = (scrollLinks?.length ?? 0) > 0 && previewMode
  // Layout (FLIP) animation is preview-only: in the editor, react-moveable
  // drives transforms directly and Motion's layout projection would fight it.
  const needsLayout = (isInAutoLayout || isAutoLayoutFrame) && !!previewMode
  const needsMotion = hasInteractions || hasVariantTriggers || hasScrollLinks || needsLayout

  function applyEasing(t: number, easing?: ScrollLink['easing']): number {
    if (!easing || easing === 'linear') return t
    if (easing === 'easeOut') return 1 - Math.pow(1 - t, 3)
    if (easing === 'easeIn') return t * t * t
    if (easing === 'easeInOut') return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    return t
  }

  // Scroll-linked animation via Motion's useTransform — zero React re-renders
  // during scroll because Motion handles MotionValue subscriptions natively.
  const { scrollYProgress } = useScroll(
    previewMode ? { target: elementRef, offset: ['start end', 'end start'] as const } : undefined
  )

  const computeScroll = useCallback(
    (progress: number, prop: string): number | undefined => {
      if (!hasScrollLinks || !scrollLinks) return undefined
      const link = scrollLinks.find(l => l.property === prop)
      if (!link) return undefined
      const rangeLen = link.scrollRange[1] - link.scrollRange[0]
      if (rangeLen === 0) return undefined
      const t = Math.max(0, Math.min(1, (progress - link.scrollRange[0]) / rangeLen))
      const easedT = applyEasing(t, link.easing)
      return link.valueRange[0] + (link.valueRange[1] - link.valueRange[0]) * easedT
    },
    [scrollLinks, hasScrollLinks]
  )

  // Individual useTransform per property — always called at top level (Motion
  // requirement). Each returns undefined (no-op via MotionValue) when no
  // scrollLink uses that property, so they never override static style values.
  const scrollOpacity = useTransform(scrollYProgress, (p: number) => computeScroll(p, 'opacity'))
  const scrollX = useTransform(scrollYProgress, (p: number) => computeScroll(p, 'x'))
  const scrollY = useTransform(scrollYProgress, (p: number) => computeScroll(p, 'y'))
  const scrollScale = useTransform(scrollYProgress, (p: number) => computeScroll(p, 'scale'))
  const scrollRotate = useTransform(scrollYProgress, (p: number) => computeScroll(p, 'rotate'))

  if (!needsMotion) {
    return (
      <div className={className} style={style} {...dataAttrs}>
        {children}
      </div>
    )
  }

  const motionProps: Record<string, any> = {}

  if (needsLayout) {
    motionProps.layout = true
  }

  for (const int of (interactions ?? [])) {
    if (int.trigger === 'hover' && int.animation) {
      motionProps.whileHover = getToValues(int.animation)
    }
    if (int.trigger === 'tap' && int.animation) {
      motionProps.whileTap = getToValues(int.animation)
    }
    if (int.trigger === 'appear' && int.animation) {
      motionProps.initial = getFromValues(int.animation)
      motionProps.animate = getToValues(int.animation)
    }
    if (int.trigger === 'inview' && int.animation) {
      motionProps.initial = getFromValues(int.animation)
      motionProps.whileInView = getToValues(int.animation)
      motionProps.viewport = { once: true, amount: 0.3 }
    }
  }

  for (const vt of variantTriggers ?? []) {
    if (vt.trigger === 'hover') {
      motionProps.whileHover = { ...motionProps.whileHover, ...vt.target }
    }
    if (vt.trigger === 'tap') {
      motionProps.whileTap = { ...motionProps.whileTap, ...vt.target }
    }
  }

  const transitionInt = interactions?.find((i) => i.transition)
  if (transitionInt?.transition && Object.keys(motionProps).length > 0) {
    const { easing: _easing, ...rest } = transitionInt.transition
    motionProps.transition = { ...rest, ease: _easing }
  }

  if (needsLayout && !motionProps.transition) {
    motionProps.transition = SPRING.content
  } else if (hasVariantTriggers && !motionProps.transition) {
    motionProps.transition = SPRING.content
  }

  const actionInt = interactions?.find((i) => i.trigger === 'tap' && i.action)
  if (actionInt?.action) {
    motionProps.onTap = () => {
      const a = actionInt.action!
      if (a.type === 'navigate' && a.url) {
        window.open(a.url, '_blank')
      } else if (a.type === 'overlay' && a.overlayId) {
        useOverlayStore.getState().openOverlay(a.overlayId)
      }
    }
  }

  return (
    <motion.div
      ref={elementRef}
      className={className}
      style={{ ...style, opacity: scrollOpacity, x: scrollX, y: scrollY, scale: scrollScale, rotate: scrollRotate }}
      {...dataAttrs}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
