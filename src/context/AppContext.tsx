import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { env } from '../config/env'
import { clearSpotifySessionId } from '../services/spotifySession'
import {
  CURATE_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  META_STORAGE_KEY,
  SCAN_STORAGE_KEY,
  isCuratePath,
  purgeLegacyStorage,
  readCurateDraftFromStorage,
  readJson,
  readScanSessionFromStorage,
  sanitizeCurateDraft,
  writeJson,
} from '../utils/flowStorage'
import type { EntrySource, MatchedSong, PlaylistResult } from '../types'

export type ReviewMode = 'scan' | 'curate' | 'shared'

interface FlowSession {
  songs: MatchedSong[]
  playlistName: string
  playlistDescription: string
}

interface CurateDraft extends FlowSession {
  shareUrl: string | null
  curatorName: string
}

interface SharedReview extends FlowSession {
  shareUrl: string
  publicId: string
  curatorName: string | null
}

interface AppMeta {
  reviewMode: ReviewMode
  spotifyConnected: boolean
  spotifyUsername: string | null
  playlistResult: PlaylistResult | null
  viewingSharedPlaylist: boolean
  shared: SharedReview | null
}

const defaultMeta = (): AppMeta => ({
  reviewMode: 'scan',
  spotifyConnected: false,
  spotifyUsername: null,
  playlistResult: null,
  viewingSharedPlaylist: false,
  shared: null,
})

const defaultScanSession = (): FlowSession => ({
  songs: [],
  playlistName: 'PutMeOn Playlist',
  playlistDescription: '',
})

const defaultCurateDraft = (): CurateDraft => ({
  songs: [],
  playlistName: 'PutMeOn Playlist',
  playlistDescription: '',
  shareUrl: null,
  curatorName: '',
})

const defaultPersisted = (): { scan: FlowSession; curate: CurateDraft; meta: AppMeta } => ({
  scan: defaultScanSession(),
  curate: defaultCurateDraft(),
  meta: defaultMeta(),
})

function readJsonLocal<T>(key: string): T | null {
  return readJson<T>(key)
}

function writeJsonLocal(key: string, value: unknown) {
  writeJson(key, value)
}

/** Legacy single-key format: root songs always go to scan, never curate. */
function migrateLegacy(parsed: Record<string, unknown>): { scan: FlowSession; curate: CurateDraft; meta: AppMeta } {
  const base = defaultPersisted()
  const legacySongs = (parsed.songs as MatchedSong[] | undefined) ?? []
  const playlistName = (parsed.playlistName as string | undefined) ?? 'PutMeOn Playlist'
  const playlistDescription = (parsed.playlistDescription as string | undefined) ?? ''
  const shareUrl = (parsed.shareUrl as string | null | undefined) ?? null
  const viewingSharedPlaylist = Boolean(parsed.viewingSharedPlaylist)
  const reviewMode = parsed.reviewMode as ReviewMode | undefined
  const entrySource = parsed.entrySource as string | undefined

  const isExplicitCurateExport =
    reviewMode === 'curate' && entrySource === 'curate' && legacySongs.length > 0 && !viewingSharedPlaylist

  if (viewingSharedPlaylist && legacySongs.length > 0 && shareUrl) {
    base.curate = { songs: legacySongs, playlistName, playlistDescription, shareUrl, curatorName: '' }
    base.meta.reviewMode = 'shared'
    base.meta.viewingSharedPlaylist = true
    const publicId = shareUrl.split('/p/').pop() ?? ''
    base.meta.shared = { songs: legacySongs, playlistName, playlistDescription, shareUrl, publicId, curatorName: null }
  } else if (isExplicitCurateExport) {
    base.curate = { songs: legacySongs, playlistName, playlistDescription, shareUrl, curatorName: '' }
    base.meta.reviewMode = 'curate'
  } else if (legacySongs.length > 0) {
    base.scan = { songs: legacySongs, playlistName, playlistDescription }
    base.meta.reviewMode = 'scan'
  }

  base.meta.spotifyConnected = Boolean(parsed.spotifyConnected)
  base.meta.spotifyUsername = (parsed.spotifyUsername as string | null | undefined) ?? null
  base.meta.playlistResult = (parsed.playlistResult as PlaylistResult | null | undefined) ?? null

  return base
}

