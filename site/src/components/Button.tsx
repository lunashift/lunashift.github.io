import { ArrowUpRight } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'quiet'
  size?: 'md' | 'sm'
  className?: string
  external?: boolean
}

export function Button({ href, children, variant = 'primary', size = 'md', className = '', external }: Props) {
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  if (variant === 'quiet') {
    return (
      <a
        href={href}
        {...ext}
        className={`group inline-flex items-center gap-2 rounded-pill px-1 py-2 font-sans text-[0.95rem] font-medium text-ink transition-colors duration-300 hover:text-accent-deep ${className}`}
      >
        <span>
          {children}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </span>
        <ArrowUpRight
          weight="regular"
          className="size-4 transition-transform duration-500 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    )
  }
  const pad = size === 'sm' ? 'py-1.5 pl-5 pr-1.5 text-[0.9rem]' : 'py-2 pl-6 pr-2 text-[0.95rem]'
  const chip = size === 'sm' ? 'size-7' : 'size-8'
  return (
    <a
      href={href}
      {...ext}
      className={`group inline-flex items-center gap-3 rounded-pill bg-cta font-sans font-medium text-on-cta shadow-[0_1px_0_rgb(255_255_255/0.18)_inset,0_10px_24px_-12px_rgb(var(--shadow-tint)/0.45)] transition-transform duration-500 ease-out-soft hover:-translate-y-px active:translate-y-0 active:scale-[0.985] ${pad} ${className}`}
    >
      <span className="whitespace-nowrap">
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </span>
      <span
        className={`grid ${chip} shrink-0 place-items-center rounded-full bg-on-cta/12 transition-transform duration-500 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
        aria-hidden="true"
      >
        <ArrowUpRight weight="bold" className="size-4" />
      </span>
    </a>
  )
}
