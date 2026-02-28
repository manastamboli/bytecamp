/**
 * Liveblocks Room Utilities
 *
 * Server-side helpers for generating and parsing room IDs.
 * Room IDs must NEVER be generated on the client.
 */

/**
 * Generate a Liveblocks room ID for a page in a site.
 *
 * Format: tenant:{tenantId}:site:{siteId}:page:{pageId}
 *
 * @param {string} tenantId
 * @param {string} siteId
 * @param {string} pageId
 * @returns {string}
 */
export function generateRoomId(tenantId, siteId, pageId) {
  if (!tenantId || !siteId || !pageId) {
    throw new Error('tenantId, siteId, and pageId are all required')
  }
  return `tenant:${tenantId}:site:${siteId}:page:${pageId}`
}

/**
 * Parse a room ID into its components.
 *
 * @param {string} roomId
 * @returns {{ tenantId: string, siteId: string, pageId: string } | null}
 */
export function parseRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') return null

  const parts = roomId.split(':')
  if (
    parts.length !== 6 ||
    parts[0] !== 'tenant' ||
    parts[2] !== 'site' ||
    parts[4] !== 'page'
  ) {
    return null
  }

  return {
    tenantId: parts[1],
    siteId: parts[3],
    pageId: parts[5],
  }
}

/**
 * Validate a room ID format.
 *
 * @param {string} roomId
 * @returns {boolean}
 */
export function isValidRoomId(roomId) {
  return parseRoomId(roomId) !== null
}
