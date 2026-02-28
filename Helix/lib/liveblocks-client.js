/**
 * Liveblocks Client Provider
 *
 * Wraps the application (or builder subtree) with the LiveblocksProvider
 * that handles authentication via our custom endpoint.
 */

'use client'

import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

// ── Liveblocks client with custom auth endpoint ──────────────────────────────
const client = createClient({
  authEndpoint: '/api/liveblocks-auth',
})

// ── Create room context with typed Presence, Storage, UserMeta, RoomEvent ────
// JSDoc types defined in liveblocks.config.js and lib/types/liveblocks.js
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext(client)
