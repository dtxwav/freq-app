const ACCOUNTS_KEY = 'freq.accounts.v1'
const SESSION_KEY = 'freq.session.v1'

const PBKDF2_ITERATIONS = 120_000
const SALT_BYTES = 16
const HASH_BITS = 256

export type LocalAccount = {
  username: string
  salt: string
  hash: string
  createdAt: number
}

export type Session = {
  username: string
} | null

type AccountsMap = Record<string, Omit<LocalAccount, 'username'>>

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(view, (b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function readAccounts(): AccountsMap {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as AccountsMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAccounts(accounts: AccountsMap): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

async function deriveHash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS,
  )
  return bytesToHex(bits)
}

export function readSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { username?: string }
    if (!parsed?.username || typeof parsed.username !== 'string') return null
    return { username: normalizeUsername(parsed.username) }
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: normalizeUsername(session.username) }))
}

export function accountExists(username: string): boolean {
  const key = normalizeUsername(username)
  if (!key) return false
  return Boolean(readAccounts()[key])
}

export async function signUp(username: string, password: string): Promise<{ ok: true; username: string } | { ok: false; message: string }> {
  const key = normalizeUsername(username)
  if (key.length < 2 || key.length > 24) {
    return { ok: false, message: 'Username must be 2–24 characters.' }
  }
  if (!/^[a-z0-9._-]+$/i.test(key)) {
    return { ok: false, message: 'Use letters, numbers, dots, dashes, or underscores.' }
  }
  if (password.length < 4) {
    return { ok: false, message: 'Password must be at least 4 characters.' }
  }
  if (password.length > 128) {
    return { ok: false, message: 'Password is too long.' }
  }

  const accounts = readAccounts()
  if (accounts[key]) {
    return { ok: false, message: 'That username is already taken on this device.' }
  }

  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))
  const hash = await deriveHash(password, salt)
  accounts[key] = { salt, hash, createdAt: Date.now() }
  writeAccounts(accounts)
  writeSession({ username: key })
  return { ok: true, username: key }
}

export async function signIn(username: string, password: string): Promise<{ ok: true; username: string } | { ok: false; message: string }> {
  const key = normalizeUsername(username)
  const account = readAccounts()[key]
  if (!account) {
    return { ok: false, message: 'No account with that username on this device.' }
  }
  const hash = await deriveHash(password, account.salt)
  if (hash !== account.hash) {
    return { ok: false, message: 'Wrong password.' }
  }
  writeSession({ username: key })
  return { ok: true, username: key }
}

export function signOut(): void {
  writeSession(null)
}
