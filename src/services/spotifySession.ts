const SESSION_KEY = 'putmeon-spotify-session'

export function getSpotifySessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function setSpotifySessionId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, id)
  } catch {
    // sessionStorage unavailable
  }
}

export function clearSpotifySessionId(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
