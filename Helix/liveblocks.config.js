/**
 * Liveblocks Configuration
 *
 * Defines shared types for Presence, Storage, UserMeta, and RoomEvent
 * used across the collaborative builder.
 */

/**
 * @typedef {Object} Presence
 * @property {{ x: number, y: number } | null} cursor - Current cursor position
 * @property {string | null} lockedBlockId - The block this user is currently editing
 * @property {string | null} selectedBlockId - The block this user has selected
 * @property {string} username - Display name
 * @property {string} color - Unique cursor/avatar color
 */

/**
 * @typedef {Object} Storage
 * @property {import('./lib/types/liveblocks').BuilderState} builderState - Full builder state
 */

/**
 * @typedef {Object} UserMeta
 * @property {string} id - User ID
 * @property {{ name: string, color: string, avatar: string | null }} info
 */

/**
 * @typedef {Object} RoomEvent
 * @property {'BLOCK_LOCKED' | 'BLOCK_UNLOCKED' | 'SAVE_TRIGGERED'} type
 * @property {string} [blockId]
 * @property {string} [userId]
 */

// Cursor colors assigned round-robin to users
export const CURSOR_COLORS = [
  '#E57373', '#81C784', '#64B5F6', '#FFD54F',
  '#BA68C8', '#4DB6AC', '#FF8A65', '#A1887F',
  '#90A4AE', '#F06292', '#AED581', '#4FC3F7',
]

/**
 * Get a deterministic color for a user based on their connection index.
 * @param {number} connectionId
 * @returns {string}
 */
export function getCursorColor(connectionId) {
  return CURSOR_COLORS[connectionId % CURSOR_COLORS.length]
}
