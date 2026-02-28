'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

import { Suspense } from 'react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        // Use Better Auth's email verification endpoint
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: token })
        })

        if (response.ok) {
          const data = await response.json()
          setStatus('success')
          setMessage('Email verified successfully! Redirecting...')
          setTimeout(() => {
            // Redirect to dashboard if verification is successful
            window.location.href = '/dashboard'
          }, 2000)
        } else {
          const error = await response.json()
          setStatus('error')
          setMessage(error.message || 'Email verification failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage('An error occurred during verification')
        console.error('Verification error:', err)
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 text-5xl">✓</div>
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Email verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 text-5xl">✕</div>
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-4 space-x-4">
              <a
                href="/auth/signin"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Create Account
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
