/**
 * useBlockLock – helper hook for checking if a block is locked by another user.
 *
 * Returns lock info { isLocked, lockedBy, color } for a given blockId.
 */

'use client'

import { useMemo } from 'react'
import { useOthers, useSelf } from '@/lib/liveblocks-client'

/**
 * @param {string} blockId
 * @returns {{ isLocked: boolean, isLockedBySelf: boolean, lockedBy: string | null, color: string | null }}
 */
export function useBlockLock(blockId) {
  const self = useSelf()
  const others = useOthers()

  return useMemo(() => {
    // Check if self has this block locked
    if (self?.presence?.lockedBlockId === blockId) {
      return {
        isLocked: false, // Not locked FROM our perspective
        isLockedBySelf: true,
        lockedBy: null,
        color: null,
      }
    }

    // Check if any other user has this block locked
    for (const other of others) {
      if (other.presence?.lockedBlockId === blockId) {
        return {
          isLocked: true,
          isLockedBySelf: false,
          lockedBy:
            other.presence?.username || other.info?.name || 'Someone',
          color: other.presence?.color || other.info?.color || '#6366f1',
        }
      }
    }

    return {
      isLocked: false,
      isLockedBySelf: false,
      lockedBy: null,
      color: null,
    }
  }, [blockId, self, others])
}
