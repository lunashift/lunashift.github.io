import { PHONE_H, PHONE_W, screenAlt, screenSrc, type ScreenId } from '../lib/screens'

type Props = {
  screen: ScreenId
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * A real iPhone render with the capture already inside it (see scripts/optimize-images.mjs),
 * so the device frame, Dynamic Island and side keys are photographic rather than CSS.
 */
export function Phone({ screen, sizes = '(min-width: 1280px) 335px, (min-width: 768px) 26vw, 62vw', priority, className = '' }: Props) {
  return (
    <figure className={`phone ${className}`}>
      <img
        src={screenSrc(screen, 870)}
        srcSet={`${screenSrc(screen, 520)} 520w, ${screenSrc(screen, 870)} 870w`}
        sizes={sizes}
        width={PHONE_W}
        height={PHONE_H}
        alt={screenAlt[screen]}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </figure>
  )
}
