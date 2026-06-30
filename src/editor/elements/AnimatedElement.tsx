import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Interaction } from '@/store/editorStore'

interface Props {
  interactions?: Interaction[]
  style: React.CSSProperties
  children: ReactNode
  className?: string
  dataAttrs?: Record<string, string>
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
  style,
  children,
  className,
  dataAttrs,
}: Props) {
  if (!interactions || interactions.length === 0) {
    return (
      <div className={className} style={style} {...dataAttrs}>
        {children}
      </div>
    )
  }

  const motionProps: Record<string, any> = {}

  for (const int of interactions) {
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
  }

  const transitionInt = interactions.find((i) => i.transition)
  if (transitionInt?.transition && Object.keys(motionProps).length > 0) {
    motionProps.transition = transitionInt.transition
  }

  const actionInt = interactions.find((i) => i.trigger === 'tap' && i.action)
  if (actionInt?.action) {
    motionProps.onTap = () => {
      if (actionInt.action!.type === 'navigate' && actionInt.action!.url) {
        window.open(actionInt.action!.url, '_blank')
      }
    }
  }

  return (
    <motion.div className={className} style={style} {...dataAttrs} {...motionProps}>
      {children}
    </motion.div>
  )
}
