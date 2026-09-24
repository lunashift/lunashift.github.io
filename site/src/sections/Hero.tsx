import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { AppStore } from '../components/AppStore'
import { Button } from '../components/Button'

const EASE = [0.16, 1, 0.3, 1] as const
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
}

export function Hero() {
  const reduce = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  // Scrolling away from the hero eases the phone down and back while the copy lifts and fades.
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.93])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])

  return (
    <section ref={section} className="relative isolate flex items-center pt-24 pb-16 md:pt-28 md:pb-20 lg:min-h-[100svh]">
      <div className="container-x grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
        <motion.div
          className="lg:col-span-6"
          style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
          variants={stagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <motion.h1
            variants={item}
            className="max-w-[20ch] text-[clamp(2.4rem,4.6vw,3.6rem)] leading-[1.08] text-ink"
          >
            Your perimenopause, tracked privately.
          </motion.h1>
          <motion.p variants={item} className="mt-7 max-w-[40ch] text-[1.06rem] leading-relaxed text-muted md:text-[1.12rem]">
            Log symptoms, hormone therapy and daily factors in seconds. No account, nothing sold, and your data backs up to your own private iCloud — never to us.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <AppStore />
            <Button href="#log" variant="quiet">
              See how it works
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="lg:col-span-6" style={reduce ? undefined : { y: stageY, scale: stageScale }}>
          <motion.div
            className="hero-stage"
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.16 }}
          >
            <img
              src={`${import.meta.env.BASE_URL}hero-phone.webp`}
              alt="Two iPhones, one showing its back and one showing the Luna Shift Today screen: a greeting, a 7 out of 10 score marked easing, and one-tap buttons for hot flash, night sweat, mood, sleep and brain fog"
              width={1500}
              height={1670}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="w-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
