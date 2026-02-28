/**
 * CursorLayer – renders all remote users' cursors on the canvas.
 *
 * Uses absolute positioning relative to the canvas container.
 * Each cursor is a colored arrow + username label with smooth CSS transitions.
 * Cursors automatically disappear when users disconnect.
 */

'use client'

import { memo } from 'react'
import { useOthers } from '@/lib/liveblocks-client'

function Cursor({ x, y, color, name }) {
  return (
    <div
      className="pointer-events-none absolute z-[9999] transition-all duration-100 ease-out"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.65 0L23.485 18.01L13.46 18.01L5.65 36L5.65 0Z"
          fill={color}
        />
        <path
          d="M5.65 0L23.485 18.01L13.46 18.01L5.65 36L5.65 0Z"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Username label */}
      <div
        className="absolute left-4 top-5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}

const MemoizedCursor = memo(Cursor)

export default function CursorLayer() {
  const others = useOthers()

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor) return null

        return (
          <MemoizedCursor
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
            color={presence.color || info?.color || '#999'}
            name={presence.username || info?.name || 'Anonymous'}
          />
        )
      })}
    </>
  )
}
