/** Session storage keys — scan and curate must never share a bucket. */
export const SCAN_STORAGE_KEY = 'putmeon-scan-session'
export const CURATE_STORAGE_KEY = 'putmeon-curate-draft'
export const META_STORAGE_KEY = 'putmeon-app-meta'
export const LEGACY_STORAGE_KEY = 'putmeon-session'

export interface StoredFlowSession {
  songs: Array<{ id: string; title: string; artist: string }>
  playlistName: string
  playlistDescription: string
}

export interface StoredCurateDraft extends StoredFlowSession {
  shareUrl: string | null
}

const DEFAULT_PLAYLIST_NAME = 'PutMeOn Playlist'

export function defaultStoredCurateDraft(): StoredCurateDraft {
  return {
    songs: [],
    playlistName: DEFAULT_PLAYLIST_NAME,
    playlistDescription: '',
    shareUrl: null,
  }
}

export function defaultStoredScanSession(): StoredFlowSession {
  return {
    songs: [],
    playlistName: DEFAULT_PLAYLIST_NAME,
    playlistDescription: '',
  }
}

export function isCuratePath(pathname = window.location.pathname): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return normalized.endsWith('/curate')
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sessionStorage full or unavailable
  }
}

function songListFingerprint(songs: StoredFlowSession['songs']): string {
  return songs.map((s) => `${s.title}\0${s.artist}`).join('\n')
}

/** True when curate bucket is a duplicate of scan (the leak we're fixing). */
export function isCurateDuplicateOfScan(
  curate: StoredCurateDraft | StoredFlowSession | null | undefined,
  scan: StoredFlowSession | null | undefined
): boolean {
  if (!curate?.songs?.length || !scan?.songs?.length) return false
  if (curate.songs.length !== scan.songs.length) return false
  return songListFingerprint(curate.songs) === songListFingerprint(scan.songs)
}

export function sanitizeCurateDraft(
  curate: StoredCurateDraft,
  scan: StoredFlowSession
): StoredCurateDraft {
  if (!curate.songs.length) return curate
  if (isCurateDuplicateOfScan(curate, scan)) return defaultStoredCurateDraft()
  return curate
}

/** Curate page must ONLY read this — never scan or legacy root songs. */
export function readCurateDraftFromStorage(): StoredCurateDraft {
  const scan = readJson<StoredFlowSession>(SCAN_STORAGE_KEY) ?? defaultStoredScanSession()
  const raw = readJson<StoredCurateDraft>(CURATE_STORAGE_KEY)
  if (!raw) return defaultStoredCurateDraft()
  return sanitizeCurateDraft(
    {
      ...defaultStoredCurateDraft(),
      ...raw,
      songs: Array.isArray(raw.songs) ? raw.songs : [],
    },
    scan
  )
}

export function writeCurateDraftToStorage(draft: StoredCurateDraft) {
  const scan = readJson<StoredFlowSession>(SCAN_STORAGE_KEY) ?? defaultStoredScanSession()
  writeJson(CURATE_STORAGE_KEY, sanitizeCurateDraft(draft, scan))
}

/** Remove legacy single-key blob so old bundles cannot re-pollute curate. */
export function purgeLegacyStorage() {
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function resetCurateDraftToFresh() {
  purgeLegacyStorage()
  writeCurateDraftToStorage(defaultStoredCurateDraft())
}

export const CURATE_RESET_EVENT = 'putmeon:curate-reset'

/** Clear curate storage and notify CuratePage to reset in-memory state. */
export function dispatchCurateReset() {
  resetCurateDraftToFresh()
  window.dispatchEvent(new CustomEvent(CURATE_RESET_EVENT))
}

export function readScanSessionFromStorage(): StoredFlowSession {
  const raw = readJson<StoredFlowSession>(SCAN_STORAGE_KEY)
  if (!raw) return defaultStoredScanSession()
  return {
    ...defaultStoredScanSession(),
    ...raw,
    songs: Array.isArray(raw.songs) ? raw.songs : [],
  }
}
