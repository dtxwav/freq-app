import { readSession } from './auth'

/** Matches audio VOLUME_NORMAL — comfortable loud default. */
export const DEFAULT_VOLUME = 0.45
export const GUEST_PROFILE_ID = 'guest'

export type UserProfile = {
  favorites: string[]
  playCounts: Record<string, number>
  volume: number
}

const PROFILE_PREFIX = 'freq.profile.v1:'

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME
  return Math.min(1, Math.max(0, value))
}

function emptyProfile(): UserProfile {
  return {
    favorites: [],
    playCounts: {},
    volume: DEFAULT_VOLUME,
  }
}

function sanitizeProfile(raw: unknown): UserProfile {
  const base = emptyProfile()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<UserProfile>
  const favorites = Array.isArray(data.favorites)
    ? data.favorites.filter((id): id is string => typeof id === 'string')
    : []
  const playCounts: Record<string, number> = {}
  if (data.playCounts && typeof data.playCounts === 'object') {
    for (const [id, count] of Object.entries(data.playCounts)) {
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
        playCounts[id] = Math.floor(count)
      }
    }
  }
  return {
    favorites: Array.from(new Set(favorites)),
    playCounts,
    volume: clampVolume(typeof data.volume === 'number' ? data.volume : DEFAULT_VOLUME),
  }
}

export function profileIdForSession(): string {
  const session = readSession()
  return session?.username ?? GUEST_PROFILE_ID
}

function storageKey(profileId: string): string {
  return `${PROFILE_PREFIX}${profileId}`
}

export function loadProfile(profileId = profileIdForSession()): UserProfile {
  try {
    const raw = localStorage.getItem(storageKey(profileId))
    if (!raw) return emptyProfile()
    return sanitizeProfile(JSON.parse(raw))
  } catch {
    return emptyProfile()
  }
}

export function saveProfile(profile: UserProfile, profileId = profileIdForSession()): void {
  const clean = sanitizeProfile(profile)
  localStorage.setItem(storageKey(profileId), JSON.stringify(clean))
}

export function updateProfile(
  updater: (current: UserProfile) => UserProfile,
  profileId = profileIdForSession(),
): UserProfile {
  const next = sanitizeProfile(updater(loadProfile(profileId)))
  saveProfile(next, profileId)
  return next
}

export function toggleFavorite(soundId: string, profileId = profileIdForSession()): UserProfile {
  return updateProfile((current) => {
    const has = current.favorites.includes(soundId)
    return {
      ...current,
      favorites: has
        ? current.favorites.filter((id) => id !== soundId)
        : [...current.favorites, soundId],
    }
  }, profileId)
}

export function recordPlay(soundId: string, profileId = profileIdForSession()): UserProfile {
  return updateProfile((current) => ({
    ...current,
    playCounts: {
      ...current.playCounts,
      [soundId]: (current.playCounts[soundId] ?? 0) + 1,
    },
  }), profileId)
}

export function setVolume(volume: number, profileId = profileIdForSession()): UserProfile {
  return updateProfile((current) => ({
    ...current,
    volume: clampVolume(volume),
  }), profileId)
}

/**
 * Sort sounds: favorites first (by play count within), then the rest by play count desc.
 * Stable for equal counts via original index.
 */
export function sortSoundsByUsage<T extends { id: string }>(
  sounds: T[],
  profile: UserProfile,
  options?: { favoritesOnly?: boolean },
): T[] {
  const indexed = sounds.map((sound, index) => ({ sound, index }))
  const filtered = options?.favoritesOnly
    ? indexed.filter(({ sound }) => profile.favorites.includes(sound.id))
    : indexed

  filtered.sort((a, b) => {
    const aFav = profile.favorites.includes(a.sound.id) ? 1 : 0
    const bFav = profile.favorites.includes(b.sound.id) ? 1 : 0
    if (aFav !== bFav) return bFav - aFav
    const aPlays = profile.playCounts[a.sound.id] ?? 0
    const bPlays = profile.playCounts[b.sound.id] ?? 0
    if (aPlays !== bPlays) return bPlays - aPlays
    return a.index - b.index
  })

  return filtered.map(({ sound }) => sound)
}
