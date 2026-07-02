import { forwardRef } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { DURATION, EASE } from '@/lib/motionTokens'

/**
 * Shared button with instant press micro-feedback: scales to 0.97 on press
 * (DURATION.instant) BEFORE whatever the click triggers resolves. This is
 * what makes the app feel instant even when the real work takes 200-400ms.
 *
 * Drop-in for <button> — forwards all button props. Renders a motion.button
 * so whileTap works; disabled buttons skip the press animation.
 */
type Props = HTMLMotionProps<'button'> & {
  /** Scale on press. Default 0.97 — enough to feel, subtle enough to stay classy. */
  pressScale?: number
}

const PressableButton = forwardRef<HTMLButtonElement, Props>(function PressableButton(
  { pressScale = 0.97, disabled, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: pressScale }}
      transition={{ duration: DURATION.instant, ease: EASE.standard }}
      {...rest}
    >
      {children}
    </motion.button>
  )
})

export default PressableButton