function loadPersisted(): { scan: FlowSession; curate: CurateDraft; meta: AppMeta } {
  purgeLegacyStorage()

  const scanRaw = readScanSessionFromStorage()
  const scan: FlowSession = {
    songs: scanRaw.songs as MatchedSong[],
    playlistName: scanRaw.playlistName,
    playlistDescription: scanRaw.playlistDescription,
  }

  const curateStored = readCurateDraftFromStorage()
  const curate: CurateDraft = {
    songs: curateStored.songs as MatchedSong[],
    playlistName: curateStored.playlistName,
    playlistDescription: curateStored.playlistDescription,
    shareUrl: curateStored.shareUrl,
    curatorName: curateStored.curatorName ?? '',
  }

  const metaRaw = readJsonLocal<AppMeta>(META_STORAGE_KEY)
  let meta: AppMeta = metaRaw ? { ...defaultMeta(), ...metaRaw } : defaultMeta()

  const legacy = readJsonLocal<Record<string, unknown>>(LEGACY_STORAGE_KEY)
  if (legacy) {
    const migrated = migrateLegacy(legacy)
    if (!readJsonLocal(SCAN_STORAGE_KEY) && migrated.scan.songs.length > 0) {
      scan.songs = migrated.scan.songs
      scan.playlistName = migrated.scan.playlistName
      scan.playlistDescription = migrated.scan.playlistDescription
    }
    if (!readJsonLocal(CURATE_STORAGE_KEY) && migrated.curate.songs.length > 0) {
      curate.songs = migrated.curate.songs
      curate.playlistName = migrated.curate.playlistName
      curate.playlistDescription = migrated.curate.playlistDescription
      curate.shareUrl = migrated.curate.shareUrl
    }
    meta = { ...meta, ...migrated.meta }
    purgeLegacyStorage()
  }

  const sanitizedCurate = sanitizeCurateDraft(
    {
      songs: curate.songs,
      playlistName: curate.playlistName,
      playlistDescription: curate.playlistDescription,
      shareUrl: curate.shareUrl,
      curatorName: curate.curatorName,
    },
    { songs: scan.songs, playlistName: scan.playlistName, playlistDescription: scan.playlistDescription }
  )

  return {
    scan,
    curate: {
      songs: sanitizedCurate.songs as MatchedSong[],
      playlistName: sanitizedCurate.playlistName,
      playlistDescription: sanitizedCurate.playlistDescription,
      shareUrl: sanitizedCurate.shareUrl,
      curatorName: sanitizedCurate.curatorName ?? '',
    },
    meta,
  }
}

function savePersisted(scan: FlowSession, curate: CurateDraft, meta: AppMeta) {
  writeJsonLocal(SCAN_STORAGE_KEY, {
    songs: scan.songs,
    playlistName: scan.playlistName,
    playlistDescription: scan.playlistDescription,
  })

  if (isCuratePath()) {
    // CuratePage owns putmeon-curate-draft while on /curate
    writeJsonLocal(META_STORAGE_KEY, meta)
    return
  }

  const sanitized = sanitizeCurateDraft(
    {
      songs: curate.songs,
      playlistName: curate.playlistName,
      playlistDescription: curate.playlistDescription,
      shareUrl: curate.shareUrl,
      curatorName: curate.curatorName,
    },
    { songs: scan.songs, playlistName: scan.playlistName, playlistDescription: scan.playlistDescription }
  )

  writeJsonLocal(CURATE_STORAGE_KEY, sanitized)
  writeJsonLocal(META_STORAGE_KEY, meta)
}

function clearAllStorage() {
  sessionStorage.removeItem(SCAN_STORAGE_KEY)
  sessionStorage.removeItem(CURATE_STORAGE_KEY)
  sessionStorage.removeItem(META_STORAGE_KEY)
  sessionStorage.removeItem(LEGACY_STORAGE_KEY)
}

