import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { accountExists, signIn, signOut, signUp } from '../lib/auth'
import { Button } from './ui/button'

type AuthDialogProps = {
  open: boolean
  username: string | null
  onClose: () => void
  onAuthed: (username: string | null) => void
}

type Mode = 'signin' | 'signup'

export function AuthDialog({ open, username, onClose, onAuthed }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus()
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = mode === 'signup' ? await signUp(name, password) : await signIn(name, password)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setPassword('')
      onAuthed(result.username)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  function handleGuest() {
    signOut()
    setPassword('')
    onAuthed(null)
    onClose()
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    if (next === 'signup' && name && accountExists(name)) {
      setError('That username already exists — sign in instead.')
    }
  }

  return createPortal(
    <div className="auth-scrim" role="presentation" data-testid="auth-scrim" onClick={onClose}>
      <div
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="auth-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="auth-dialog__header">
          <p className="brand brand--sm">Freq</p>
          <h2 id={titleId}>
            {username
              ? `Signed in as ${username}`
              : mode === 'signup'
                ? 'Create local account'
                : 'Sign in'}
          </h2>
          <p>
            Username + password only — stored on this device with a salted hash. No email, no cloud.
            Favorites, play counts, and volume follow your profile.
          </p>
        </header>

        {username ? (
          <div className="auth-dialog__actions">
            <Button type="button" variant="soft" onClick={handleGuest}>
              Sign out to guest
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Username</span>
              <input
                ref={firstFieldRef}
                autoComplete="username"
                name="username"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. rawi"
                required
                minLength={2}
                maxLength={24}
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={4}
                maxLength={128}
              />
            </label>

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="auth-dialog__actions">
              <Button type="submit" variant="attract" disabled={busy}>
                {busy ? 'Working…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleGuest}>
                Continue as guest
              </Button>
            </div>

            <p className="auth-switch">
              {mode === 'signin' ? (
                <>
                  New here?{' '}
                  <button type="button" className="text-link" onClick={() => switchMode('signup')}>
                    Create a local account
                  </button>
                </>
              ) : (
                <>
                  Already have one?{' '}
                  <button type="button" className="text-link" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
