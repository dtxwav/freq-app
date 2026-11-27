import { useMemo } from 'react'
import {
  CONFIDENCE_COPY,
  type Animal,
  type Confidence,
  type SoundCue,
} from '../data/animals'
import { sortSoundsByUsage, type UserProfile } from '../lib/profile'
import { AnimalArt } from './AnimalArt'
import { CatListenPanel } from './CatListenPanel'
import { SoundButton } from './SoundButton'
import { VolumeSlider } from './VolumeSlider'
import { Button } from './ui/button'

type BoardFilter = 'all' | 'favorites'

type AnimalDetailProps = {
  animal: Animal
  profile: UserProfile
  boardFilter: BoardFilter
  playingId: string | null
  loopingId: string | null
  audioMessage: string | null
  audioBlocked: boolean
  volume: number
  onBack: () => void
  onEnableAudio: () => void
  onPlay: (sound: SoundCue) => void
  onLoop: (sound: SoundCue) => void
  onStop: () => void
  onToggleFavorite: (sound: SoundCue) => void
  onBoardFilter: (filter: BoardFilter) => void
  onVolumeChange: (volume: number) => void
  onOpenAuth: () => void
  username: string | null
}

function zoneBlurb(tone: 'attract' | 'lure' | 'deter' | 'edu'): string {
  switch (tone) {
    case 'attract':
      return 'Summon or soothe near you'
    case 'lure':
      return 'Set a speaker away — pull the animal toward that spot'
    case 'deter':
      return 'Best-shot interrupt — not guaranteed'
    case 'edu':
      return 'Learn the biology, not a field effector'
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

function ZoneColumn({
  title,
  tone,
  sounds,
  emptyMessage,
  playingId,
  loopingId,
  profile,
  onPlay,
  onLoop,
  onStop,
  onToggleFavorite,
}: {
  title: string
  tone: 'attract' | 'lure' | 'deter' | 'edu'
  sounds: SoundCue[]
  emptyMessage?: string
  playingId: string | null
  loopingId: string | null
  profile: UserProfile
  onPlay: (sound: SoundCue) => void
  onLoop: (sound: SoundCue) => void
  onStop: () => void
  onToggleFavorite: (sound: SoundCue) => void
}) {
  return (
    <section className={cnZone(tone)}>
      <header className="zone__header">
        <h2>{title}</h2>
        <p>{zoneBlurb(tone)}</p>
      </header>

      {sounds.length === 0 ? (
        <div className="empty-state" role="status">
          <p>{emptyMessage ?? 'No sounds in this zone yet.'}</p>
        </div>
      ) : (
        <div className="sound-grid">
          {sounds.map((sound) => (
            <SoundButton
              key={sound.id}
              sound={sound}
              playing={playingId === sound.id}
              looping={loopingId === sound.id}
              favorite={profile.favorites.includes(sound.id)}
              playCount={profile.playCounts[sound.id] ?? 0}
              onPlay={onPlay}
              onLoop={onLoop}
              onStop={onStop}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function cnZone(tone: 'attract' | 'lure' | 'deter' | 'edu') {
  switch (tone) {
    case 'attract':
      return 'zone zone--attract'
    case 'lure':
      return 'zone zone--lure'
    case 'deter':
      return 'zone zone--deter'
    case 'edu':
      return 'zone zone--edu'
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

export function AnimalDetail({
  animal,
  profile,
  boardFilter,
  playingId,
  loopingId,
  audioMessage,
  audioBlocked,
  volume,
  onBack,
  onEnableAudio,
  onPlay,
  onLoop,
  onStop,
  onToggleFavorite,
  onBoardFilter,
  onVolumeChange,
  onOpenAuth,
  username,
}: AnimalDetailProps) {
  const ranked = useMemo(
    () =>
      sortSoundsByUsage(animal.sounds, profile, {
        favoritesOnly: boardFilter === 'favorites',
      }),
    [animal.sounds, profile, boardFilter],
  )

  const attract = useMemo(() => ranked.filter((sound) => sound.zone === 'attract'), [ranked])
  const lure = useMemo(() => ranked.filter((sound) => sound.zone === 'lure'), [ranked])
  const deter = useMemo(() => ranked.filter((sound) => sound.zone === 'deter'), [ranked])
  const edu = useMemo(() => ranked.filter((sound) => sound.zone === 'edu'), [ranked])

  const legend = (Object.keys(CONFIDENCE_COPY) as Confidence[]).map((key) => (
    <span key={key} className={`badge badge--${key}`}>
      {CONFIDENCE_COPY[key].label}
    </span>
  ))

  const favoritesEmpty =
    boardFilter === 'favorites' && ranked.length === 0
      ? 'No favorites on this board yet — tap the heart on any cue.'
      : undefined

  const zoneEmpty = (fallback?: string) =>
    boardFilter === 'favorites' ? 'No favorites in this section.' : fallback

  return (
    <section className="detail" style={{ ['--accent' as string]: animal.accent }}>
      <div className="detail__top">
        <Button variant="soft" size="sm" onClick={onBack}>
          All animals
        </Button>
        <div className="detail__actions">
          <Button
            type="button"
            variant="soft"
            size="sm"
            data-testid="sign-in-button"
            aria-haspopup="dialog"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenAuth()
            }}
          >
            {username ? username : 'Sign in'}
          </Button>
          {audioBlocked ? (
            <Button variant="attract" size="sm" onClick={onEnableAudio}>
              Enable sound
            </Button>
          ) : null}
          {playingId || loopingId ? (
            <Button variant="ghost" size="sm" onClick={onStop}>
              Stop
            </Button>
          ) : null}
        </div>
      </div>

      <header className="detail__hero">
        <div className="detail__art">
          <AnimalArt id={animal.id} />
        </div>
        <div>
          <p className="brand brand--sm">Freq</p>
          <h1>{animal.name}</h1>
          <p className="lede">{animal.framing}</p>
          {animal.educationOnly ? (
            <p className="edu-banner">Education only — not an outdoor attract, lure, or repel tool.</p>
          ) : null}
        </div>
      </header>

      <VolumeSlider value={volume} onChange={onVolumeChange} />

      <div className="board-toolbar" role="toolbar" aria-label="Board filters">
        <Button
          size="sm"
          variant={boardFilter === 'all' ? 'default' : 'soft'}
          aria-pressed={boardFilter === 'all'}
          onClick={() => onBoardFilter('all')}
        >
          All cues
        </Button>
        <Button
          size="sm"
          variant={boardFilter === 'favorites' ? 'default' : 'soft'}
          aria-pressed={boardFilter === 'favorites'}
          onClick={() => onBoardFilter('favorites')}
        >
          Favorites
        </Button>
        <p className="board-toolbar__hint">Sorted by most played — favorites pin to the top.</p>
      </div>

      {audioMessage ? (
        <div className={`audio-banner ${audioBlocked ? 'audio-banner--error' : ''}`} role="alert">
          <p>{audioMessage}</p>
          {audioBlocked ? (
            <Button variant="attract" size="sm" onClick={onEnableAudio}>
              Enable sound
            </Button>
          ) : null}
        </div>
      ) : null}

      {animal.safetyNote ? (
        <aside className="safety" role="note">
          <strong>Safety</strong>
          <p>{animal.safetyNote}</p>
        </aside>
      ) : null}

      <div className="legend" aria-label="Confidence legend">
        {legend}
      </div>

      {animal.id === 'cats' ? <CatListenPanel onBeforeListen={onStop} /> : null}

      {favoritesEmpty ? (
        <div className="empty-state" role="status">
          <p>{favoritesEmpty}</p>
        </div>
      ) : animal.educationOnly ? (
        <ZoneColumn
          title="Educational tones"
          tone="edu"
          sounds={edu}
          playingId={playingId}
          loopingId={loopingId}
          profile={profile}
          onPlay={onPlay}
          onLoop={onLoop}
          onStop={onStop}
          onToggleFavorite={onToggleFavorite}
        />
      ) : (
        <div className="split split--three">
          <ZoneColumn
            title={animal.attractLabel}
            tone="attract"
            sounds={attract}
            emptyMessage={zoneEmpty(animal.emptyAttractMessage)}
            playingId={playingId}
            loopingId={loopingId}
            profile={profile}
            onPlay={onPlay}
            onLoop={onLoop}
            onStop={onStop}
            onToggleFavorite={onToggleFavorite}
          />
          <ZoneColumn
            title={animal.lureLabel}
            tone="lure"
            sounds={lure}
            emptyMessage={zoneEmpty(animal.emptyLureMessage)}
            playingId={playingId}
            loopingId={loopingId}
            profile={profile}
            onPlay={onPlay}
            onLoop={onLoop}
            onStop={onStop}
            onToggleFavorite={onToggleFavorite}
          />
          <ZoneColumn
            title={animal.deterLabel}
            tone="deter"
            sounds={deter}
            emptyMessage={zoneEmpty(animal.emptyDeterMessage)}
            playingId={playingId}
            loopingId={loopingId}
            profile={profile}
            onPlay={onPlay}
            onLoop={onLoop}
            onStop={onStop}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}
    </section>
  )
}