interface AppState {
  uploadedFiles: File[]
  imagePreviews: string[]
  reviewMode: ReviewMode
  /** Derived: `curate` for curate + shared review paths */
  entrySource: EntrySource
  viewingSharedPlaylist: boolean
  playlistResult: PlaylistResult | null
  spotifyConnected: boolean
  spotifyUsername: string | null
  /** Active review session (scan, curate export, or shared link) */
  songs: MatchedSong[]
  playlistName: string
  playlistDescription: string
  shareUrl: string | null
  /** Curate draft — isolated from scan results */
  curateSongs: MatchedSong[]
  curatePlaylistName: string
  curatePlaylistDescription: string
  curateShareUrl: string | null
  curateCuratorName: string
  curatorName: string | null
  sharedPublicId: string | null
  setUploadedFiles: (files: File[]) => void
  setImagePreviews: (previews: string[]) => void
  setReviewMode: (mode: ReviewMode) => void
  setViewingSharedPlaylist: (viewing: boolean) => void
  setScanSongs: (songs: MatchedSong[]) => void
  setSongs: (songs: MatchedSong[]) => void
  updateSong: (id: string, song: MatchedSong) => void
  removeSong: (id: string) => void
  addSong: (title: string, artist?: string) => void
  reorderSong: (id: string, direction: 'up' | 'down') => void
  setPlaylistName: (name: string) => void
  setPlaylistDescription: (description: string) => void
  setShareUrl: (url: string | null) => void
  setCurateSongs: (songs: MatchedSong[]) => void
  updateCurateSong: (id: string, song: MatchedSong) => void
  removeCurateSong: (id: string) => void
  addCurateSong: (title: string, artist?: string) => void
  reorderCurateSong: (id: string, direction: 'up' | 'down') => void
  setCuratePlaylistName: (name: string) => void
  setCuratePlaylistDescription: (description: string) => void
  setCurateShareUrl: (url: string | null) => void
  setCurateCuratorName: (name: string) => void
  loadSharedReview: (review: SharedReview) => void
  commitCurateDraft: (draft: CurateDraft) => void
  clearCurateDraft: () => void
  clearScanSession: () => void
  setSpotifyConnected: (connected: boolean, username?: string) => void
  setPlaylistResult: (result: PlaylistResult | null) => void
  /** @deprecated use clearCurateDraft / clearScanSession */
  setEntrySource: (source: EntrySource) => void
  reset: () => void
}

const AppContext = createContext<AppState | null>(null)

