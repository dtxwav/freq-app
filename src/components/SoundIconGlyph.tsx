import type { SoundIcon } from '../data/animals'

export function SoundIconGlyph({ icon }: { icon: SoundIcon }) {
  const common = {
    viewBox: '0 0 48 48',
    className: 'h-10 w-10',
    'aria-hidden': true as const,
  }

  switch (icon) {
    case 'kitten':
      return (
        <svg {...common}>
          <circle cx="24" cy="26" r="12" fill="currentColor" opacity="0.15" />
          <path d="M16 18l-4-8 8 4M32 18l4-8-8 4" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <circle cx="19" cy="25" r="1.8" fill="currentColor" />
          <circle cx="29" cy="25" r="1.8" fill="currentColor" />
        </svg>
      )
    case 'bird':
      return (
        <svg {...common}>
          <path d="M10 28c8-14 16-16 28-10-6 2-10 8-12 14-6-2-12-2-16-4Z" fill="currentColor" opacity="0.2" />
          <path d="M14 26c6-8 12-10 22-6" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'can':
      return (
        <svg {...common}>
          <rect x="14" y="14" width="20" height="22" rx="3" fill="currentColor" opacity="0.18" />
          <path d="M14 20h20M18 14c2 4 10 4 12 0" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'mouse':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="28" rx="12" ry="8" fill="currentColor" opacity="0.18" />
          <circle cx="14" cy="20" r="5" fill="currentColor" opacity="0.25" />
          <circle cx="34" cy="20" r="5" fill="currentColor" opacity="0.25" />
          <circle cx="20" cy="28" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'bag':
      return (
        <svg {...common}>
          <path d="M16 18h16l2 18H14l2-18Z" fill="currentColor" opacity="0.18" />
          <path d="M20 18c0-4 8-4 8 0" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'pspsps':
      return (
        <svg {...common}>
          <path
            d="M12 30c4-10 8-14 12-14s8 4 12 14"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M16 24c3-6 5-8 8-8s5 2 8 8"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>
      )
    case 'trill':
      return (
        <svg {...common}>
          <path
            d="M12 28c3-8 6-4 9-10 3 6 6 2 9 10 3-8 6-4 6-4"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'tone':
      return (
        <svg {...common}>
          <path
            d="M10 24h4l3-10 4 20 4-16 3 10h10"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'tom':
      return (
        <svg {...common}>
          <path d="M12 30c4-12 10-16 12-16s8 4 12 16" fill="currentColor" opacity="0.18" />
          <path d="M18 22l-5-9M30 22l5-9" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )
    case 'hiss':
      return (
        <svg {...common}>
          <path d="M14 18c8 4 12 4 20 0M14 24c8 4 12 4 20 0M14 30c8 4 12 4 20 0" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'bark':
      return (
        <svg {...common}>
          <circle cx="18" cy="24" r="8" fill="currentColor" opacity="0.18" />
          <path d="M28 18c6 4 6 12 0 16M34 14c10 6 10 18 0 24" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'hey':
      return (
        <svg {...common}>
          <circle cx="24" cy="18" r="7" fill="currentColor" opacity="0.18" />
          <path d="M14 36c4-8 16-8 20 0" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M32 12c4 2 6 6 6 10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M16 16l16 16M32 16L16 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'yelp':
      return (
        <svg {...common}>
          <path d="M14 28c4-12 8-14 10-14s6 2 10 14" fill="currentColor" opacity="0.18" />
          <path d="M20 22c2-6 4-6 4-6s2 0 4 6" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'whistle':
      return (
        <svg {...common}>
          <rect x="10" y="20" width="18" height="10" rx="5" fill="currentColor" opacity="0.2" />
          <circle cx="34" cy="25" r="6" fill="currentColor" opacity="0.25" />
          <path d="M28 25h6" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )
    case 'squeak':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="10" fill="currentColor" opacity="0.18" />
          <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )
    case 'click':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
      )
    case 'howl':
      return (
        <svg {...common}>
          <path d="M12 32c6-16 10-18 12-18s6 2 12 18" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M20 20c2-6 4-8 4-8s2 2 4 8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      )
    case 'burst':
      return (
        <svg {...common}>
          <path
            d="M24 10v6M24 32v6M10 24h6M32 24h6M14 14l4 4M30 30l4 4M34 14l-4 4M18 30l-4 4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'voice':
      return (
        <svg {...common}>
          <path d="M18 16v16M24 12v24M30 18v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'horn':
      return (
        <svg {...common}>
          <path d="M12 20h10l12-8v24L22 28H12a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4Z" fill="currentColor" opacity="0.2" />
          <path d="M34 18c4 2 6 6 6 6s-2 4-6 6" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'siren':
      return (
        <svg {...common}>
          <path d="M14 30c0-10 4-16 10-16s10 6 10 16" fill="currentColor" opacity="0.18" />
          <path d="M18 30h12M24 14v4" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )
    case 'clang':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="26" rx="14" ry="10" fill="currentColor" opacity="0.18" />
          <path d="M16 22h16M18 28h12" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )
    case 'wave':
      return (
        <svg {...common}>
          <path
            d="M10 24c4-8 8-8 12 0s8 8 12 0 8-8 12 0"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'buzz':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="24" rx="8" ry="12" fill="currentColor" opacity="0.18" />
          <path d="M16 18c-6-2-8 2-8 6M32 18c6-2 8 2 8 6" stroke="currentColor" strokeWidth="2.5" fill="none" />
        </svg>
      )
    case 'hive':
      return (
        <svg {...common}>
          <path d="M24 10l12 8v12l-12 8-12-8V18l12-8Z" fill="currentColor" opacity="0.18" />
          <path d="M24 10v28M12 18l24 12M36 18L12 30" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    default: {
      const _exhaustive: never = icon
      return _exhaustive
    }
  }
}
