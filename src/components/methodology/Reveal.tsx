import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/** Micro-interaction easing (design.md §6): cubic-bezier(0.16, 1, 0.3, 1). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number]

interface RevealProps {
  children: ReactNode
  className?: string
  /** Seconds */
  delay?: number
  /** Seconds */
  duration?: number
  /** viewport amount threshold */
  amount?: number
  y?: number
  x?: number
}

/**
 * whileInView reveal used across the methodology page (methodology.md motion
 * rules: Motion only, transform/opacity only, once). Under
 * prefers-reduced-motion every reveal renders static (design.md §6).
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  amount = 0.4,
  y = 24,
  x = 0,
}: RevealProps) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ amount, once: true }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}
