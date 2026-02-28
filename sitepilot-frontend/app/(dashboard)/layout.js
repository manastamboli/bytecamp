import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

// All dashboard routes use auth hooks — disable static prerendering for the entire group
export const dynamic = 'force-dynamic'

/**
 * Dashboard Layout
 * 
 * This layout wraps all dashboard routes and provides:
 * - Server-side authentication check
 * - Automatic redirect to signin for unauthenticated users
 * - Session validation before rendering any dashboard page
 */

export default async function DashboardLayout({ children }) {
  // Get session from server-side
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Redirect to signin if not authenticated
  if (!session) {
    redirect('/signin')
  }

  // Render dashboard content for authenticated users
  return <>{children}</>
}
