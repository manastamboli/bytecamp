'use client'

// Uses auth + subscription hooks — disable static prerendering
export const dynamic = 'force-dynamic'

import { useSession, signOut } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

import {
  Briefcase,
  Globe,
  Users,
  CreditCard,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  TrendingUp,
  Sparkles,
  XCircle,
  Check,
  ChevronUp,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_STYLES = {
  FREE: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  STARTER: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  PRO: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  ENTERPRISE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
}

const STATUS_STYLES = {
  ACTIVE: { label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 },
  TRIAL: { label: 'Trial', color: 'text-blue-500', bg: 'bg-blue-50', icon: Sparkles },
  PAST_DUE: { label: 'Payment Due', color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertTriangle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
  PAUSED: { label: 'Paused', color: 'text-gray-500', bg: 'bg-gray-50', icon: Lock },
}

const PLAN_LIMIT_ORDER = ['businesses', 'sites', 'pagesPerSite', 'deploymentsPerMonth', 'tokenLimit', 'teamMembers']
const PLAN_LIMIT_LABELS = {
  businesses: 'Workspaces',
  sites: 'Sites / Workspace',
  pagesPerSite: 'Pages / Site',
  deploymentsPerMonth: 'Deployments / Month',
  tokenLimit: 'AI Tokens',
  teamMembers: 'Team Members',
}
const PLAN_LIMIT_FORMAT = {
  businesses: v => v === -1 ? 'Unlimited' : v === 0 ? '—' : String(v),
  sites: v => v === -1 ? 'Unlimited' : String(v),
  pagesPerSite: v => v === -1 ? 'Unlimited' : String(v),
  deploymentsPerMonth: v => v === -1 ? 'Unlimited' : String(v),
  tokenLimit: v => v === -1 ? 'Unlimited' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
  teamMembers: v => v === -1 ? 'Unlimited' : String(v),
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(price, currency) {
  if (price === 0) return 'Free'
  if (currency === 'INR') return `₹${price.toLocaleString('en-IN')}`
  return `$${price}`
}

// ─── Inline Pricing Panel ─────────────────────────────────────────────────────
function InlinePricingPanel({ plans, currentPlan, onClose, onSubscribe, subscribingPlanId }) {
  const panelRef = useRef(null)

  // Smooth scroll into view on open
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const paidPlans = plans.filter(p => p.id !== 'FREE')

  return (
    <div
      ref={panelRef}
      className="mb-10 animate-in slide-in-from-top-4 fade-in duration-500"
    >
      {/* Panel header */}
      <div className="rounded-t-[2rem] bg-gradient-to-br from-[#0b1411] to-[#0f211d] px-8 pt-10 pb-8 relative overflow-hidden">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8bc4b1] mb-2">Choose a Plan</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-3">
              Unlock Your Workspace
            </h2>
            <p className="text-gray-400 text-sm font-medium max-w-lg">
              Subscribe to start creating businesses. Cancel anytime. All plans include analytics, site builder, and custom domains.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="bg-white border border-gray-100 rounded-b-[2rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {paidPlans.map((plan) => {
            const isPro = plan.id === 'PRO'
            const isCurrent = plan.id === currentPlan
            const isLoading = subscribingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[1.5rem] p-6 transition-all duration-300
                  ${isPro
                    ? 'bg-[#0b1411] text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] scale-[1.02]'
                    : 'bg-[#fcfdfc] border border-gray-200 hover:border-[#8bc4b1] hover:shadow-lg'
                  }
                `}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-6 bg-[#d3ff4a] text-[#0b1411] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Name + Price */}
                <div className="mb-5 mt-2">
                  <h3 className={`text-lg font-black mb-1 ${isPro ? 'text-white' : 'text-[#0b1411]'}`}>
                    {plan.displayName}
                  </h3>
                  <p className={`text-xs font-medium min-h-[32px] ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className={`text-3xl font-black ${isPro ? 'text-white' : 'text-[#0b1411]'}`}>
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className={`text-sm ${isPro ? 'text-gray-400' : 'text-gray-400'}`}>/month</span>
                    )}
                  </div>
                </div>

                {/* Key limits */}
                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {PLAN_LIMIT_ORDER.filter(k => plan.limits?.[k] !== undefined).map(k => {
                    const val = plan.limits[k]
                    const fmt = PLAN_LIMIT_FORMAT[k] ? PLAN_LIMIT_FORMAT[k](val) : String(val)
                    const isKey = k === 'businesses' || k === 'sites'
                    return (
                      <li key={k} className={`flex items-center gap-2.5 text-sm ${isPro ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? 'text-[#d3ff4a]' : 'text-[#8bc4b1]'}`} />
                        <span className={isKey ? 'font-black' : 'font-medium'}>
                          <span className={`${isKey ? (isPro ? 'text-white' : 'text-[#0b1411]') : ''} mr-1`}>{fmt}</span>
                          <span className={isPro ? 'text-gray-500' : 'text-gray-400'}>{PLAN_LIMIT_LABELS[k]}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => !isCurrent && !isLoading && onSubscribe(plan.id)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-3.5 rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                    ${isCurrent
                      ? 'bg-gray-100 text-gray-400'
                      : isPro
                        ? 'bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f] hover:scale-105 shadow-[0_0_20px_rgba(211,255,74,0.25)]'
                        : 'bg-[#0b1411] text-white hover:bg-[#132a25]'
                    }
                  `}
                >
                  {isLoading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : isCurrent ? (
                    <><CheckCircle2 className="h-4 w-4" /> Current Plan</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Subscribe</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 font-medium mt-6">
          Secure payments via Razorpay · Cancel anytime · Instant access after payment
        </p>
      </div>
    </div>
  )
}

// ─── Plan gate banner ─────────────────────────────────────────────────────────
function PlanGateBanner({ userSub, onShowPricing, pricingVisible }) {
  const hasSub = userSub?.hasSubscription
  const plan = userSub?.plan ?? 'FREE'
  const status = userSub?.subscription?.status
  const limit = userSub?.businessLimit
  const count = userSub?.businessCount ?? 0
  const planCfg = PLAN_STYLES[plan] ?? PLAN_STYLES.FREE
  const statusCfg = status ? STATUS_STYLES[status] : null
  const StatusIcon = statusCfg?.icon ?? CheckCircle2

  // No subscription at all
  if (!hasSub) {
    return (
      <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-[#0b1411] to-[#132a25] p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)]">
        <div className="flex items-start gap-5">
          <div className="h-13 w-13 rounded-2xl bg-[#d3ff4a] flex items-center justify-center shrink-0 p-3">
            <Lock className="h-6 w-6 text-[#0b1411]" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8bc4b1] mb-1">Subscription Required</p>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              {count > 0 ? "Subscribe to create more workspaces" : "Subscribe to start creating workspaces"}
            </h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md">
              Starter (₹199/mo) · Pro (₹399/mo) · Enterprise (₹699/mo)
            </p>
          </div>
        </div>
        <button
          onClick={onShowPricing}
          className={`shrink-0 flex items-center gap-2 px-7 py-3.5 rounded-full font-black uppercase tracking-widest text-sm transition-all active:scale-95 duration-200
            ${pricingVisible
              ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              : 'bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f] hover:scale-105 shadow-[0_0_30px_rgba(211,255,74,0.3)]'
            }
          `}
        >
          {pricingVisible ? (
            <><ChevronUp className="h-4 w-4" /> Hide Plans</>
          ) : (
            <><Zap className="h-4 w-4" /> View Plans <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    )
  }

  // Limit hit
  if (hasSub && userSub?.blockReason === 'BUSINESS_LIMIT_EXCEEDED') {
    return (
      <div className="mb-6 rounded-[2rem] border border-amber-100 bg-amber-50 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <TrendingUp className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-black text-amber-900 mb-1">Workspace Limit Reached</h3>
            <p className="text-sm text-amber-700 font-medium">
              Your <span className="font-black">{plan}</span> plan allows {limit} workspace{limit === 1 ? '' : 's'}.
              You're using {count}/{limit}.
            </p>
          </div>
        </div>
        <button
          onClick={onShowPricing}
          className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95
            ${pricingVisible
              ? 'bg-amber-200 text-amber-900'
              : 'bg-[#0b1411] text-white hover:bg-[#132a25] hover:scale-105'
            }
          `}
        >
          {pricingVisible ? <><ChevronUp className="h-3.5 w-3.5" /> Hide Plans</> : <><TrendingUp className="h-3.5 w-3.5" /> Upgrade Plan</>}
        </button>
      </div>
    )
  }

  // Past due
  if (status === 'PAST_DUE') {
    return (
      <div className="mb-6 rounded-[2rem] border border-amber-100 bg-amber-50 p-5 flex items-start gap-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-black text-amber-900 mb-0.5">Payment overdue</p>
          <p className="text-xs text-amber-700 font-medium">Update your payment method to avoid service interruption.</p>
        </div>
        <button
          onClick={onShowPricing}
          className="shrink-0 text-xs font-black text-amber-700 border border-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-all"
        >
          Update
        </button>
      </div>
    )
  }

  // Active — minimal chip row
  return (
    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${planCfg.bg}`}>
          <CreditCard className={`h-4 w-4 ${planCfg.text}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${planCfg.bg} ${planCfg.text}`}>
              {plan}
            </span>
            {statusCfg && (
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-600">
            {count} of {limit === -1 ? 'unlimited' : limit} workspace{limit === 1 ? '' : 's'} used
            {userSub?.subscription?.currentPeriodEnd && (
              <span className="text-gray-400 font-medium"> · renews {formatDate(userSub.subscription.currentPeriodEnd)}</span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onShowPricing}
        className="shrink-0 text-xs font-black uppercase tracking-widest text-gray-500 border border-gray-200 px-4 py-2 rounded-full hover:border-[#0b1411] hover:text-[#0b1411] transition-all"
      >
        Manage Plan
      </button>
    </div>
  )
}

// ─── Workspace card ───────────────────────────────────────────────────────────
function WorkspaceCard({ tenant, isOwner, onClick }) {
  const sub = tenant.subscription
  const planStyle = PLAN_STYLES[sub?.planType ?? tenant.plan ?? 'FREE'] ?? PLAN_STYLES.FREE
  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-[2rem] p-6 lg:p-8 cursor-pointer hover:border-[#0b1411]/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-[240px] relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center font-black text-xl group-hover:bg-[#d3ff4a] transition-colors shrink-0 overflow-hidden">
            {tenant.logoUrl
              ? <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
              : tenant.name.substring(0, 2).toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0b1411] transition-colors truncate">{tenant.name}</h3>
            <p className="text-sm text-gray-400 font-medium tracking-tight">/{tenant.slug}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
          <div className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {isOwner ? 'Owner' : tenant.userRole?.toLowerCase()}
          </div>
          {isOwner && sub && (
            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${planStyle.bg} ${planStyle.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${planStyle.dot}`} />
              {sub.planType}
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto pt-5 border-t border-gray-100 flex items-center gap-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
          <Globe className="w-4 h-4 group-hover:text-[#0b1411] transition-colors" />
          <span className="group-hover:text-gray-700 transition-colors">{tenant._count?.sites ?? 0} Sites</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
          <Users className="w-4 h-4 group-hover:text-[#0b1411] transition-colors" />
          <span className="group-hover:text-gray-700 transition-colors">{tenant._count?.tenantUsers ?? 0} Members</span>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

// ─── Main page ────────────────────────────────────────────────────────────────
function DashboardContent() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mounted, setMounted] = useState(false)
  const [ownedTenants, setOwnedTenants] = useState([])
  const [sharedTenants, setSharedTenants] = useState([])
  const [userSub, setUserSub] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [subscribingPlanId, setSubscribingPlanId] = useState(null)
  const [subError, setSubError] = useState(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isPending && !session) router.push('/signin')
  }, [session, isPending, mounted, router])

  useEffect(() => {
    if (session && mounted) {
      Promise.all([fetchTenants(), fetchUserSubscription(), fetchPlans()])
        .finally(() => setLoading(false))
    }
  }, [session, mounted])

  // Auto-open pricing if redirected from payment callback
  useEffect(() => {
    if (searchParams.get('subscriptionActivated') === 'true') {
      fetchUserSubscription()
    }
  }, [searchParams])

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants')
      if (res.ok) {
        const data = await res.json()
        setOwnedTenants(data.tenants.filter(t => t.userRole === 'OWNER'))
        setSharedTenants(data.tenants.filter(t => t.userRole !== 'OWNER'))
      }
    } catch (err) { console.error('fetchTenants:', err) }
  }

  const fetchUserSubscription = async () => {
    try {
      const res = await fetch('/api/user/subscription')
      if (res.ok) setUserSub(await res.json())
    } catch (err) { console.error('fetchUserSubscription:', err) }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/pricing/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans ?? [])
      }
    } catch (err) { console.error('fetchPlans:', err) }
  }

  // ─── Razorpay subscribe handler ────────────────────────────────────────────
  const handleSubscribe = async (planId) => {
    setSubError(null)
    setSubscribingPlanId(planId)

    try {
      // We need a tenantId to attach the subscription to.
      // If user already owns a tenant, use it. Otherwise we can't subscribe without one.
      // User must own at least 1 tenant for context, OR we use a special "account-level" flow.
      // Here: if they have no tenant yet, we pass null and the API will handle it gracefully,
      // OR we redirect to /tenants/new after payment.
      const existingTenantId = ownedTenants[0]?.id ?? null

      if (!existingTenantId) {
        setSubError('Please create a workspace first before subscribing.');
        setSubscribingPlanId(null);
        return
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: existingTenantId,
          planType: planId,
          billingCycle: 'monthly',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setSubError(data.error ?? 'Failed to initiate subscription')
        return
      }

      const { checkoutOptions } = data
      if (!checkoutOptions) {
        setSubError('Checkout configuration missing')
        return
      }

      // Load Razorpay checkout
      const openCheckout = (options) => {
        const rzp = new window.Razorpay({
          ...options,
          handler: async (response) => {
            // Payment succeeded — refetch subscription state
            await fetchUserSubscription()
            await fetchTenants()
            setShowPricing(false)
          },
          modal: {
            ondismiss: () => setSubscribingPlanId(null),
          },
        })
        rzp.on('payment.failed', (resp) => {
          setSubError(`Payment failed: ${resp.error?.description ?? 'Unknown error'}`)
          setSubscribingPlanId(null)
        })
        rzp.open()
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        openCheckout(checkoutOptions)
      } else {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => openCheckout(checkoutOptions)
        script.onerror = () => setSubError('Failed to load payment gateway. Please try again.')
        document.head.appendChild(script)
      }
    } catch (err) {
      console.error('handleSubscribe:', err)
      setSubError('Something went wrong. Please try again.')
    } finally {
      setSubscribingPlanId(null)
    }
  }

  const handleNewWorkspace = () => {
    if (!userSub?.canCreateBusiness) {
      setShowPricing(true)
      return
    }
    router.push('/tenants/new')
  }

  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    )
  }
  if (!session) return null

  // Allow creating the first workspace for free, require subscription for more
  const hasAnyWorkspace = (ownedTenants.length + sharedTenants.length) > 0;
  const canCreate = !hasAnyWorkspace || (userSub?.canCreateBusiness ?? false);
  const needsPlan = hasAnyWorkspace && (!userSub?.hasSubscription || (userSub?.blockReason && !canCreate));

  const userInitials = session.user.name
    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : session.user.email.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans flex text-gray-900">

      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-[#0b1411] to-[#0c1a16] border-r border-white/5 min-h-screen hidden lg:flex flex-col sticky top-0">
        <div className="h-24 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 w-6">
              <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
              <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
              <span className="w-4 h-[3px] bg-white rounded-full" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight text-white">SitePilot</span>
          </div>
        </div>

        <div className="px-6 py-8 flex-1">
          {/* Plan chip */}
          {userSub && (
            <button
              onClick={() => setShowPricing(v => !v)}
              className={`w-full mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left
                ${userSub.hasSubscription
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-[#d3ff4a]/10 border border-[#d3ff4a]/30 hover:bg-[#d3ff4a]/20'
                }`}
            >
              <CreditCard className={`h-4 w-4 shrink-0 ${userSub.hasSubscription ? 'text-gray-400' : 'text-[#d3ff4a]'}`} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-0.5">Plan</p>
                <p className={`text-sm font-black truncate ${userSub.hasSubscription ? 'text-white' : 'text-[#d3ff4a]'}`}>
                  {userSub.hasSubscription ? userSub.planConfig?.displayName : 'Subscribe →'}
                </p>
              </div>
            </button>
          )}

          <div className="space-y-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center py-4 px-5 text-sm font-bold rounded-2xl bg-[#d3ff4a] text-[#0b1411]"
            >
              <Briefcase className="h-5 w-5 mr-4 text-[#0b1411]" />
              Workspaces
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full flex items-center py-4 px-5 text-sm font-bold rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <CreditCard className="h-5 w-5 mr-4 text-gray-500" />
              Billing
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center p-3 rounded-2xl hover:bg-white/5 transition-colors outline-none border border-transparent hover:border-white/10 group">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-black border border-white/5 mr-4 shrink-0 group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] transition-colors">
                  {userInitials}
                </div>
                <div className="flex flex-col items-start flex-1 overflow-hidden min-w-0">
                  <span className="text-sm font-bold leading-none truncate w-full text-white">
                    {session.user.name || session.user.email.split('@')[0]}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 mt-1.5 truncate w-full">
                    {session.user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 font-sans bg-white border border-gray-100 shadow-xl z-50">
              <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 py-1.5">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100 my-2" />
              <DropdownMenuItem onClick={() => setShowPricing(v => !v)} className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-[#f2f4f2] hover:text-[#0b1411]">
                Billing & Plans
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-2" />
              <DropdownMenuItem
                className="py-2.5 px-3 rounded-xl text-sm font-bold cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={async () => { await signOut(); router.push('/signin') }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-5 border-b border-gray-100 bg-white/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="w-4 h-[3px] bg-[#d3ff4a] rounded-full" />
            <span className="w-5 h-[3px] bg-[#00e5ff] rounded-full" />
            <span className="w-3 h-[3px] bg-[#0b1411] rounded-full" />
          </div>
          <span className="ml-2 text-base font-black uppercase text-[#0b1411]">SitePilot</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#0b1411]">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="max-w-7xl mx-auto py-12 lg:py-20 px-5 sm:px-8 lg:px-12 pt-20 lg:pt-16">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
            <div>
              <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">Dashboard</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1]">
                Workspaces
              </h1>
            </div>
            <button
              onClick={handleNewWorkspace}
              disabled={loading || (!canCreate)}
              title={
                loading ? 'Loading...' :
                  canCreate ? '' :
                    (hasAnyWorkspace
                      ? (userSub?.hasSubscription ? 'Upgrade to add more workspaces' : 'Subscribe to create a workspace')
                      : '')
              }
              className={`w-full sm:w-auto h-14 px-8 rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-95 duration-200
                ${canCreate
                  ? 'bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f] hover:scale-105 shadow-[0_0_20px_rgba(211,255,74,0.3)]'
                  : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700'
                }
              `}
            >
              {canCreate
                ? <><Plus className="h-5 w-5" /> New Workspace</>
                : <><Lock className="h-4 w-4" /> {hasAnyWorkspace ? (userSub?.hasSubscription ? 'Upgrade to Add More' : 'Subscribe to Create') : 'New Workspace'}</>
              }
            </button>
          </div>

          {/* Email verification */}
          {!session.user.emailVerified && (
            <div className="mb-7 p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-start gap-3 text-amber-900">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Verify Your Email</h4>
                <p className="text-sm font-medium text-amber-800/80">Check your inbox for a verification link.</p>
              </div>
            </div>
          )}

          {/* ── Plan gate banner ── */}
          {!loading && (
            <PlanGateBanner
              userSub={userSub}
              onShowPricing={() => setShowPricing(v => !v)}
              pricingVisible={showPricing}
            />
          )}

          {/* ── Inline pricing panel (slides in) ── */}
          {showPricing && plans.length > 0 && (
            <InlinePricingPanel
              plans={plans}
              currentPlan={userSub?.plan ?? 'FREE'}
              onClose={() => setShowPricing(false)}
              onSubscribe={handleSubscribe}
              subscribingPlanId={subscribingPlanId}
            />
          )}

          {/* Subscription error */}
          {subError && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-medium">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{subError}</span>
              <button onClick={() => setSubError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Workspace list ── */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center border-2 border-gray-100 rounded-[2.5rem] bg-white border-dashed">
              <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-6" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
            </div>
          ) : ownedTenants.length === 0 && sharedTenants.length === 0 ? (
            <div className="py-28 text-center border-2 border-gray-100 rounded-[2.5rem] bg-white border-dashed px-6 flex flex-col items-center">
              <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8">
                <Briefcase className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-[#0b1411] tracking-tight mb-3">No Workspaces Yet</h3>
              <p className="text-base text-gray-400 font-medium mb-10 max-w-sm leading-relaxed">
                {canCreate
                  ? 'Create your first workspace to start building sites.'
                  : 'Subscribe to a plan to start creating workspaces.'}
              </p>
              <button
                onClick={handleNewWorkspace}
                className={`h-14 px-8 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95
                  ${canCreate ? 'bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f]' : 'bg-[#0b1411] text-[#d3ff4a]'}
                `}
              >
                {canCreate
                  ? <><Plus className="h-5 w-5" /> Create Workspace</>
                  : <><Zap className="h-5 w-5" /> View Plans <ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </div>
          ) : (
            <Tabs defaultValue="owned" className="w-full">
              <TabsList className="mb-8 flex flex-wrap gap-2 bg-transparent border-none p-0">
                <TabsTrigger
                  value="owned"
                  className="rounded-full px-7 py-3 text-sm font-bold bg-[#f2f4f2] text-gray-500 data-[state=active]:bg-[#1d2321] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all outline-none border-none group"
                >
                  My Workspaces <span className="ml-2 bg-gray-200 text-gray-600 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white rounded-full px-2 py-0.5 text-xs">{ownedTenants.length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shared"
                  className="rounded-full px-7 py-3 text-sm font-bold bg-[#f2f4f2] text-gray-500 data-[state=active]:bg-[#1d2321] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all outline-none border-none group"
                >
                  Shared With Me <span className="ml-2 bg-gray-200 text-gray-600 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white rounded-full px-2 py-0.5 text-xs">{sharedTenants.length}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="owned" className="mt-0 outline-none">
                {ownedTenants.length === 0 ? (
                  <div className="py-24 text-center border border-gray-200 rounded-[2rem] bg-[#fcfdfc] border-dashed">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No owned workspaces yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedTenants.map(tenant => (
                      <WorkspaceCard
                        key={tenant.id}
                        tenant={tenant}
                        isOwner={true}
                        onClick={() => router.push(`/${tenant.id}`)}
                      />
                    ))}

                    {/* Upgrade-to-add card when limit hit */}
                    {!canCreate && userSub?.hasSubscription && (
                      <div
                        onClick={() => setShowPricing(true)}
                        className="border-2 border-dashed border-gray-200 rounded-[2rem] p-8 h-[240px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                      >
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <TrendingUp className="h-6 w-6 text-gray-300 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <p className="text-sm font-black text-gray-400 group-hover:text-amber-600 transition-colors text-center">Upgrade to add more workspaces</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shared" className="mt-0 outline-none">
                {sharedTenants.length === 0 ? (
                  <div className="py-24 text-center border border-gray-200 rounded-[2rem] bg-[#fcfdfc] border-dashed">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No shared workspaces</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sharedTenants.map(tenant => (
                      <WorkspaceCard
                        key={tenant.id}
                        tenant={tenant}
                        isOwner={false}
                        onClick={() => router.push(`/${tenant.id}`)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
