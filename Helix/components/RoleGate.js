'use client'

import { hasPermission } from '@/lib/permissions'

/**
 * Conditionally renders children based on the user's role and required permission.
 *
 * Usage:
 *   <RoleGate role={userRole} permission="sites:create">
 *     <button>Create Site</button>
 *   </RoleGate>
 *
 * @param {string} role - The current user's role
 * @param {string} permission - The permission key to check
 * @param {React.ReactNode} children - Content to render if permitted
 * @param {React.ReactNode} [fallback] - Optional content if not permitted
 */
export default function RoleGate({ role, permission, children, fallback = null }) {
  if (!role || !hasPermission(role, permission)) {
    return fallback
  }
  return children
}
