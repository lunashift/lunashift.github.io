import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  amount?: number
  as?: 'div' | 'section' | 'li' | 'figure'
}

/** Eases content up as it enters the viewport. Static under reduced motion. */
export function Reveal({ children, className, delay = 0, y = 40, amount = 0.25, as = 'div' }: Props) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.95, ease: EASE, delay }}
    >
      {children}
    </Tag>
  )
}
