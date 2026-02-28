import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Auth Layout Group
 *
 * Wraps all auth routes (/signin, /signup, /verify-email).
 * If the user is already authenticated, redirect them to the dashboard
 * so they can't access login/signup pages while signed in.
 *
 * Routes in this group:
 * - /signin
 * - /signup
 * - /verify-email
 */

export default async function AuthLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Already signed in → send to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return <div>{children}</div>
}
