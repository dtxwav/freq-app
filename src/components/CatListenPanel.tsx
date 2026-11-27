import { useEffect, useRef, useState } from 'react'
import {
  ETHOGRAM_GLOSS,
  HONESTY_DISCLOSURE,
  listenAndTagCatCall,
  stopCatListen,
  type CatCallTagResult,
  type CatCallType,
} from '../lib/catCallTagger'
import { Button } from './ui/button'

type ListenPhase = 'idle' | 'listening' | 'result' | 'error'

type CatListenPanelProps = {
  /** Stop board playback before mic listen so we don't tag our own tones. */
  onBeforeListen?: () => void
}

const TYPE_LABEL: Record<CatCallType, string> = {
  meow: 'Meow',
  purr: 'Purr',
  hiss: 'Hiss',
  trill: 'Trill',
  chirp: 'Chirp',
  growl: 'Growl',
  unclear: 'Unclear',
}

function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}% guess`
}

export function CatListenPanel({ onBeforeListen }: CatListenPanelProps) {
  const [phase, setPhase] = useState<ListenPhase>('idle')
  const [result, setResult] = useState<CatCallTagResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const levelTimer = useRef<number | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    return () => {
      stopCatListen()
      if (levelTimer.current != null) window.clearInterval(levelTimer.current)
    }
  }, [])

  function clearLevelPulse() {
    if (levelTimer.current != null) {
      window.clearInterval(levelTimer.current)
      levelTimer.current = null
    }
    setLevel(0)
  }

  async function handleListen() {
    if (busy.current) return
    busy.current = true
    onBeforeListen?.()
    stopCatListen()
    setErrorMessage(null)
    setResult(null)
    setPhase('listening')

    // Visual pulse only — real level metering would need a parallel analyser.
    let tick = 0
    levelTimer.current = window.setInterval(() => {
      tick += 1
      setLevel(0.35 + 0.55 * Math.abs(Math.sin(tick / 3.2)))
    }, 80)

    try {
      const outcome = await listenAndTagCatCall(2800)
      clearLevelPulse()

      if (outcome.status === 'error') {
        setPhase('error')
        setErrorMessage(outcome.message)
        setResult(null)
        return
      }

      setResult(outcome.result)
      setPhase('result')
      if (outcome.status === 'no-sound') {
        setErrorMessage('No clear cat sound detected — tagged unclear.')
      } else {
        setErrorMessage(null)
      }
    } catch {
      clearLevelPulse()
      setPhase('error')
      setErrorMessage('Listening failed. Try again in a quieter spot.')
      setResult(null)
    } finally {
      busy.current = false
    }
  }

  function handleCancel() {
    stopCatListen()
    clearLevelPulse()
    busy.current = false
    setPhase('idle')
    setErrorMessage(null)
  }

  return (
    <section className="cat-listen" aria-labelledby="cat-listen-title">
      <header className="cat-listen__header">
        <div>
          <p className="cat-listen__eyebrow">Accessory</p>
          <h2 id="cat-listen-title">Cat listen</h2>
          <p className="cat-listen__lede">
            Tag a call <em>type</em> from the mic — meow, purr, hiss, trill, chirp, growl —
            with a confidence guess. Ethogram labels only; not a MeowTalk-style English
            translator.
          </p>
        </div>
        <div className="cat-listen__actions">
          {phase === 'listening' ? (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          ) : (
            <Button variant="attract" size="default" onClick={handleListen}>
              {phase === 'idle' ? 'Listen' : 'Listen again'}
            </Button>
          )}
        </div>
      </header>

      <p className="cat-listen__disclosure" role="note">
        {HONESTY_DISCLOSURE}
      </p>

      <ul className="cat-listen__ethogram" aria-label="Call-type ethogram glosses">
        {(Object.keys(ETHOGRAM_GLOSS) as Array<keyof typeof ETHOGRAM_GLOSS>).map((key) => (
          <li key={key}>
            <span className={`cat-listen__tag cat-listen__tag--${key}`}>{TYPE_LABEL[key]}</span>
            <span>{ETHOGRAM_GLOSS[key]}</span>
          </li>
        ))}
      </ul>

      {phase === 'listening' ? (
        <div className="cat-listen__meter" role="status" aria-live="polite">
          <div className="cat-listen__meter-bars" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  transform: `scaleY(${Math.max(0.2, level - i * 0.08)})`,
                }}
              />
            ))}
          </div>
          <p>Listening ~3s — hold the phone near your cat…</p>
        </div>
      ) : null}

      {phase === 'error' && errorMessage ? (
        <div className="cat-listen__banner cat-listen__banner--error" role="alert">
          <p>{errorMessage}</p>
          <Button variant="soft" size="sm" onClick={handleListen}>
            Try again
          </Button>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="cat-listen__result" role="status" aria-live="polite">
          <div className="cat-listen__tag-row">
            <span className={`cat-listen__tag cat-listen__tag--${result.type}`}>
              {TYPE_LABEL[result.type]}
            </span>
            <span className="cat-listen__confidence">{formatConfidence(result.confidence)}</span>
            {result.pitchHz != null ? (
              <span className="hz-chip">~{Math.round(result.pitchHz)} Hz</span>
            ) : null}
          </div>
          <p className="cat-listen__explain">{result.explanation}</p>
          {errorMessage ? <p className="cat-listen__hint">{errorMessage}</p> : null}
        </div>
      ) : null}

      {phase === 'idle' ? (
        <div className="cat-listen__empty" role="status">
          <p>
            Tap Listen, then let your cat vocalize. Low confidence or silence →{' '}
            <strong>unclear</strong>. Attract / deter boards below stay the main tools.
          </p>
        </div>
      ) : null}
    </section>
  )
}
