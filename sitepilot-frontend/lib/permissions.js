/**
 * Role-based permissions for tenant members.
 *
 * OWNER  – full access (manage members, invitations, create/edit/delete sites & forms, settings)
 * EDITOR – can create, view, edit, delete sites and forms
 * VIEWER – can only view sites and forms (read-only)
 */

export const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
}

// Permission definitions: which roles can perform each action
const PERMISSIONS = {
  // Member management
  'members:invite':  [ROLES.OWNER],
  'members:remove':  [ROLES.OWNER],
  'members:view':    [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],

  // Sites
  'sites:create':    [ROLES.OWNER, ROLES.EDITOR],
  'sites:edit':      [ROLES.OWNER, ROLES.EDITOR],
  'sites:delete':    [ROLES.OWNER, ROLES.EDITOR],
  'sites:view':      [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],

  // Forms
  'forms:create':    [ROLES.OWNER, ROLES.EDITOR],
  'forms:edit':      [ROLES.OWNER, ROLES.EDITOR],
  'forms:delete':    [ROLES.OWNER, ROLES.EDITOR],
  'forms:view':      [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],

  // Workspace settings
  'workspace:settings': [ROLES.OWNER],
}

/**
 * Check if a role has a specific permission.
 * @param {string} role - The user's role (OWNER, EDITOR, VIEWER)
 * @param {string} permission - The permission to check (e.g. 'sites:create')
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

/**
 * Check if a role is at least a certain level.
 * OWNER > EDITOR > VIEWER
 */
export function isAtLeast(role, minimumRole) {
  const hierarchy = [ROLES.VIEWER, ROLES.EDITOR, ROLES.OWNER]
  return hierarchy.indexOf(role) >= hierarchy.indexOf(minimumRole)
}

/** Role display labels */
export const ROLE_LABELS = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
}

/** Role badge colors for UI */
export const ROLE_COLORS = {
  OWNER: 'bg-purple-100 text-purple-800',
  EDITOR: 'bg-blue-100 text-blue-800',
  VIEWER: 'bg-gray-100 text-gray-700',
}
