import { matchSongsToSpotify } from '../data/mockSongs'
import { detectSongsFromImages } from './songDetection'
import type { DetectedSong, MatchedSong, PlaylistResult, ScanResult, SharedPlaylist, PublicProfile } from '../types'
import { sharedPlaylistUrl } from '../config/env'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockSharedPlaylists = new Map<string, SharedPlaylist>()
const mockExportKeys = new Map<string, Set<string>>()

function mockRecordExport(publicId: string, exporterKey: string): { exportCount: number; recorded: boolean } {
  const playlist = mockSharedPlaylists.get(publicId)
  if (!playlist) return { exportCount: 0, recorded: false }

  const keys = mockExportKeys.get(publicId) ?? new Set<string>()
  if (keys.has(exporterKey)) {
    return { exportCount: playlist.exportCount, recorded: false }
  }

  keys.add(exporterKey)
  mockExportKeys.set(publicId, keys)
  const exportCount = playlist.exportCount + 1
  mockSharedPlaylists.set(publicId, { ...playlist, exportCount })
  return { exportCount, recorded: true }
}

export async function detectSongsFromImagesForScan(files: File[]): Promise<DetectedSong[]> {
  const { songs } = await detectSongsFromImages(files)
  return songs
}

export async function matchSongsWithSpotify(songs: DetectedSong[]): Promise<MatchedSong[]> {
  await delay(800)
  return matchSongsToSpotify(songs)
}

export async function processScan(files: File[]): Promise<ScanResult> {
  const songsDetected = await detectSongsFromImagesForScan(files)
  const songsMatched = await matchSongsWithSpotify(songsDetected)
  return { songsDetected, songsMatched }
}

export async function retrySongMatch(song: MatchedSong): Promise<MatchedSong> {
  await delay(800)
  return {
    ...song,
    status: 'matched',
    spotifyTitle: song.title,
    spotifyArtist: song.artist,
    spotifyTrackId: `mock-track-${song.id}-retry`,
  }
}

export async function connectSpotify(_returnUrl?: string): Promise<{ connected: boolean; username: string }> {
  await delay(1500)
  return { connected: true, username: 'musiclover' }
}

export async function saveSharedPlaylist(
  name: string,
  songs: MatchedSong[],
  description?: string,
  curatorName?: string
): Promise<{ publicId: string; shareUrl: string }> {
  await delay(300)
  const publicId = `mock-${Date.now().toString(36)}`
  mockSharedPlaylists.set(publicId, {
    publicId,
    name,
    description: description?.trim() || null,
    curatorName: curatorName?.trim() || null,
    songs,
    exportCount: 0,
  })
  return { publicId, shareUrl: sharedPlaylistUrl(publicId) }
}

export async function fetchSharedPlaylist(publicId: string): Promise<SharedPlaylist> {
  await delay(400)
  const playlist = mockSharedPlaylists.get(publicId)
  if (!playlist) throw new Error('Playlist not found.')
  return { ...playlist, exportCount: playlist.exportCount ?? 0 }
}

const MOCK_PROFILE: PublicProfile = {
  username: 'playorrrr',
  displayName: 'playorrrr',
  avatarUrl: null,
  bio: 'Curator. Overthinker. Always on the aux.',
  memberSince: '2024-01-15T00:00:00.000Z',
  totalPlaylists: 4,
  totalExports: 2100,
  playlists: [
    {
      publicId: 'mock-late-night',
      name: 'late night drive',
      description: 'smooth vibes for late night drives.',
      songCount: 37,
      exportCount: 2100,
    },
    {
      publicId: 'mock-rnb',
      name: 'rnb essentials',
      description: 'slow burns and late texts.',
      songCount: 24,
      exportCount: 890,
    },
    {
      publicId: 'mock-throwbacks',
      name: 'throwback hour',
      description: '2000s hits that still hit.',
      songCount: 42,
      exportCount: 540,
    },
    {
      publicId: 'mock-afrobeats',
      name: 'afrobeats rotation',
      description: 'current rotation, no skips.',
      songCount: 31,
      exportCount: 320,
    },
  ],
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile> {
  await delay(400)
  const normalized = username.trim().toLowerCase()
  if (normalized === MOCK_PROFILE.username) return MOCK_PROFILE
  throw new Error('Profile not found.')
}

export async function createSpotifyPlaylist(
  songs: MatchedSong[],
  name = 'PutMeOn Playlist',
  description?: string,
  publicId?: string
): Promise<PlaylistResult> {
  await delay(2000)
  const matchedTracks = songs.filter((s) => s.status === 'matched' || s.status === 'possible')
  const share = await saveSharedPlaylist(name, songs, description)
  const tracking = publicId ? mockRecordExport(publicId, 'mock-exporter') : null
  return {
    id: `mock-playlist-${Date.now()}`,
    name,
    url: 'https://open.spotify.com/playlist/mock123',
    trackCount: matchedTracks.length,
    shareId: share.publicId,
    shareUrl: share.shareUrl,
    ...(tracking
      ? { exportCount: tracking.exportCount, exportRecorded: tracking.recorded }
      : {}),
  }
}
