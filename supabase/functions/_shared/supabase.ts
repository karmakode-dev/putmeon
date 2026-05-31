import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

let client: SupabaseClient | null = null

export function getServiceClient(): SupabaseClient {
  if (!client) {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) throw new Error('Supabase service credentials are not configured.')
    client = createClient(url, key)
  }
  return client
}

export async function logScan(
  imagesUploaded: number,
  songsDetected: number,
  songsMatched: number
): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from('scans').insert({
    images_uploaded: imagesUploaded,
    songs_detected: songsDetected,
    songs_matched: songsMatched,
  })
  if (error) console.error('Failed to log scan:', error.message)
}
