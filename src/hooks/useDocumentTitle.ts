import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — PutMeOn` : 'PutMeOn — Screenshot to Spotify Playlist'
    return () => {
      document.title = previous
    }
  }, [title])
}
