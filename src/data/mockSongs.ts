import type { DetectedSong, MatchedSong } from '../types'

export const MOCK_DETECTED_SONGS: DetectedSong[] = [
  { id: '1', title: 'Runaway', artist: 'Kanye West', confidence: 0.95 },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', confidence: 0.98 },
  { id: '3', title: 'Good 4 U', artist: 'Olivia Rodrigo', confidence: 0.92 },
  { id: '4', title: 'Levitating', artist: 'Dua Lipa', confidence: 0.97 },
  { id: '5', title: 'Peaches', artist: 'Justin Bieber', confidence: 0.94 },
  { id: '6', title: 'Save Your Tears', artist: 'The Weeknd', confidence: 0.96 },
  { id: '7', title: 'Montero', artist: 'Lil Nas X', confidence: 0.91 },
  { id: '8', title: 'Stay', artist: 'The Kid LAROI', confidence: 0.89 },
  { id: '9', title: 'Industry Baby', artist: 'Lil Nas X', confidence: 0.93 },
  { id: '10', title: 'Heat Waves', artist: 'Glass Animals', confidence: 0.88 },
  { id: '11', title: 'Bad Habits', artist: 'Ed Sheeran', confidence: 0.90 },
  { id: '12', title: 'Shivers', artist: 'Ed Sheeran', confidence: 0.87 },
  { id: '13', title: 'Easy On Me', artist: 'Adele', confidence: 0.96 },
  { id: '14', title: 'Ghost', artist: 'Justin Bieber', confidence: 0.85 },
  { id: '15', title: 'Need To Know', artist: 'Doja Cat', confidence: 0.91 },
  { id: '16', title: 'Kiss Me More', artist: 'Doja Cat', confidence: 0.94 },
  { id: '17', title: 'Positions', artist: 'Ariana Grande', confidence: 0.92 },
  { id: '18', title: 'drivers license', artist: 'Olivia Rodrigo', confidence: 0.97 },
  { id: '19', title: 'deja vu', artist: 'Olivia Rodrigo', confidence: 0.90 },
  { id: '20', title: 'traitor', artist: 'Olivia Rodrigo', confidence: 0.88 },
  { id: '21', title: 'Mood', artist: '24kGoldn', confidence: 0.86 },
  { id: '22', title: 'Leave The Door Open', artist: 'Silk Sonic', confidence: 0.93 },
  { id: '23', title: 'Montero (Call Me By Your Name)', artist: 'Lil Nas X', confidence: 0.82 },
  { id: '24', title: 'Rap God', artist: 'Eminem', confidence: 0.95 },
  { id: '25', title: 'Lose Yourself', artist: 'Eminem', confidence: 0.98 },
  { id: '26', title: 'Without Me', artist: 'Eminem', confidence: 0.94 },
  { id: '27', title: 'The Real Slim Shady', artist: 'Eminem', confidence: 0.96 },
  { id: '28', title: 'Stan', artist: 'Eminem', confidence: 0.91 },
  { id: '29', title: 'Mockingbird', artist: 'Eminem', confidence: 0.89 },
  { id: '30', title: 'Not Afraid', artist: 'Eminem', confidence: 0.93 },
  { id: '31', title: 'Love The Way You Lie', artist: 'Eminem', confidence: 0.92 },
  { id: '32', title: 'Till I Collapse', artist: 'Eminem', confidence: 0.90 },
  { id: '33', title: 'Godzilla', artist: 'Eminem', confidence: 0.87 },
  { id: '34', title: 'Venom', artist: 'Eminem', confidence: 0.85 },
  { id: '35', title: 'Greatest', artist: 'Eminem', confidence: 0.88 },
  { id: '36', title: 'Lucky You', artist: 'Eminem', confidence: 0.86 },
  { id: '37', title: 'Fall', artist: 'Eminem', confidence: 0.84 },
  { id: '38', title: 'Normal', artist: 'Eminem', confidence: 0.80 },
  { id: '39', title: 'Not Alike', artist: 'Eminem', confidence: 0.83 },
  { id: '40', title: 'Kamikaze', artist: 'Eminem', confidence: 0.91 },
  { id: '41', title: 'The Ringer', artist: 'Eminem', confidence: 0.89 },
  { id: '42', title: 'Stepping Stone', artist: 'Eminem', confidence: 0.82 },
  { id: '43', title: 'Darkness', artist: 'Eminem', confidence: 0.87 },
  { id: '44', title: 'Unaccomodating', artist: 'Eminem', confidence: 0.75 },
  { id: '45', title: 'You Gon Learn', artist: 'Eminem', confidence: 0.72 },
]

export function matchSongsToSpotify(songs: DetectedSong[]): MatchedSong[] {
  return songs.map((song) => {
    const status =
      song.confidence >= 0.82
        ? ('matched' as const)
        : song.confidence >= 0.65
          ? ('possible' as const)
          : ('failed' as const)

    return {
      ...song,
      status,
      spotifyTitle: song.title,
      spotifyArtist: song.artist,
      spotifyTrackId: status === 'failed' ? undefined : `mock-track-${song.id}`,
    }
  })
}

export const DEMO_SONGS = MOCK_DETECTED_SONGS.slice(0, 5)
