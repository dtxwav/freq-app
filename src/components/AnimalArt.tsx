import type { AnimalId } from '../data/animals'
import { cn } from '../lib/utils'

type AnimalArtProps = {
  id: AnimalId
  className?: string
}

export function AnimalArt({ id, className }: AnimalArtProps) {
  switch (id) {
    case 'cats':
      return (
        <svg viewBox="0 0 160 160" className={cn('h-full w-full', className)} aria-hidden>
          <ellipse cx="80" cy="128" rx="46" ry="14" fill="#1F6B4A" opacity="0.18" />
          <path
            d="M48 78c0-28 14-48 32-48s32 20 32 48v18c0 18-12 30-32 30S48 114 48 96V78Z"
            fill="#E7B77A"
          />
          <path d="M54 42l-12-22 22 10 6 16" fill="#E7B77A" />
          <path d="M106 42l12-22-22 10-6 16" fill="#E7B77A" />
          <circle cx="66" cy="82" r="4.5" fill="#243028" />
          <circle cx="94" cy="82" r="4.5" fill="#243028" />
          <path
            d="M76 94c2 3 6 3 8 0"
            stroke="#243028"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M52 96h-18M52 102h-16M108 96h18M108 102h16"
            stroke="#243028"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'dogs':
      return (
        <svg viewBox="0 0 160 160" className={cn('h-full w-full', className)} aria-hidden>
          <ellipse cx="80" cy="128" rx="48" ry="14" fill="#3B6EA5" opacity="0.16" />
          <path
            d="M46 70c0-24 16-42 34-42 18 0 34 18 34 42v26c0 20-14 34-34 34S46 116 46 96V70Z"
            fill="#D8A46A"
          />
          <path d="M42 58c-10 4-16 16-12 28 8-6 16-10 22-12" fill="#B8783E" />
          <path d="M118 58c10 4 16 16 12 28-8-6-16-10-22-12" fill="#B8783E" />
          <circle cx="66" cy="86" r="4.5" fill="#243028" />
          <circle cx="94" cy="86" r="4.5" fill="#243028" />
          <ellipse cx="80" cy="100" rx="8" ry="6" fill="#243028" />
          <path d="M80 106v10" stroke="#243028" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'bears':
      return (
        <svg viewBox="0 0 160 160" className={cn('h-full w-full', className)} aria-hidden>
          <ellipse cx="80" cy="130" rx="50" ry="12" fill="#8B5A2B" opacity="0.18" />
          <circle cx="48" cy="58" r="16" fill="#6E4522" />
          <circle cx="112" cy="58" r="16" fill="#6E4522" />
          <ellipse cx="80" cy="86" rx="42" ry="38" fill="#7A4D27" />
          <ellipse cx="80" cy="98" rx="22" ry="16" fill="#C9A27A" />
          <circle cx="64" cy="82" r="5" fill="#243028" />
          <circle cx="96" cy="82" r="5" fill="#243028" />
          <ellipse cx="80" cy="96" rx="7" ry="5" fill="#243028" />
        </svg>
      )
    case 'mosquitoes':
      return (
        <svg viewBox="0 0 160 160" className={cn('h-full w-full', className)} aria-hidden>
          <ellipse cx="80" cy="128" rx="40" ry="12" fill="#5C7A1A" opacity="0.16" />
          <ellipse
            cx="54"
            cy="78"
            rx="28"
            ry="12"
            fill="#9AD4B4"
            opacity="0.55"
            transform="rotate(-18 54 78)"
          />
          <ellipse
            cx="106"
            cy="78"
            rx="28"
            ry="12"
            fill="#9AD4B4"
            opacity="0.55"
            transform="rotate(18 106 78)"
          />
          <ellipse cx="80" cy="86" rx="14" ry="28" fill="#3F4F2A" />
          <circle cx="80" cy="52" r="10" fill="#3F4F2A" />
          <path
            d="M74 46c-10-14-22-18-30-16M86 46c10-14 22-18 30-16"
            stroke="#243028"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M80 114v18" stroke="#243028" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'bees':
      return (
        <svg viewBox="0 0 160 160" className={cn('h-full w-full', className)} aria-hidden>
          <ellipse cx="80" cy="128" rx="42" ry="12" fill="#C49212" opacity="0.18" />
          <ellipse
            cx="48"
            cy="78"
            rx="26"
            ry="14"
            fill="#F4F0E4"
            opacity="0.9"
            transform="rotate(-20 48 78)"
          />
          <ellipse
            cx="112"
            cy="78"
            rx="26"
            ry="14"
            fill="#F4F0E4"
            opacity="0.9"
            transform="rotate(20 112 78)"
          />
          <ellipse cx="80" cy="88" rx="28" ry="34" fill="#F2C14E" />
          <path
            d="M56 72h48M54 88h52M58 104h44"
            stroke="#243028"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="80" cy="48" r="12" fill="#243028" />
          <path
            d="M72 42c-8-10-16-12-22-10M88 42c8-10 16-12 22-10"
            stroke="#243028"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
