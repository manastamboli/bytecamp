/**
 * useAutosave – debounced persistence of builder layout → Prisma (Page model)
 *
 * Watches the Zustand builderStore for layoutJSON changes that originate from
 * any user (local or synced from another user via useBuilderSync).
 * After a debounce period (default 5 s), PUTs the current page layout to the
 * database via  PUT /api/sites/[siteId]/pages/[pageId].
 *
 * Also fires one final save on unmount (page navigation / tab close).
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useBuilderStore from '@/lib/stores/builderStore'

/**
 * @param {Object}  options
 * @param {string}  options.siteId     - Site ID
 * @param {string}  options.pageId     - Page ID
 * @param {number}  [options.debounceMs=5000] - Debounce interval in ms
 */
export function useAutosave({ siteId, pageId, debounceMs = 5000 }) {
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)

  // ── Save the current page layout to the database ────────────────────────
  const saveToDatabase = useCallback(
    async (layout) => {
      if (!siteId || !pageId || !layout) return

      // Skip if data hasn't changed since last save
      const serialized = JSON.stringify(layout)
      if (serialized === lastSavedRef.current) return

      setSaving(true)
      setError(null)

      try {
        const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
        })

        if (!res.ok) {
          throw new Error(`Save failed: ${res.status}`)
        }

        lastSavedRef.current = serialized
        setLastSaved(new Date())
        console.log('[autosave] Saved successfully')
      } catch (err) {
        console.error('[autosave] Failed to save:', err)
        setError(err.message)
      } finally {
        setSaving(false)
      }
    },
    [siteId, pageId],
  )

  // ── Subscribe to Zustand store and debounce saves ───────────────────────
  useEffect(() => {
    if (!siteId || !pageId) return

    const unsubscribe = useBuilderStore.subscribe((state, prevState) => {
      // Only react when layoutJSON reference actually changes
      if (state.layoutJSON === prevState.layoutJSON) return

      // Extract the current page's layout array
      const page = state.layoutJSON?.pages?.find((p) => p.id === state.currentPageId)
      if (!page) return

      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        saveToDatabase(page.layout)
      }, debounceMs)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [siteId, pageId, debounceMs, saveToDatabase])

  // ── Flush on unmount (page navigation) ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)

      // Final save with the latest data
      const state = useBuilderStore.getState()
      const page = state.layoutJSON?.pages?.find((p) => p.id === state.currentPageId)
      if (page) {
        saveToDatabase(page.layout)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { saving, lastSaved, error }
}
