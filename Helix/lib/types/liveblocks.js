/**
 * Liveblocks types for the collaborative builder.
 *
 * @typedef {Object} BuilderPage
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {Block[]} layout
 *
 * @typedef {Object} Block
 * @property {string} id
 * @property {string} type
 * @property {Record<string, any>} props
 *
 * @typedef {Object} BuilderState
 * @property {BuilderPage[]} pages
 *
 * @typedef {Object} Presence
 * @property {{ x: number, y: number } | null} cursor
 * @property {string | null} lockedBlockId
 * @property {string | null} selectedBlockId
 * @property {string} username
 * @property {string} color
 *
 * @typedef {Object} UserMeta
 * @property {string} id
 * @property {{ name: string, color: string, avatar: string | null }} info
 */

export {}
