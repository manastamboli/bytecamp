'use client'

import { useEffect, useRef } from 'react'
import { useBroadcastEvent, useEventListener } from '@/lib/liveblocks-client'
import useBuilderStore from '@/lib/stores/builderStore'

/**
 * useBuilderSync
 *
 * Syncs Zustand builder state between all connected users via Liveblocks
 * broadcast events (WebSocket).
 *
 * – When the local user makes any change to layoutJSON, the updated state
 *   is broadcast to all other connected users in the room.
 * – When a broadcast arrives from another user, the local Zustand store is
 *   updated (preserving local selection / hover state).
 * – A ref flag prevents infinite broadcast loops (remote update → subscribe
 *   fires → skip re-broadcast).
 *
 * Must be used inside a Liveblocks RoomProvider.
 */
export default function useBuilderSync() {
  const broadcast = useBroadcastEvent()

  // Stable ref so the subscribe callback always has the latest broadcast fn
  const broadcastRef = useRef(broadcast)
  broadcastRef.current = broadcast

  // Flag: true while we're applying a remote update to Zustand
  const isRemoteUpdate = useRef(false)

  // Debounce timer for batching rapid local changes
  const debounceRef = useRef(null)

  // ── Subscribe to Zustand store and broadcast local changes ──────────────
  useEffect(() => {
    let prevLayoutJSON = useBuilderStore.getState().layoutJSON

    const unsubscribe = useBuilderStore.subscribe((state) => {
      // Skip if this change originated from a remote broadcast
      if (isRemoteUpdate.current) {
        prevLayoutJSON = state.layoutJSON
        return
      }

      // Skip if layoutJSON reference hasn't changed
      if (state.layoutJSON === prevLayoutJSON) return
      prevLayoutJSON = state.layoutJSON

      if (!state.layoutJSON) return

      // Debounce slightly (50 ms) to batch rapid edits (typing, dragging)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        broadcastRef.current({
          type: 'LAYOUT_SYNC',
          layoutJSON: state.layoutJSON,
        })
      }, 50)
    })

    return () => {
      unsubscribe()
      clearTimeout(debounceRef.current)
    }
  }, []) // no deps — broadcastRef.current keeps it up to date

  // ── Listen for layout sync events from other users ──────────────────────
  useEventListener(({ event }) => {
    if (event.type === 'LAYOUT_SYNC' && event.layoutJSON) {
      // Flag as remote so our subscribe callback won't re-broadcast
      isRemoteUpdate.current = true

      // Update ONLY layoutJSON — preserve local selection & hover state
      useBuilderStore.setState({ layoutJSON: event.layoutJSON })

      // Clear the flag (setState + subscribe callback are synchronous,
      // so by this point the subscriber has already run and skipped)
      isRemoteUpdate.current = false
    }
  })
}
