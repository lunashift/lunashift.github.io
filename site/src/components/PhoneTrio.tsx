import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Phone } from './Phone'
import type { ScreenId } from '../lib/screens'

export type TrioVariant = 'stepped' | 'row' | 'level' | 'cascade' | 'fan'

type Depth = 1 | 2 | 3
type Slot = { x: string; y: string; s: number; z: Depth }

// Desktop arrangements. Every phone stands upright: depth and rhythm come from
// offset, scale and overlap, never from rotation. Ratios keep each phone inside
// the box. Mobile collapses to a stacked column in CSS (.trio media query).
const LAYOUTS: Record<TrioVariant, { ratio: string; slots: Slot[] }> = {
  // staircase: left low and back, right high and in front
  stepped: {
    ratio: '16 / 13.3',
    slots: [
      { x: '2%', y: '22%', s: 0.94, z: 1 },
      { x: '34%', y: '11%', s: 0.97, z: 2 },
      { x: '66%', y: '0%', s: 1, z: 3 },
    ],
  },
  // symmetric row: centre forward and taller, sides a step behind
  row: {
    ratio: '16 / 11.35',
    slots: [
      { x: '3%', y: '9%', s: 0.92, z: 1 },
      { x: '34%', y: '0%', s: 1, z: 3 },
      { x: '65%', y: '9%', s: 0.92, z: 2 },
    ],
  },
  // three level phones side by side on one axis, same size, evenly spaced
  level: {
    ratio: '16 / 10.9',
    slots: [
      { x: '1%', y: '1%', s: 1, z: 2 },
      { x: '34%', y: '1%', s: 1, z: 2 },
      { x: '67%', y: '1%', s: 1, z: 2 },
    ],
  },
  // descending deck: left in front, each next phone a little lower and further back
  cascade: {
    ratio: '16 / 12.4',
    slots: [
      { x: '4%', y: '0%', s: 1, z: 3 },
      { x: '33%', y: '8%', s: 0.97, z: 2 },
      { x: '62%', y: '16%', s: 0.94, z: 1 },
    ],
  },
  // centre phone large and forward, two tucked lower behind it
  fan: {
    ratio: '16 / 11.8',
    slots: [
      { x: '7%', y: '13%', s: 0.9, z: 1 },
      { x: '34%', y: '0%', s: 1.02, z: 3 },
      { x: '61%', y: '13%', s: 0.9, z: 1 },
    ],
  },
}

// Nearer phones drift further as the section scrolls past, which reads as depth.
const DRIFT: Record<Depth, number> = { 1: 0.35, 2: 0.65, 3: 1 }
const DRIFT_PX = 64

const EASE = [0.16, 1, 0.3, 1] as const

type SlotProps = {
  slot: Slot
  progress: MotionValue<number>
  reduce: boolean
  children: ReactNode
}

function TrioSlot({ slot, progress, reduce, children }: SlotProps) {
  const drift = DRIFT_PX * DRIFT[slot.z]
  const y = useTransform(progress, [0, 1], [drift, -drift])
  const style = { '--x': slot.x, '--y': slot.y, '--s': slot.s, '--z': slot.z } as CSSProperties
  return (
    <div className="slot" style={style}>
      <motion.div style={reduce ? undefined : { y }}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 80, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.25, ease: EASE, delay: 0.12 * (slot.z - 1) }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

type Props = {
  screens: [ScreenId, ScreenId, ScreenId]
  variant?: TrioVariant
  sizes?: string
  className?: string
}

export function PhoneTrio({ screens, variant = 'stepped', sizes, className = '' }: Props) {
  const reduce = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const layout = LAYOUTS[variant]
  return (
    <div ref={ref} className={`trio ${className}`} style={{ '--trio-ratio': layout.ratio } as CSSProperties}>
      {screens.map((screen, i) => (
        <TrioSlot key={screen} slot={layout.slots[i] ?? layout.slots[0]!} progress={scrollYProgress} reduce={reduce}>
          <Phone screen={screen} sizes={sizes} />
        </TrioSlot>
      ))}
    </div>
  )
}
