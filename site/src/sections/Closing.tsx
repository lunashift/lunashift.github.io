import { Envelope, Monitor, Moon, Sun } from '@phosphor-icons/react'
import { AppStore } from '../components/AppStore'
import { Reveal } from '../components/Reveal'
import { Wordmark } from '../components/Wordmark'
import { useTheme } from '../lib/useTheme'
import { BRAND, site } from '../site'

function ThemeToggle() {
  const { choice, cycle } = useTheme()
  const Icon = choice === 'dark' ? Moon : choice === 'light' ? Sun : Monitor
  const label = choice === 'dark' ? 'Dark' : choice === 'light' ? 'Light' : 'System'
  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex items-center gap-2 self-start rounded-pill border border-ink/35 bg-tint px-3.5 py-2 text-[0.88rem] font-medium text-ink transition-colors duration-300 hover:bg-tint-strong"
      aria-label={`Appearance: ${label}. Change appearance`}
    >
      <Icon weight="regular" className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

export function Closing() {
  return (
    <>
      <section className="py-20 md:py-32" aria-labelledby="closing-title">
        <div className="container-x">
          <Reveal className="mx-auto max-w-[44ch] text-center">
            <h2 id="closing-title" className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.06] text-ink">
              Start tracking, privately.
            </h2>
            <p className="mx-auto mt-6 max-w-[36ch] text-[1.06rem] leading-relaxed text-muted">
              Install {BRAND}, log your first symptom, and see what the week shows you.
            </p>
            <div className="mt-9 flex justify-center">
              <AppStore />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line py-10">
        <div className="container-x flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <Wordmark />
          <nav aria-label="Footer" className="flex flex-col items-start gap-3 text-[0.95rem] font-medium text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7">
            <a href={`mailto:${site.contactEmail}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
              <Envelope weight="regular" className="size-4" aria-hidden="true" />
              {site.contactEmail}
            </a>
            <a href={site.privacyHref} className="transition-colors hover:text-ink">
              Privacy
            </a>
            <a href={site.supportHref} className="transition-colors hover:text-ink">
              Support
            </a>
          </nav>
          <ThemeToggle />
        </div>
        <p className="container-x mt-8 text-[0.86rem] text-muted">© 2026 {BRAND}. A tracking tool, not a medical device.</p>
      </footer>
    </>
  )
}