function makeSongId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function buildManualSong(title: string, artist?: string): MatchedSong {
  const resolvedArtist = artist?.trim() || 'Unknown Artist'
  const id = makeSongId('manual')
  const isMock = env.useMockApi
  return {
    id,
    title: title.trim(),
    artist: resolvedArtist,
    confidence: 1,
    status: isMock ? 'matched' : 'pending',
    spotifyTitle: isMock ? title.trim() : undefined,
    spotifyArtist: isMock ? resolvedArtist : undefined,
    spotifyTrackId: isMock ? `mock-track-${id}` : undefined,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted()
  const [uploadedFiles, setUploadedFilesState] = useState<File[]>([])
  const [imagePreviews, setImagePreviewsState] = useState<string[]>([])
  const [scanSession, setScanSessionState] = useState<FlowSession>(persisted.scan)
  const [curateDraft, setCurateDraftState] = useState<CurateDraft>(persisted.curate)
  const [sharedReview, setSharedReviewState] = useState<SharedReview | null>(persisted.meta.shared)
  const [reviewMode, setReviewModeState] = useState<ReviewMode>(persisted.meta.reviewMode)
  const [spotifyConnected, setSpotifyConnectedState] = useState(persisted.meta.spotifyConnected)
  const [spotifyUsername, setSpotifyUsername] = useState<string | null>(persisted.meta.spotifyUsername)
  const [playlistResult, setPlaylistResultState] = useState<PlaylistResult | null>(persisted.meta.playlistResult)
  const [viewingSharedPlaylist, setViewingSharedPlaylistState] = useState(persisted.meta.viewingSharedPlaylist)

  const entrySource: EntrySource = reviewMode === 'scan' ? 'scan' : 'curate'

  const activeReviewSession = useMemo((): FlowSession => {
    if (reviewMode === 'shared' && sharedReview) return sharedReview
    if (reviewMode === 'curate') return curateDraft
    return scanSession
  }, [reviewMode, sharedReview, curateDraft, scanSession])

  // Review-only selector — never use on /curate (CuratePage reads putmeon-curate-draft directly)
  const reviewSongs = activeReviewSession.songs
  const reviewPlaylistName = activeReviewSession.playlistName
  const reviewPlaylistDescription = activeReviewSession.playlistDescription
  const songs = reviewSongs
  const playlistName = reviewPlaylistName
  const playlistDescription = reviewPlaylistDescription
  const shareUrl =
    reviewMode === 'shared'
      ? (sharedReview?.shareUrl ?? null)
      : reviewMode === 'curate'
        ? curateDraft.shareUrl
        : null

  const curatorName =
    reviewMode === 'shared'
      ? (sharedReview?.curatorName ?? null)
      : reviewMode === 'curate'
        ? curateDraft.curatorName.trim() || null
        : null

  const sharedPublicId = reviewMode === 'shared' ? (sharedReview?.publicId ?? null) : null

  useEffect(() => {
    savePersisted(scanSession, curateDraft, {
      reviewMode,
      spotifyConnected,
      spotifyUsername,
      playlistResult,
      viewingSharedPlaylist,
      shared: sharedReview,
    })
  }, [
    scanSession,
    curateDraft,
    sharedReview,
    reviewMode,
    spotifyConnected,
    spotifyUsername,
    playlistResult,
    viewingSharedPlaylist,
  ])

  const patchActiveReview = useCallback(
    (patch: Partial<FlowSession>) => {
      if (reviewMode === 'shared' && sharedReview) {
        setSharedReviewState({ ...sharedReview, ...patch })
        return
      }
      if (reviewMode === 'curate') {
        setCurateDraftState((prev) => ({ ...prev, ...patch }))
        return
      }
      setScanSessionState((prev) => ({ ...prev, ...patch }))
    },
    [reviewMode, sharedReview]
  )

  const patchCurateDraft = useCallback((patch: Partial<CurateDraft>) => {
    setCurateDraftState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setUploadedFiles = useCallback((files: File[]) => setUploadedFilesState(files), [])
  const setImagePreviews = useCallback((previews: string[]) => setImagePreviewsState(previews), [])
  const setReviewMode = useCallback((mode: ReviewMode) => setReviewModeState(mode), [])
  const setViewingSharedPlaylist = useCallback((viewing: boolean) => setViewingSharedPlaylistState(viewing), [])
  const setPlaylistResult = useCallback((result: PlaylistResult | null) => setPlaylistResultState(result), [])

  const setScanSongs = useCallback((next: MatchedSong[]) => {
    setScanSessionState((prev) => ({ ...prev, songs: next }))
    setReviewModeState('scan')
  }, [])

  const setSongs = useCallback(
    (next: MatchedSong[]) => {
      patchActiveReview({ songs: next })
    },
    [patchActiveReview]
  )

  const setPlaylistName = useCallback(
    (name: string) => {
      patchActiveReview({ playlistName: name })
    },
    [patchActiveReview]
  )

  const setPlaylistDescription = useCallback(
    (description: string) => {
      patchActiveReview({ playlistDescription: description })
    },
    [patchActiveReview]
  )

  const setShareUrl = useCallback(
    (url: string | null) => {
      if (reviewMode === 'curate') {
        patchCurateDraft({ shareUrl: url })
      }
    },
    [reviewMode, patchCurateDraft]
  )

  const setEntrySource = useCallback((source: EntrySource) => {
    setReviewModeState(source === 'scan' ? 'scan' : 'curate')
  }, [])

  const setSpotifyConnected = useCallback((connected: boolean, username?: string) => {
    setSpotifyConnectedState(connected)
    setSpotifyUsername(username ?? null)
  }, [])

  const updateSong = useCallback(
    (id: string, song: MatchedSong) => {
      patchActiveReview({
        songs: songs.map((s) => (s.id === id ? song : s)),
      })
    },
    [patchActiveReview, songs]
  )

  const removeSong = useCallback(
    (id: string) => {
      patchActiveReview({ songs: songs.filter((s) => s.id !== id) })
    },
    [patchActiveReview, songs]
  )

  const addSong = useCallback(
    (title: string, artist?: string) => {
      patchActiveReview({ songs: [...songs, buildManualSong(title, artist)] })
    },
    [patchActiveReview, songs]
  )

  const reorderSong = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const index = songs.findIndex((s) => s.id === id)
      if (index < 0) return
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= songs.length) return
      const next = [...songs]
      ;[next[index], next[target]] = [next[target], next[index]]
      patchActiveReview({ songs: next })
    },
    [patchActiveReview, songs]
  )

  const setCurateSongs = useCallback((next: MatchedSong[]) => {
    patchCurateDraft({ songs: next })
  }, [patchCurateDraft])

  const updateCurateSong = useCallback(
    (id: string, song: MatchedSong) => {
      setCurateDraftState((prev) => ({
        ...prev,
        songs: prev.songs.map((s) => (s.id === id ? song : s)),
      }))
    },
    []
  )

  const removeCurateSong = useCallback((id: string) => {
    setCurateDraftState((prev) => ({ ...prev, songs: prev.songs.filter((s) => s.id !== id) }))
  }, [])

  const addCurateSong = useCallback((title: string, artist?: string) => {
    setCurateDraftState((prev) => ({ ...prev, songs: [...prev.songs, buildManualSong(title, artist)] }))
  }, [])

  const reorderCurateSong = useCallback((id: string, direction: 'up' | 'down') => {
    setCurateDraftState((prev) => {
      const index = prev.songs.findIndex((s) => s.id === id)
      if (index < 0) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.songs.length) return prev
      const next = [...prev.songs]
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, songs: next }
    })
  }, [])

  const setCuratePlaylistName = useCallback((name: string) => {
    patchCurateDraft({ playlistName: name })
  }, [patchCurateDraft])

  const setCuratePlaylistDescription = useCallback((description: string) => {
    patchCurateDraft({ playlistDescription: description })
  }, [patchCurateDraft])

  const setCurateShareUrl = useCallback((url: string | null) => {
    patchCurateDraft({ shareUrl: url })
  }, [patchCurateDraft])

  const setCurateCuratorName = useCallback((name: string) => {
    patchCurateDraft({ curatorName: name })
  }, [patchCurateDraft])

  const loadSharedReview = useCallback((review: SharedReview) => {
    setSharedReviewState(review)
    setReviewModeState('shared')
    setViewingSharedPlaylistState(true)
  }, [])

  const commitCurateDraft = useCallback((draft: CurateDraft) => {
    setCurateDraftState(draft)
    setReviewModeState('curate')
    setViewingSharedPlaylistState(false)
  }, [])

  const clearCurateDraft = useCallback(() => {
    setCurateDraftState(defaultCurateDraft())
  }, [])

  const clearScanSession = useCallback(() => {
    setScanSessionState(defaultScanSession())
    setUploadedFilesState([])
    setImagePreviewsState([])
  }, [])

  const reset = useCallback(() => {
    setUploadedFilesState([])
    setImagePreviewsState([])
    setScanSessionState(defaultScanSession())
    setCurateDraftState(defaultCurateDraft())
    setSharedReviewState(null)
    setReviewModeState('scan')
    setSpotifyConnectedState(false)
    setSpotifyUsername(null)
    setPlaylistResultState(null)
    setViewingSharedPlaylistState(false)
    clearAllStorage()
    clearSpotifySessionId()
  }, [])

  const value = useMemo(
    () => ({
      uploadedFiles,
      imagePreviews,
      reviewMode,
      entrySource,
      viewingSharedPlaylist,
      playlistResult,
      spotifyConnected,
      spotifyUsername,
      songs,
      playlistName,
      playlistDescription,
      shareUrl,
      curatorName,
      sharedPublicId,
      curateSongs: curateDraft.songs,
      curatePlaylistName: curateDraft.playlistName,
      curatePlaylistDescription: curateDraft.playlistDescription,
      curateShareUrl: curateDraft.shareUrl,
      curateCuratorName: curateDraft.curatorName,
      setUploadedFiles,
      setImagePreviews,
      setReviewMode,
      setViewingSharedPlaylist,
      setScanSongs,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      reorderSong,
      setPlaylistName,
      setPlaylistDescription,
      setShareUrl,
      setCurateSongs,
      updateCurateSong,
      removeCurateSong,
      addCurateSong,
      reorderCurateSong,
      setCuratePlaylistName,
      setCuratePlaylistDescription,
      setCurateShareUrl,
      setCurateCuratorName,
      loadSharedReview,
      commitCurateDraft,
      clearCurateDraft,
      clearScanSession,
      setSpotifyConnected,
      setPlaylistResult,
      setEntrySource,
      reset,
    }),
    [
      uploadedFiles,
      imagePreviews,
      reviewMode,
      entrySource,
      viewingSharedPlaylist,
      playlistResult,
      spotifyConnected,
      spotifyUsername,
      songs,
      playlistName,
      playlistDescription,
      shareUrl,
      curatorName,
      sharedPublicId,
      curateDraft,
      setUploadedFiles,
      setImagePreviews,
      setReviewMode,
      setViewingSharedPlaylist,
      setScanSongs,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      reorderSong,
      setPlaylistName,
      setPlaylistDescription,
      setShareUrl,
      setCurateSongs,
      updateCurateSong,
      removeCurateSong,
      addCurateSong,
      reorderCurateSong,
      setCuratePlaylistName,
      setCuratePlaylistDescription,
      setCurateShareUrl,
      setCurateCuratorName,
      loadSharedReview,
      commitCurateDraft,
      clearCurateDraft,
      clearScanSession,
      setSpotifyConnected,
      setPlaylistResult,
      setEntrySource,
      reset,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
