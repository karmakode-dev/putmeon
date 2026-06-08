export type MatchStatus = 'pending' | 'matched' | 'possible' | 'failed'

export interface DetectedSong {
  id: string
  title: string
  artist: string
  confidence: number
}

export interface MatchedSong extends DetectedSong {
  status: MatchStatus
  spotifyTitle?: string
  spotifyArtist?: string
  spotifyTrackId?: string
}

export interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete'
}

export interface ScanResult {
  songsDetected: DetectedSong[]
  songsMatched: MatchedSong[]
  matchNote?: string
}

export interface PlaylistResult {
  id: string
  name: string
  url: string
  trackCount: number
  shareId?: string
  shareUrl?: string
  exportCount?: number
  exportRecorded?: boolean
}

export interface SharedPlaylist {
  publicId: string
  name: string
  description: string | null
  curatorName: string | null
  songs: MatchedSong[]
  exportCount: number
}

export type EntrySource = 'scan' | 'curate'
