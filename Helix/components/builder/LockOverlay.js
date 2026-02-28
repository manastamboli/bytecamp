/**
 * LockOverlay – visual indicator that a block is being edited by another user.
 *
 * Renders a semi-transparent overlay + "Editing by {name}" badge.
 * Blocks pointer events so the locked block cannot be interacted with.
 */

'use client'

import { memo } from 'react'
import { Lock } from 'lucide-react'

function LockOverlay({ lockedBy, color }) {
  if (!lockedBy) return null

  return (
    <div className="absolute inset-0 z-40 pointer-events-auto">
      {/* Translucent overlay */}
      <div
        className="absolute inset-0 rounded-lg opacity-10"
        style={{ backgroundColor: color || '#6366f1' }}
      />

      {/* Border highlight */}
      <div
        className="absolute inset-0 rounded-lg border-2"
        style={{ borderColor: color || '#6366f1' }}
      />

      {/* Badge */}
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow-md"
        style={{ backgroundColor: color || '#6366f1' }}
      >
        <Lock size={10} />
        Editing by {lockedBy}
      </div>
    </div>
  )
}

export default memo(LockOverlay)
