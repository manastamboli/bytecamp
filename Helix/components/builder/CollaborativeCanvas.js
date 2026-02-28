/**
 * CollaborativeCanvas – the root component for real-time collaborative editing.
 *
 * Wraps children in a Liveblocks RoomProvider.
 * Cursors are tracked only inside CanvasArea (not toolbar/sidebars).
 * Block locking is handled at the CanvasRenderer level.
 */

'use client'

import { useEffect, useMemo, memo } from 'react'
import {
  RoomProvider,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useStatus,
} from '@/lib/liveblocks-client'
import AvatarStack from './AvatarStack'
import useBuilderSync from '@/lib/hooks/useBuilderSync'
import { Loader2, Wifi, WifiOff } from 'lucide-react'

// ─── Inner wrapper (must be inside RoomProvider) ─────────────────────────────

function RoomInner({ children }) {
  const updatePresence = useUpdateMyPresence()
  const status = useStatus()

  // ── Real-time builder state sync via broadcast events ───────────────────
  useBuilderSync()

  // ── Clear presence on unmount / disconnect ──────────────────────────────
  useEffect(() => {
    return () => {
      updatePresence({
        cursor: null,
        selectedBlockId: null,
        lockedBlockId: null,
      })
    }
  }, [updatePresence])

  return (
    <div className="relative h-full w-full">
      {/* Builder content (Toolbar, Sidebars, CanvasArea) */}
      {children}
    </div>
  )
}

const MemoizedRoomInner = memo(RoomInner)

// ─── Outer wrapper with RoomProvider ─────────────────────────────────────────

export default function CollaborativeCanvas({
  tenantId,
  siteId,
  pageId,
  userName = 'Anonymous',
  userColor = '#6366f1',
  children,
}) {
  const roomId = `tenant:${tenantId}:site:${siteId}:page:${pageId}`

  const initialPresence = useMemo(
    () => ({
      cursor: null,
      lockedBlockId: null,
      selectedBlockId: null,
      username: userName,
      color: userColor,
    }),
    [userName, userColor]
  )

  return (
    <RoomProvider
      id={roomId}
      initialPresence={initialPresence}
    >
      <MemoizedRoomInner>
        {children}
      </MemoizedRoomInner>
    </RoomProvider>
  )
}
