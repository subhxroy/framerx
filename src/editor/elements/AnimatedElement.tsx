import { type ReactNode, useRef, useEffect, useState } from 'react'
import { motion, useScroll } from 'motion/react'
import type { Interaction, ScrollLink } from '@/store/editorStore'

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
  const needsLayout = previewMode && (isInAutoLayout || isAutoLayoutFrame)
  const needsMotion = hasInteractions || hasVariantTriggers || hasScrollLinks || needsLayout

  // Scroll-linked animation — tracks the element's progress through the viewport
  // and maps it to style property values defined by each scrollLink.
  const { scrollYProgress } = useScroll(
    hasScrollLinks ? { target: elementRef, offset: ['start end', 'end start'] } : undefined
  )
  const [scrollStyle, setScrollStyle] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!hasScrollLinks || !scrollYProgress) return
    const unsubscribe = scrollYProgress.on('change', (progress) => {
      const next: Record<string, number> = {}
      for (const link of scrollLinks!) {
        const rangeLen = link.scrollRange[1] - link.scrollRange[0]
        if (rangeLen === 0) continue
        const t = Math.max(0, Math.min(1, (progress - link.scrollRange[0]) / rangeLen))
        next[link.property] = link.valueRange[0] + (link.valueRange[1] - link.valueRange[0]) * t
      }
      setScrollStyle(next)
    })
    return unsubscribe
  }, [scrollYProgress, scrollLinks, hasScrollLinks])

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
    motionProps.transition = { type: 'spring', stiffness: 500, damping: 35 }
  } else if (hasVariantTriggers && !motionProps.transition) {
    motionProps.transition = { type: 'spring', stiffness: 500, damping: 30 }
  }

  const actionInt = interactions?.find((i) => i.trigger === 'tap' && i.action)
  if (actionInt?.action) {
    motionProps.onTap = () => {
      if (actionInt.action!.type === 'navigate' && actionInt.action!.url) {
        window.open(actionInt.action!.url, '_blank')
      }
    }
  }

  return (
    <motion.div
      ref={elementRef}
      className={className}
      style={{ ...style, ...scrollStyle }}
      {...dataAttrs}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
