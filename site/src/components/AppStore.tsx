import { AppleLogo, ArrowUpRight } from '@phosphor-icons/react'
import { site } from '../site'

type Props = {
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Where a download button would normally sit. Until the app has a listing there is
 * nothing to link to, so this reads as a statement rather than a control: no shadow,
 * no lift, nothing that invites a click it cannot answer. Flip `APP_IS_LIVE` in
 * site.ts and it becomes a real link to the listing without any other change.
 */
export function AppStore({ size = 'md', className = '' }: Props) {
  const pad = size === 'sm' ? 'gap-2 px-4 py-1.5 text-[0.9rem]' : 'gap-2.5 px-5 py-2.5 text-[0.98rem]'
  const icon = size === 'sm' ? 'size-4' : 'size-[1.15rem]'
  const shared = `inline-flex items-center rounded-pill border border-ink/20 bg-tint font-sans font-medium text-ink ${pad} ${className}`

  if (site.appIsLive) {
    return (
      <a
        href={site.appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group ${shared} transition-transform duration-500 ease-out-soft hover:-translate-y-px`}
      >
        <AppleLogo weight="fill" className={icon} aria-hidden="true" />
        <span className="whitespace-nowrap">
          {site.appStoreLiveNote}
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
        <ArrowUpRight weight="bold" className="size-4 transition-transform duration-500 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      </a>
    )
  }

  return (
    <p className={shared}>
      <AppleLogo weight="fill" className={icon} aria-hidden="true" />
      <span className="whitespace-nowrap">{site.appStoreComingNote}</span>
    </p>
  )
}
