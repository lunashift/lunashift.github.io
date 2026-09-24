import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

type Props = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

/**
 * A photographic mockup used in place of the CSS phone group. It carries the same motion
 * as the groups around it: a rise on entry, then a gentle drift as the section scrolls by.
 */
export function MockupShot({ src, alt, width, height, className = '' }: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [52, -52])

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>
        <motion.img
          src={`${import.meta.env.BASE_URL}${src}`}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-full"
          initial={reduce ? false : { opacity: 0, y: 70, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </motion.div>
    </div>
  )
}
