// Google Identity Services (GIS) token client for OAuth2 access to
// Calendar (read) and Tasks (read/write, so checking off a Priority
// syncs back to Google Tasks).

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
].join(' ')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const TOKEN_STORAGE_KEY = 'planner.google.token'

type StoredToken = {
  accessToken: string
  expiresAt: number // epoch ms
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let gisLoaded: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (gisLoaded) return gisLoaded
  gisLoaded = new Promise((resolve, reject) => {
    if (document.getElementById('gis-script')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
  return gisLoaded
}

function readStoredToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredToken
    if (parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredToken(token: StoredToken) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
}

function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function hasClientId(): boolean {
  return Boolean(CLIENT_ID)
}

async function ensureTokenClient(): Promise<google.accounts.oauth2.TokenClient> {
  await loadGisScript()
  if (!CLIENT_ID) {
    throw new Error(
      'Missing VITE_GOOGLE_CLIENT_ID. Create a Google Cloud OAuth client and set it in .env.local (see README).',
    )
  }
  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {
        // overridden per-call in requestAccessToken
      },
    })
  }
  return tokenClient
}

export async function requestAccessToken(opts?: { silent?: boolean }): Promise<string> {
  const client = await ensureTokenClient()
  return new Promise((resolve, reject) => {
    client.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error))
        return
      }
      const expiresAt = Date.now() + Number(response.expires_in) * 1000 - 30_000
      writeStoredToken({ accessToken: response.access_token, expiresAt })
      resolve(response.access_token)
    }
    client.requestAccessToken({ prompt: opts?.silent ? '' : 'consent' })
  })
}

export async function getAccessToken(): Promise<string> {
  const stored = readStoredToken()
  if (stored) return stored.accessToken
  return requestAccessToken({ silent: true })
}

export function signOut() {
  const stored = readStoredToken()
  clearStoredToken()
  if (stored && typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(stored.accessToken, () => {})
  }
}

export function isSignedIn(): boolean {
  return readStoredToken() !== null
}
