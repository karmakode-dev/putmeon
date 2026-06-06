import { useLayoutEffect } from 'react'
import { useApp } from '../context/AppContext'
import { purgeLegacyStorage } from '../utils/flowStorage'

/** Clears only the curate context draft (storage is owned by CuratePage). */
export function useClearCurateDraft() {
  const { clearCurateDraft } = useApp()
  useLayoutEffect(() => {
    purgeLegacyStorage()
    clearCurateDraft()
  }, [clearCurateDraft])
}

/** Clears scan/upload state when starting a new screenshot upload flow. */
export function useClearScanSession() {
  const { clearScanSession } = useApp()
  useLayoutEffect(() => {
    clearScanSession()
  }, [clearScanSession])
}
