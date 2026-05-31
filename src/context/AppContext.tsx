import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { env } from '../config/env'
import { clearSpotifySessionId } from '../services/spotifySession'
import type { MatchedSong, PlaylistResult } from '../types'

const STORAGE_KEY = 'putmeon-session'

interface PersistedState {
  songs: MatchedSong[]
  spotifyConnected: boolean
  spotifyUsername: string | null
  playlistResult: PlaylistResult | null
  playlistName: string
}

interface AppState extends PersistedState {
  uploadedFiles: File[]
  imagePreviews: string[]
  setUploadedFiles: (files: File[]) => void
  setImagePreviews: (previews: string[]) => void
  setSongs: (songs: MatchedSong[]) => void
  updateSong: (id: string, song: MatchedSong) => void
  removeSong: (id: string) => void
  addSong: (title: string, artist: string) => void
  setSpotifyConnected: (connected: boolean, username?: string) => void
  setPlaylistResult: (result: PlaylistResult | null) => void
  setPlaylistName: (name: string) => void
  reset: () => void
}

const defaultPersisted: PersistedState = {
  songs: [],
  spotifyConnected: false,
  spotifyUsername: null,
  playlistResult: null,
  playlistName: 'PutMeOn Playlist',
}

function loadPersisted(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersisted
    return { ...defaultPersisted, ...JSON.parse(raw) }
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

  useEffect(() => {
    savePersisted({ songs, spotifyConnected, spotifyUsername, playlistResult, playlistName })
  }, [songs, spotifyConnected, spotifyUsername, playlistResult, playlistName])

  const setUploadedFiles = useCallback((files: File[]) => setUploadedFilesState(files), [])
  const setImagePreviews = useCallback((previews: string[]) => setImagePreviewsState(previews), [])
  const setSongs = useCallback((next: MatchedSong[]) => setSongsState(next), [])
  const setPlaylistResult = useCallback((result: PlaylistResult | null) => setPlaylistResultState(result), [])
  const setPlaylistName = useCallback((name: string) => setPlaylistNameState(name), [])

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

  const addSong = useCallback((title: string, artist: string) => {
    const id = `manual-${Date.now()}`
    const isMock = env.useMockApi
    setSongsState((prev) => [
      ...prev,
      {
        id,
        title,
        artist,
        confidence: 1,
        status: isMock ? ('matched' as const) : ('pending' as const),
        spotifyTitle: isMock ? title : undefined,
        spotifyArtist: isMock ? artist : undefined,
        spotifyTrackId: isMock ? `mock-track-${id}` : undefined,
      },
    ])
  }, [])

  const reset = useCallback(() => {
    setUploadedFilesState([])
    setImagePreviewsState([])
    setSongsState([])
    setSpotifyConnectedState(false)
    setSpotifyUsername(null)
    setPlaylistResultState(null)
    setPlaylistNameState('PutMeOn Playlist')
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
      setUploadedFiles,
      setImagePreviews,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      setSpotifyConnected,
      setPlaylistResult,
      setPlaylistName,
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
      setUploadedFiles,
      setImagePreviews,
      setSongs,
      updateSong,
      removeSong,
      addSong,
      setSpotifyConnected,
      setPlaylistResult,
      setPlaylistName,
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
