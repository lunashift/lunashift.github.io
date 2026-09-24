import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'
const KEY = 'ls-theme'
const COLORS = { light: '#fcf6f1', dark: '#34221e' } as const

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    try {
      const v = localStorage.getItem(KEY)
      return v === 'light' || v === 'dark' ? v : 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (choice === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', choice)
    // Browser chrome colour: on System, let each media-scoped tag keep its own colour; otherwise force both.
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      const own = (m.getAttribute('media') ?? '').includes('dark') ? COLORS.dark : COLORS.light
      m.setAttribute('content', choice === 'system' ? own : choice === 'dark' ? COLORS.dark : COLORS.light)
    })
    try {
      if (choice === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, choice)
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }, [choice])

  /** System -> the opposite of what the OS shows -> back to the OS look -> System. Every press changes something visible. */
  const cycle = useCallback(() => {
    setChoice((c) => {
      const opposite: ThemeChoice = systemDark() ? 'light' : 'dark'
      const same: ThemeChoice = systemDark() ? 'dark' : 'light'
      if (c === 'system') return opposite
      if (c === opposite) return same
      return 'system'
    })
  }, [])

  return { choice, cycle }
}
