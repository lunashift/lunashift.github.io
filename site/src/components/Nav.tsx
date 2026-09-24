import { site } from '../site'
import { AppStore } from './AppStore'
import { Wordmark } from './Wordmark'

export function Nav() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-line/60 bg-[color-mix(in_oklab,var(--bg)_74%,transparent)] backdrop-blur-md"
    >
      <div className="container-x flex h-16 items-center justify-between">
        <Wordmark />
        {/* The App Store line repeats in the hero just below, so on the narrowest phones
            it gives way to keep the bar on one line. */}
        <nav aria-label="Primary" className="flex items-center gap-5 sm:gap-6">
          <a href={site.privacyHref} className="text-[0.95rem] font-medium text-muted transition-colors hover:text-ink">
            Privacy
          </a>
          <div className="hidden sm:block">
            <AppStore size="sm" />
          </div>
        </nav>
      </div>
    </header>
  )
}
