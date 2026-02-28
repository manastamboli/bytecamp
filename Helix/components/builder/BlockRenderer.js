/**
 * BlockRenderer – renders a single block inside the collaborative canvas.
 *
 * Handles:
 *  - Selection (sets presence.selectedBlockId & presence.lockedBlockId)
 *  - Lock detection (checks if another user has locked this block)
 *  - Renders the LockOverlay when another user is editing
 *  - Prevents interaction when locked by someone else
 */

'use client'

import { memo, useCallback, useMemo } from 'react'
import {
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useMutation,
  useStorage,
} from '@/lib/liveblocks-client'
import LockOverlay from './LockOverlay'

function BlockRenderer({ blockId, pageIndex, blockIndex, children }) {
  const updatePresence = useUpdateMyPresence()
  const self = useSelf()
  const others = useOthers()

  // Check if this block is locked by another user
  const lockInfo = useMemo(() => {
    for (const other of others) {
      if (other.presence?.lockedBlockId === blockId) {
        return {
          lockedBy: other.presence.username || other.info?.name || 'Someone',
          color: other.presence.color || other.info?.color || '#6366f1',
          connectionId: other.connectionId,
        }
      }
    }
    return null
  }, [others, blockId])

  const isLockedByOther = !!lockInfo
  const isSelectedBySelf = self?.presence?.selectedBlockId === blockId

  // Select & lock this block
  const handleSelect = useCallback(
    (e) => {
      e.stopPropagation()

      if (isLockedByOther) return // Can't select a locked block

      updatePresence({
        selectedBlockId: blockId,
        lockedBlockId: blockId,
      })
    },
    [blockId, isLockedByOther, updatePresence]
  )

  // Update a block's props in Liveblocks storage
  const updateBlockProps = useMutation(
    ({ storage }, newProps) => {
      if (isLockedByOther) return // Prevent mutation if locked

      const pages = storage.get('builderState')?.pages
      if (!pages || !pages[pageIndex]) return

      const block = pages[pageIndex].layout[blockIndex]
      if (block) {
        block.props = { ...block.props, ...newProps }
      }
    },
    [pageIndex, blockIndex, isLockedByOther]
  )

  return (
    <div
      className={`relative group transition-all duration-100 ${
        isSelectedBySelf
          ? 'ring-2 ring-indigo-500 ring-offset-1'
          : 'hover:ring-1 hover:ring-gray-300'
      } ${isLockedByOther ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
    >
      {/* Lock overlay for other users editing this block */}
      {isLockedByOther && (
        <LockOverlay
          lockedBy={lockInfo.lockedBy}
          color={lockInfo.color}
        />
      )}

      {/* Block content */}
      <div className={isLockedByOther ? 'pointer-events-none' : ''}>
        {typeof children === 'function'
          ? children({ updateBlockProps, isLocked: isLockedByOther })
          : children}
      </div>
    </div>
  )
}

export default memo(BlockRenderer)
