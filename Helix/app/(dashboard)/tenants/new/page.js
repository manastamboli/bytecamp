'use client'

// Force dynamic rendering — this page uses auth hooks and cannot be statically prerendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { ArrowLeft, Briefcase, Type, Upload, X, Loader2, ImageIcon, Lock, Zap, ArrowRight } from 'lucide-react'

export default function NewTenantPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [subCheck, setSubCheck] = useState(null)  // null = loading
  const fileInputRef = useRef(null)

  // Ensure we never render hook-dependent UI during SSR
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!session) return
    fetch('/api/user/subscription')
      .then(r => r.json())
      .then(data => setSubCheck(data))
      .catch(() => setSubCheck({ canCreateBusiness: false, blockReason: 'ERROR' }))
  }, [session])

  const generateSlug = (name) => {  
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image must be less than 5MB')
      return
    }

    setError('')
    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }


  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setFormData(prev => ({ ...prev, logo: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const tenantId = crypto.randomUUID()

      // 1. Create the tenant first
      const createResponse = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenantId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          logo: null
        })
      })

      const data = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(data.error || 'Failed to create tenant')
      }

      // 2. Upload logo and update tenant if logo exists
      if (logoFile) {
        setUploadingLogo(true)
        const uploadData = new FormData()
        uploadData.append('file', logoFile)

        const uploadResponse = await fetch('/api/upload/tenant-logo', {
          method: 'POST',
          body: uploadData
        })

        const uploadResult = await uploadResponse.json()

        if (uploadResponse.ok && uploadResult.s3Key) {
          await fetch(`/api/tenants/${tenantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: uploadResult.s3Key })
          })
        }
        setUploadingLogo(false)
      }

      router.push(`/${tenantId}/settings`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setUploadingLogo(false)
    }
  }

  // Show spinner until client has mounted AND auth + subscription are loaded
  if (!mounted || isPending || subCheck === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session) {
    router.push('/signin')
    return null
  }

  // Subscription gate—show before the form
  if (!subCheck.canCreateBusiness) {
    const isLimitHit = subCheck.blockReason === 'BUSINESS_LIMIT_EXCEEDED'
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="h-20 w-20 rounded-[2rem] bg-[#f2f4f2] flex items-center justify-center mx-auto mb-8">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-black text-[#0b1411] tracking-tight mb-3">
            {isLimitHit ? 'Workspace Limit Reached' : 'Subscription Required'}
          </h1>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            {isLimitHit
              ? `Your ${subCheck.plan} plan allows ${subCheck.businessLimit} workspace${subCheck.businessLimit === 1 ? '' : 's'}. Upgrade to create more.`
              : 'You need an active subscription to create workspaces. Choose a plan to get started.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/pricing')}
              className="flex items-center justify-center gap-2 bg-[#d3ff4a] text-[#0b1411] px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(211,255,74,0.3)]"
            >
              <Zap className="h-4 w-4" />
              {isLimitHit ? 'Upgrade Plan' : 'Choose a Plan'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-8 py-4 rounded-full font-bold text-sm hover:border-gray-400 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* Navigation / Back Button */}
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create Workspace
          </h1>
          <p className="mt-2 text-base text-gray-500">
            A workspace is where you manage your team, sites, and billing.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">

            {/* Error Message */}
            {error && (
              <div className="p-6 pb-0">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="p-6 sm:p-8 space-y-8">

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Acme Inc."
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base"
                  />
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 flex items-start pointer-events-none">
                    <Type className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your collaborative workspace"
                    rows={3}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-base resize-y"
                  />
                </div>
              </div>

              {/* Logo Upload Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Workspace Logo <span className="text-gray-400 font-normal">(optional)</span>
                </label>

                {!logoPreview ? (
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center w-full p-8 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-3" />
                            <p className="text-sm text-gray-500">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-600 font-medium">
                              Click to upload logo
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF, WebP or SVG (Max 5MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative border-2 border-gray-300 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {logoFile?.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {logoFile?.size ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                        {uploadingLogo && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Uploading...
                          </p>
                        )}
                        {!uploadingLogo && formData.logo && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Uploaded successfully
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-5 sm:px-8 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingLogo}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[160px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}