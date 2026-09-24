import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { MockupShot } from '../components/MockupShot'
import { PhoneTrio, type TrioVariant } from '../components/PhoneTrio'
import { Reveal } from '../components/Reveal'
import type { ScreenId } from '../lib/screens'
import { BRAND } from '../site'

type Layout = 'split-right' | 'wide' | 'split-left' | 'stack'

type Mockup = { src: string; alt: string; width: number; height: number }

type Group = {
  id: string
  title: string
  body: ReactNode
  layout: Layout
  /** A photographic mockup, or three captures arranged in CSS phone frames. */
  mockup?: Mockup
  screens?: [ScreenId, ScreenId, ScreenId]
  variant?: TrioVariant
}

// Rendered phone widths per layout, so the browser picks the smaller capture when it can.
const SIZES: Record<Layout, string> = {
  'split-right': '(min-width: 1280px) 250px, (min-width: 1024px) 20vw, (min-width: 768px) 28vw, 62vw',
  'split-left': '(min-width: 1280px) 250px, (min-width: 1024px) 20vw, (min-width: 768px) 28vw, 62vw',
  wide: '(min-width: 1280px) 335px, (min-width: 768px) 26vw, 62vw',
  stack: '(min-width: 1064px) 335px, (min-width: 768px) 30vw, 62vw',
}

const GROUPS: Group[] = [
  {
    id: 'log',
    title: 'Log in seconds',
    body: <>Tap a symptom, note a dose, add today’s factors. {BRAND} keeps the record and reflects it back to you, gently.</>,
    screens: ['today-home-hero', 'today-factors', 'patterns-apple-health'],
    variant: 'level',
    layout: 'wide',
  },
  {
    id: 'patterns',
    title: 'See your patterns',
    body: (
      <>
        A calendar that warms with symptom load, <span className="whitespace-nowrap">30-day</span> trends for each symptom, and the time of day your hot flashes tend to arrive.
      </>
    ),
    screens: ['patterns-calendar-hot-flash', 'patterns-trend-time-of-day', 'patterns-night-sweat-trend'],
    variant: 'row',
    layout: 'wide',
  },
  {
    id: 'insights',
    title: 'Understand what’s shifting',
    body: <>A weekly summary, a symptom check-in you can retake, and sleep and heart context from Apple Health, so you can see what moved this week.</>,
    screens: ['insights-weekly-summary', 'insights-whats-shifting', 'patterns-sleep-and-heart'],
    variant: 'cascade',
    layout: 'split-left',
  },
  {
    id: 'hormones',
    title: 'Hormones and your body',
    body: <>Track hormone therapy doses and adherence, bring in Apple Health only if you choose to, and take a paced breath when you need one.</>,
    screens: ['hormone-therapy-overview', 'log-a-dose', 'paced-breathing'],
    variant: 'fan',
    layout: 'stack',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const

function Copy({ group, className = '' }: { group: Group; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={className}>
      {/* headline rises out of a clipped line, then the body follows. The h2 is observed
          (the clipped span never intersects the viewport while it sits below the line). */}
      <motion.h2
        id={`${group.id}-title`}
        className="-mb-[0.14em] overflow-hidden pb-[0.14em] text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] text-ink"
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, amount: 0.8 }}
      >
        <motion.span
          className="block"
          variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 1.1, ease: EASE } } }}
        >
          {group.title}
        </motion.span>
      </motion.h2>
      <Reveal delay={0.18} y={26} amount={0.5}>
        <p className="mt-5 max-w-[40ch] text-[1.04rem] leading-relaxed text-muted">{group.body}</p>
      </Reveal>
    </div>
  )
}

function FeatureGroup({ group }: { group: Group }) {
  const trio = group.mockup ? (
    <MockupShot {...group.mockup} />
  ) : (
    <PhoneTrio screens={group.screens!} variant={group.variant} sizes={SIZES[group.layout]} />
  )
  return (
    <section id={group.id} className="scroll-mt-24 py-20 md:py-28 lg:py-36" aria-labelledby={`${group.id}-title`}>
      <div className="container-x">
        {group.layout === 'split-right' && (
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <Copy group={group} className="lg:col-span-4" />
            <div className="lg:col-span-8 md:px-[4%] lg:px-0">{trio}</div>
          </div>
        )}
        {group.layout === 'split-left' && (
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <Copy group={group} className="lg:order-2 lg:col-span-4 lg:pl-6" />
            <div className="lg:order-1 lg:col-span-8 md:px-[4%] lg:px-0">{trio}</div>
          </div>
        )}
        {group.layout === 'wide' && (
          <div>
            <Copy group={group} className="md:max-w-[52ch]" />
            <div className="mt-12 md:mt-16 md:px-[6%]">{trio}</div>
          </div>
        )}
        {group.layout === 'stack' && (
          <div>
            <Copy group={group} className="md:ml-auto md:max-w-[46ch] md:text-right [&_p]:md:ml-auto" />
            <div className="mx-auto mt-12 max-w-[980px] md:mt-16">{trio}</div>
          </div>
        )}
      </div>
    </section>
  )
}

export function Features() {
  return (
    <div className="relative">
      {GROUPS.map((g) => (
        <FeatureGroup key={g.id} group={g} />
      ))}
    </div>
  )
}
