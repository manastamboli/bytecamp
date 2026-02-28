'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  ArrowLeft,
  Users,
  Globe,
  CreditCard,
  ShieldAlert,
  Settings
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import BillingWidget from '@/components/BillingWidget'

export default function TenantDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()
  const [tenant, setTenant] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [fetchedTenantId, setFetchedTenantId] = useState(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  // Track when initial session load is complete
  useEffect(() => {
    if (session && !isPending) {
      setInitialLoadComplete(true)
    }
  }, [session, isPending])

  useEffect(() => {
    if (session && params.tenantId && fetchedTenantId !== params.tenantId) {
      fetchTenantData()
    }
  }, [session, params.tenantId, fetchedTenantId])

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setTenant(data.tenant)
        setUserRole(data.userRole)
        setFetchedTenantId(params.tenantId)
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
    } finally {
      setLoading(false)
    }
  }

  // Only show loading spinner on initial load, not on tab refocus
  if (!initialLoadComplete || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center max-w-sm px-6">
          <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] inline-flex mb-8 shadow-sm">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">Workspace Not Found</h2>
          <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">This workspace doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 px-6 bg-[#0b1411] text-[#d3ff4a] rounded-full hover:bg-[#1d2321] transition-all font-black uppercase tracking-widest text-xs inline-flex justify-center items-center shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 text-base pb-20 relative">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex flex-row items-center gap-4">
                <div className="h-14 w-14 bg-[#0b1411] text-[#d3ff4a] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg font-black text-xl">
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                  ) : tenant.logo ? (
                    <img src={tenant.logo} alt={tenant.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{tenant.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                    WORKSPACE OVERVIEW
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1d2321] uppercase tracking-tighter leading-tight">
                    {tenant.name}
                  </h1>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 block">sitepilot.com/{tenant.slug}</span>
                </div>
              </div>
              {userRole === 'OWNER' && (
                <button
                  onClick={() => router.push(`/${params.tenantId}/settings`)}
                  className="inline-flex items-center justify-center px-6 h-12 text-xs font-black uppercase tracking-widest text-gray-600 bg-white border-2 border-gray-200 rounded-full hover:border-[#0b1411] hover:text-[#0b1411] transition-all shadow-sm hover:shadow-md focus:outline-none"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-16">

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="group bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 lg:p-8 flex flex-col hover:border-[#8bc4b1] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d3ff4a]/0 to-[#8bc4b1]/0 group-hover:from-[#d3ff4a]/5 group-hover:to-[#8bc4b1]/5 rounded-bl-[100px] transition-all duration-500 pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-[#0b1411] text-[#d3ff4a] rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] transition-colors">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#1d2321] tracking-tight group-hover:text-[#8bc4b1] transition-colors">Sites</h3>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-8 flex-1 relative z-10 leading-relaxed max-w-[90%]">
                {hasPermission(userRole, 'sites:create') ? 'Create, launch, and manage your websites.' : 'View your websites.'}
              </p>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="w-full relative z-10 py-3.5 px-6 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all focus:outline-none"
              >
                {hasPermission(userRole, 'sites:create') ? 'Manage Sites' : 'View Sites'}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Overview Stats */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Overview Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Billing Widget — replaces static plan display */}
            <BillingWidget tenantId={params.tenantId} />

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#00e5ff] transition-all">
              <div className="flex items-center gap-4 mb-8 text-gray-500">
                <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Team Members</span>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter text-[#1d2321]">{tenant._count?.tenantUsers || 0}</h3>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#d3ff4a] transition-all">
              <div className="flex items-center gap-4 mb-8 text-gray-500">
                <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Active Sites</span>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter text-[#1d2321]">{tenant._count?.sites || 0}</h3>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
