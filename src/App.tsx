import { useEffect, useRef, useState } from 'react'
import { animals, getAnimal, type AnimalId, type SoundCue } from './data/animals'
import { AnimalDetail } from './components/AnimalDetail'
import { AnimalHome } from './components/AnimalHome'
import { AuthDialog } from './components/AuthDialog'
import { isAudioUnlocked, loopTone, playTone, setPlaybackVolume, stopPlayback, unlockAudio } from './lib/audio'
import { readSession } from './lib/auth'
import {
  DEFAULT_VOLUME,
  loadProfile,
  recordPlay,
  setVolume as persistVolume,
  toggleFavorite,
  type UserProfile,
} from './lib/profile'

type View = 'boot' | 'home' | 'detail' | 'error'
type BoardFilter = 'all' | 'favorites'

export default function App() {
  const [view, setView] = useState<View>('boot')
  const [selectedId, setSelectedId] = useState<AnimalId | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loopingId, setLoopingId] = useState<string | null>(null)
  const [audioBlocked, setAudioBlocked] = useState(true)
  const [audioMessage, setAudioMessage] = useState<string | null>(
    'Tap Enable sound once so this device can play tones.',
  )
  const [bootError, setBootError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(() => readSession()?.username ?? null)
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile())
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all')
  const [authOpen, setAuthOpen] = useState(false)
  const playClearTimer = useRef<number | null>(null)

  useEffect(() => {
    setPlaybackVolume(profile.volume)
  }, [profile.volume])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      if (!animals.length) {
        setBootError('No animal boards are available right now.')
        setView('error')
        return
      }
      setView('home')
    }, 450)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (playClearTimer.current != null) window.clearTimeout(playClearTimer.current)
      stopPlayback()
    }
  }, [])

  const selected = selectedId ? getAnimal(selectedId) : undefined

  function clearPlayUiTimer() {
    if (playClearTimer.current != null) {
      window.clearTimeout(playClearTimer.current)
      playClearTimer.current = null
    }
  }

  function refreshProfile() {
    setProfile(loadProfile())
  }

  function handleAuthed(nextUsername: string | null) {
    setUsername(nextUsername)
    setProfile(loadProfile())
  }

  async function handleEnableAudio() {
    try {
      await unlockAudio()
      setAudioBlocked(false)
      setAudioMessage('Sound enabled — tap Play for ~7s, or ∞ to loop for 5 minutes.')
    } catch {
      setAudioBlocked(true)
      setAudioMessage('Could not unlock audio on this device. Click Enable sound again.')
    }
  }

  async function ensureAudioReady(): Promise<boolean> {
    if (isAudioUnlocked()) return true
    try {
      await unlockAudio()
      setAudioBlocked(false)
      return true
    } catch {
      setPlayingId(null)
      setLoopingId(null)
      setAudioBlocked(true)
      setAudioMessage('Audio is blocked. Tap Enable sound, then try again.')
      return false
    }
  }

  async function handlePlay(sound: SoundCue) {
    setAudioMessage(null)
    clearPlayUiTimer()
    if (!(await ensureAudioReady())) return

    const result = await playTone(sound.tone)
    if (!result.ok) {
      setPlayingId(null)
      setLoopingId(null)
      setAudioBlocked(result.reason === 'blocked' || !isAudioUnlocked())
      setAudioMessage(result.message)
      return
    }

    setAudioBlocked(false)
    setLoopingId(null)
    setPlayingId(sound.id)
    setProfile(recordPlay(sound.id))
    playClearTimer.current = window.setTimeout(() => {
      setPlayingId((current) => (current === sound.id ? null : current))
      playClearTimer.current = null
    }, result.durationMs)
  }

  async function handleLoop(sound: SoundCue) {
    setAudioMessage(null)
    clearPlayUiTimer()
    if (!(await ensureAudioReady())) return

    setPlayingId(null)
    setLoopingId(sound.id)
    setProfile(recordPlay(sound.id))
    setAudioMessage(`Looping “${sound.label}” for 5 minutes — Stop cancels.`)

    const result = await loopTone(sound.tone)
    // Promise resolves when the 5-minute window ends or Stop aborts the chain.
    setLoopingId((current) => (current === sound.id ? null : current))
    if (!result.ok) {
      setPlayingId(null)
      if (result.message !== 'Playback stopped.') {
        setAudioBlocked(result.reason === 'blocked' || !isAudioUnlocked())
        setAudioMessage(result.message)
      }
      return
    }

    setAudioBlocked(false)
    setAudioMessage((message) =>
      message?.startsWith('Looping') ? 'Loop finished.' : message,
    )
  }

  function handleStop() {
    clearPlayUiTimer()
    stopPlayback()
    setPlayingId(null)
    setLoopingId(null)
    setAudioMessage((message) => (message?.startsWith('Looping') ? 'Stopped.' : message))
  }

  function handleToggleFavorite(sound: SoundCue) {
    setProfile(toggleFavorite(sound.id))
  }

  function handleVolumeChange(volume: number) {
    setPlaybackVolume(volume)
    setProfile(persistVolume(volume))
  }

  function handleSelect(id: AnimalId) {
    handleStop()
    setAudioMessage(null)
    setBoardFilter('all')
    setSelectedId(id)
    setView('detail')
  }

  function handleBack() {
    handleStop()
    setSelectedId(null)
    setAudioMessage(null)
    setBoardFilter('all')
    setView('home')
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden />
      <main className="app-main">
        {view === 'boot' ? <AnimalHome loading onSelect={handleSelect} /> : null}

        {view === 'home' ? (
          <AnimalHome
            onSelect={handleSelect}
            username={username}
            onOpenAuth={() => setAuthOpen(true)}
          />
        ) : null}

        {view === 'detail' && selected ? (
          <AnimalDetail
            animal={selected}
            profile={profile}
            boardFilter={boardFilter}
            playingId={playingId}
            loopingId={loopingId}
            audioMessage={audioMessage}
            audioBlocked={audioBlocked}
            volume={profile.volume ?? DEFAULT_VOLUME}
            username={username}
            onBack={handleBack}
            onEnableAudio={handleEnableAudio}
            onPlay={handlePlay}
            onLoop={handleLoop}
            onStop={handleStop}
            onToggleFavorite={handleToggleFavorite}
            onBoardFilter={setBoardFilter}
            onVolumeChange={handleVolumeChange}
            onOpenAuth={() => setAuthOpen(true)}
          />
        ) : null}

        {view === 'detail' && !selected ? (
          <div className="error-panel" role="alert">
            <p className="brand">Freq</p>
            <h1>Board missing</h1>
            <p>That animal board could not be loaded.</p>
            <button type="button" className="text-link" onClick={handleBack}>
              Back to animals
            </button>
          </div>
        ) : null}

        {view === 'error' ? (
          <div className="error-panel" role="alert">
            <p className="brand">Freq</p>
            <h1>Something went wrong</h1>
            <p>{bootError ?? 'Unable to start Freq.'}</p>
          </div>
        ) : null}
      </main>

      <footer className="app-footer">
        <p>
          Prototype tones via Web Audio — synthesized stand-ins, not medical or wildlife-safety
          guarantees. Habituation is common. Stop if an animal shows stress. Local profiles only —
          passwords never leave this device as plaintext.
        </p>
      </footer>

      <AuthDialog
        open={authOpen}
        username={username}
        onClose={() => {
          setAuthOpen(false)
          refreshProfile()
        }}
        onAuthed={handleAuthed}
      />
    </div>
  )
}
