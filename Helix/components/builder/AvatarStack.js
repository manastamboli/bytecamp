/**
 * AvatarStack – shows connected collaborators as colored avatar circles.
 *
 * Displays up to 5 users inline; overflow shows "+N" indicator.
 * Includes a "typing" pulse animation if present.
 */

'use client'

import { memo } from 'react'
import { useOthers, useSelf } from '@/lib/liveblocks-client'

function AvatarStack() {
  const self = useSelf()
  const others = useOthers()

  const MAX_VISIBLE = 5
  const visibleOthers = others.slice(0, MAX_VISIBLE)
  const overflow = others.length - MAX_VISIBLE

  return (
    <div className="flex items-center -space-x-2">
      {/* Self */}
      {self && (
        <div
          className="relative z-10 h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white shadow-sm"
          style={{
            backgroundColor:
              self.presence?.color || self.info?.color || '#6366f1',
          }}
          title={`${self.info?.name || 'You'} (You)`}
        >
          {self.info?.avatar ? (
            <img
              src={self.info.avatar}
              alt={self.info.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            (self.info?.name || 'U').charAt(0).toUpperCase()
          )}
        </div>
      )}

      {/* Others */}
      {visibleOthers.map(({ connectionId, presence, info }) => {
        const isEditing = !!presence?.lockedBlockId

        return (
          <div
            key={connectionId}
            className={`relative h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white shadow-sm transition-all ${
              isEditing ? 'ring-2 ring-offset-1 animate-pulse' : ''
            }`}
            style={{
              backgroundColor: presence?.color || info?.color || '#999',
              ringColor: presence?.color || info?.color || '#999',
              zIndex: MAX_VISIBLE - visibleOthers.indexOf(
                visibleOthers.find((o) => o.connectionId === connectionId)
              ),
            }}
            title={`${presence?.username || info?.name || 'Anonymous'}${
              isEditing ? ' (editing)' : ''
            }`}
          >
            {info?.avatar ? (
              <img
                src={info.avatar}
                alt={info?.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              (presence?.username || info?.name || '?')
                .charAt(0)
                .toUpperCase()
            )}
          </div>
        )
      })}

      {/* Overflow */}
      {overflow > 0 && (
        <div className="relative z-0 h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shadow-sm">
          +{overflow}
        </div>
      )}
    </div>
  )
}

export default memo(AvatarStack)
