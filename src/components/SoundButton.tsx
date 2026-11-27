import { Heart, Infinity as InfinityIcon, Square } from 'lucide-react'
import { CONFIDENCE_COPY, CONTENT_TYPE_COPY, type SoundCue } from '../data/animals'
import { cn } from '../lib/utils'
import { SoundIconGlyph } from './SoundIconGlyph'

type SoundButtonProps = {
  sound: SoundCue
  playing: boolean
  looping: boolean
  favorite: boolean
  playCount: number
  disabled?: boolean
  onPlay: (sound: SoundCue) => void
  onLoop: (sound: SoundCue) => void
  onStop: () => void
  onToggleFavorite: (sound: SoundCue) => void
}

export function SoundButton({
  sound,
  playing,
  looping,
  favorite,
  playCount,
  disabled,
  onPlay,
  onLoop,
  onStop,
  onToggleFavorite,
}: SoundButtonProps) {
  const confidence = CONFIDENCE_COPY[sound.confidence]
  const zoneClass =
    sound.zone === 'attract'
      ? 'sound-attract'
      : sound.zone === 'lure'
        ? 'sound-lure'
        : sound.zone === 'deter'
          ? 'sound-deter'
          : 'sound-edu'

  const active = playing || looping

  return (
    <div className={cn('sound-card', zoneClass, active && 'is-playing', looping && 'is-looping')}>
      <button
        type="button"
        className="sound-btn"
        disabled={disabled}
        onClick={() => onPlay(sound)}
        aria-pressed={playing && !looping}
        aria-label={`Play ${sound.label} once (~7 seconds)`}
      >
        <span className="sound-btn__icon">
          <SoundIconGlyph icon={sound.icon} />
        </span>
        <span className="sound-btn__body">
          <span className="sound-btn__title">{sound.label}</span>
          <span className="sound-btn__intent">{sound.intent}</span>
          <span className="sound-btn__meta">
            <span className={cn('badge', `badge--${sound.confidence}`)}>{confidence.label}</span>
            {sound.hzLabel ? <span className="hz-chip">{sound.hzLabel}</span> : null}
            <span className="type-chip">{CONTENT_TYPE_COPY[sound.contentType]}</span>
            {playCount > 0 ? <span className="plays-chip">{playCount}×</span> : null}
            {looping ? <span className="loop-chip">Looping 5 min</span> : null}
            {!looping && playing ? <span className="loop-chip loop-chip--once">Playing</span> : null}
          </span>
        </span>
        <span className="sound-btn__wave" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>

      <div className="sound-card__rail" role="group" aria-label={`${sound.label} controls`}>
        <button
          type="button"
          className={cn('sound-rail-btn', favorite && 'is-on')}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${sound.label} from favorites` : `Favorite ${sound.label}`}
          onClick={() => onToggleFavorite(sound)}
        >
          <Heart aria-hidden fill={favorite ? 'currentColor' : 'none'} />
        </button>
        {active ? (
          <button
            type="button"
            className="sound-rail-btn sound-rail-btn--stop"
            aria-label={`Stop ${sound.label}`}
            onClick={onStop}
          >
            <Square aria-hidden fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            className={cn('sound-rail-btn', looping && 'is-on')}
            disabled={disabled}
            aria-label={`Loop ${sound.label} for 5 minutes`}
            title="Loop for 5 minutes"
            onClick={() => onLoop(sound)}
          >
            <InfinityIcon aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
