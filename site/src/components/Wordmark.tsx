export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <a href="#main" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Luna Shift, back to top">
      <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" width={32} height={32} className="size-8 rounded-[9px] shadow-[0_1px_2px_rgb(var(--shadow-tint)/0.25)]" />
      <span className="whitespace-nowrap font-display text-[1.15rem] font-medium tracking-[-0.01em] text-ink">Luna Shift</span>
    </a>
  )
}
