import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { env } from '../config/env'
import { clearSpotifySessionId } from '../services/spotifySession'
import type { EntrySource, MatchedSong, PlaylistResult } from '../types'

const STORAGE_KEY = 'putmeon-session'

interface PersistedState {
  songs: MatchedSong[]
  spotifyConnected: boolean
  spotifyUsername: string | null
  playlistResult: PlaylistResult | null
  playlistName: string
  playlistDescription: string
  entrySource: EntrySource
  shareUrl: string | null
}

interface AppState extends PersistedState {
  uploadedFiles: File[]
  imagePreviews: string[]
  setUploadedFiles: (files: File[]) => void
  setImagePreviews: (previews: string[]) => void
  setSongs: (songs: MatchedSong[]) => void
  updateSong: (id: string, song: MatchedSong) => void
  removeSong: (id: string) => void
  addSong: (title: string, artist?: string) => void
  reorderSong: (id: string, direction: 'up' | 'down') => void
  setSpotifyConnected: (connected: boolean, username?: string) => void
  setPlaylistResult: (result: PlaylistResult | null) => void
  setPlaylistName: (name: string) => void
  setPlaylistDescription: (description: string) => void
  setEntrySource: (source: EntrySource) => void
  setShareUrl: (url: string | null) => void
  reset: () => void
}

const defaultPersisted: PersistedState = {
  songs: [],
  spotifyConnected: false,
  spotifyUsername: null,
  playlistResult: null,
  playlistName: 'PutMeOn Playlist',
  playlistDescription: '',
  entrySource: 'scan',
  shareUrl: null,
}

function loadPersisted(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersisted
    const parsed = JSON.parse(raw)
    return {
      ...defaultPersisted,
      ...parsed,
      entrySource: parsed.entrySource === 'curate' ? 'curate' : 'scan',
    }
  } catch {
    return defaultPersisted
  }
}

function savePersisted(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage full or unavailable
  }
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted()
  const [uploadedFiles, setUploadedFilesState] = useState<File[]>([])
  const [imagePreviews, setImagePreviewsState] = useState<string[]>([])
  const [songs, setSongsState] = useState<MatchedSong[]>(persisted.songs)
  const [spotifyConnected, setSpotifyConnectedState] = useState(persisted.spotifyConnected)
  const [spotifyUsername, setSpotifyUsername] = useState<string | null>(persisted.spotifyUsername)
  const [playlistResult, setPlaylistResultState] = useState<PlaylistResult | null>(persisted.playlistResult)
  const [playlistName, setPlaylistNameState] = useState(persisted.playlistName)
  const [playlistDescription, setPlaylistDescriptionState] = useState(persisted.playlistDescription)
  const [entrySource, setEntrySourceState] = useState<EntrySource>(persisted.entrySource)
  const [shareUrl, setShareUrlState] = useState<string | null>(persisted.shareUrl ?? null)

  useEffect(() => {
    savePersisted({
      songs,
      spotifyConnected,
      spotifyUsername,
      playlistResult,
      playlistName,
      playlistDescription,
      entrySource,
      shareUrl,
    })
  }, [songs, spotifyConnected, spotifyUsername, playlistResult, playlistName, playlistDescription, entrySource, shareUrl])

  const setUploadedFiles = useCallback((files: File[]) => setUploadedFilesState(files), [])
  const setImagePreviews = useCallback((previews: string[]) => setImagePreviewsState(previews), [])
  const setSongs = useCallback((next: MatchedSong[]) => setSongsState(next), [])
  const setPlaylistResult = useCallback((result: PlaylistResult | null) => setPlaylistResultState(result), [])
  const setPlaylistName = useCallback((name: string) => setPlaylistNameState(name), [])
  const setPlaylistDescription = useCallback((description: string) => setPlaylistDescriptionState(description), [])
  const setEntrySource = useCallback((source: EntrySource) => setEntrySourceState(source), [])
  const setShareUrl = useCallback((url: string | null) => setShareUrlState(url), [])

  const setSpotifyConnected = useCallback((connected: boolean, username?: string) => {
    setSpotifyConnectedState(connected)
    setSpotifyUsername(username ?? null)
  }, [])

  const updateSong = useCallback((id: string, song: MatchedSong) => {
    setSongsState((prev) => prev.map((s) => (s.id === id ? song : s)))
  }, [])

  const removeSong = useCallback((id: string) => {
    setSongsState((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addSong = useCallback((title: string, artist?: string) => {
    const resolvedArtist = artist?.trim() || 'Unknown Artist'
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const isMock = env.useMockApi
    setSongsState((prev) => [
      ...prev,
      {
        id,
        title: title.trim(),
        artist: resolvedArtist,
        confidence: 1,
        status: isMock ? ('matched' as const) : ('pending' as const),
        spotifyTitle: isMock ? title.trim() : undefined,
        spotifyArtist: isMock ? resolvedArtist : undefined,
        spotifyTrackId: isMock ? `mock-track-${id}` : undefined,
      },
    ])
  }, [])

  const reorderSong = useCallback((id: string, direction: 'up' | 'down') => {
    setSongsState((prev) => {
      const index = prev.findIndex((s) => s.id === id)
      if (index < 0) return prev
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setUploadedFilesState([])
    setImagePreviewsState([])
    setSongsState([])
    setSpotifyConnectedState(false)
    setSpotifyUsername(null)
    setPlaylistResultState(null)
    setPlaylistNameState('PutMeOn Playlist')
    setPlaylistDescriptionState('')
    setEntrySourceState('scan')
    setShareUrlState(null)
    sessionStorage.removeItem(STORAGE_KEY)
    clearSpotifySessionId()
  }, [])

  const value = useMemo(
    () => ({
      uploadedFiles,
      imagePreviews,
      songs,
      spotifyConnected,
      spotifyUsername,
      playlistResult,
      playlistName,
      playlistDescription,
      entrySource,
      shareUrl,
      setUploadedFiles,
      setImagePreviews,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      reorderSong,
      setSpotifyConnected,
      setPlaylistResult,
      setPlaylistName,
      setPlaylistDescription,
      setEntrySource,
      setShareUrl,
      reset,
    }),
    [
      uploadedFiles,
      imagePreviews,
      songs,
      spotifyConnected,
      spotifyUsername,
      playlistResult,
      playlistName,
      playlistDescription,
      entrySource,
      shareUrl,
      setUploadedFiles,
      setImagePreviews,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      reorderSong,
      setSpotifyConnected,
      setPlaylistResult,
      setPlaylistName,
      setPlaylistDescription,
      setEntrySource,
      setShareUrl,
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
