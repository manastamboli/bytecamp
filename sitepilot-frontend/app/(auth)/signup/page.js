'use client'
import { signUp } from '@/lib/auth-client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BlurText from '@/components/ui/BlurText'

// Google Icon Component
const IconGoogle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.189 1.186 15.479 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.885 0 11.954-4.823 11.954-12.015 0-.795-.084-1.588-.239-2.356H12.24z" fill="currentColor" />
  </svg>
);

import { Suspense } from 'react'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const prefilledEmail = searchParams.get('email')
  const [formData, setFormData] = useState({
    name: '',
    email: prefilledEmail || '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signUp.email(formData)

      // If there's a redirect URL (invitation), proceed with auto-signin
      if (redirectUrl) {
        // Redirect to the invitation page after signup
        router.push(redirectUrl)
      } else {
        // Regular signup flow
        alert('Account created! Check your email to verify your address.')
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      // Implement Google sign up if needed
      alert('Google sign up coming soon!')
    } catch (err) {
      console.error('Google sign up error:', err)
      setError('Google sign up failed.')
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] font-sans relative overflow-hidden text-white">
      {/* Faint grid overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-2">
            <div className="flex flex-col gap-0.5 w-6">
              <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
              <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
              <span className="w-4 h-[3px] bg-white rounded-full" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">SitePilot</h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-10">
            <BlurText
              text="Create Account"
              delay={50}
              className="text-5xl font-black text-white mb-4 uppercase tracking-tighter"
              animateBy="words"
            />
            <p className="text-gray-400 text-base font-medium">
              Join us and start building amazing websites today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm text-gray-300 mb-2 font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2 font-medium">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                readOnly={!!prefilledEmail}
                className="w-full px-4 py-3 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all pr-10"
                  placeholder="Create a password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-1 bg-[#0b1411]/50 border border-white/20 rounded accent-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20"
              />
              <label className="ml-2 text-sm text-gray-400 font-medium">
                I agree to the{' '}
                <a href="#" className="text-[#d3ff4a] font-bold hover:text-[#c0eb3f] transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-[#d3ff4a] font-bold hover:text-[#c0eb3f] transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !agreeToTerms}
              className="w-full py-3.5 bg-[#d3ff4a] text-[#0a1512] font-bold rounded-full hover:bg-[#c0eb3f] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_20px_rgba(211,255,74,0.15)]"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0f211d] text-gray-500 font-medium rounded-full border border-white/5">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <IconGoogle className="w-5 h-5" />
              Continue with Google
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm font-medium">
              Already have an account?{' '}
              <a href="/signin" className="text-[#d3ff4a] hover:text-[#c0eb3f] transition-colors font-bold">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image with Gradient Overlay and Testimonials */}
      <div className="hidden lg:flex lg:w-[calc(50%-2rem)] relative overflow-hidden rounded-3xl my-4 mr-4 ml-0">
        {/* Background Image */}
        <img
          src="/img1.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Testimonials at Bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-4 z-10">
          {/* Testimonial 1 */}
          <div className="flex-1 bg-[#0b1411]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d3ff4a] to-[#8bc4b1] flex-shrink-0"></div>
              <div>
                <div className="text-white font-bold text-sm">Emily Rodriguez</div>
                <div className="text-gray-400 text-xs font-medium">@emilyrodriguez</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Setting up was incredibly easy! I had my first website live in minutes. Highly recommend!
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="flex-1 bg-[#0b1411]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl hidden md:block">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00e5ff] to-[#047c8a] flex-shrink-0"></div>
              <div>
                <div className="text-white font-bold text-sm">Alex Thompson</div>
                <div className="text-gray-400 text-xs font-medium">@alexthompson</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              The AI features are game-changing. It's like having a designer on demand.
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="flex-1 bg-[#0b1411]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl hidden lg:block">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-400 flex-shrink-0"></div>
              <div>
                <div className="text-white font-bold text-sm">Jessica Lee</div>
                <div className="text-gray-400 text-xs font-medium">@jessicalee</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Perfect for managing multiple client sites. Multi-tenant features are top notch.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-white/10 border-t-white" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
