'use client'
import { useSession } from '@/lib/auth-client'

export default function TestPage() {
  const { data: session, isPending } = useSession()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <strong>Status:</strong> {isPending ? 'Loading...' : session ? 'Authenticated ✅' : 'Not authenticated ❌'}
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Session Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify({ session, isPending }, null, 2)}
        </pre>
      </div>
      
      {!session && !isPending && (
        <div className="mt-4 space-x-4">
          <a href="/signup" className="text-blue-500 underline">
            Sign Up
          </a>
          <a href="/signin" className="text-blue-500 underline">
            Sign In
          </a>
        </div>
      )}
    </div>
  )
}
