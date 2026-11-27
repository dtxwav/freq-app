import { animals, type AnimalId } from '../data/animals'
import { AnimalArt } from './AnimalArt'
import { Button } from './ui/button'

type AnimalHomeProps = {
  onSelect: (id: AnimalId) => void
  loading?: boolean
  username?: string | null
  onOpenAuth?: () => void
}

export function AnimalHome({ onSelect, loading, username, onOpenAuth }: AnimalHomeProps) {
  if (loading) {
    return (
      <section className="home" aria-busy="true" aria-live="polite">
        <header className="hero">
          <p className="brand">Freq</p>
          <h1>Loading sound boards…</h1>
          <p className="lede">Preparing attract, lure, and deter cues.</p>
        </header>
        <div className="animal-rail">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animal-tile animal-tile--skeleton" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="home">
      <div className="home__top">
        {onOpenAuth ? (
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
        ) : null}
      </div>
      <header className="hero">
        <p className="brand">Freq</p>
        <h1>Pick an animal. Play a cue.</h1>
        <p className="lede">
          Attract near you, lure toward a thrown speaker, or deter. Every tone is labeled for
          evidence — research, mixed, experimental, or myth.
        </p>
      </header>

      <div className="animal-rail" role="list">
        {animals.map((animal, index) => (
          <button
            key={animal.id}
            type="button"
            role="listitem"
            className="animal-tile"
            style={{ ['--accent' as string]: animal.accent, animationDelay: `${index * 70}ms` }}
            onClick={() => onSelect(animal.id)}
          >
            <span className="animal-tile__art">
              <AnimalArt id={animal.id} />
            </span>
            <span className="animal-tile__copy">
              <span className="animal-tile__name">{animal.name}</span>
              <span className="animal-tile__tag">{animal.tagline}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
