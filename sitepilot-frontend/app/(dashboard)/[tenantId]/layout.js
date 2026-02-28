'use client'

// Client layout using auth hooks — must be dynamically rendered
export const dynamic = 'force-dynamic'

import { useSession, signOut } from '@/lib/auth-client'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
    LayoutDashboard,
    Globe,
    LayoutTemplate,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Image as ImageIcon,
    Palette
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import SubscriptionBanner from "@/components/SubscriptionBanner"

export default function TenantLayout({ children }) {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const tenantId = params.tenantId
    const sitesId = params.siteId || '';

    const [mounted, setMounted] = useState(false)
    const [initialLoadComplete, setInitialLoadComplete] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [tenant, setTenant] = useState(null)
    const [fetchedTenantId, setFetchedTenantId] = useState(null)
    const [subscription, setSubscription] = useState(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Track when initial session load is complete
    useEffect(() => {
        if (session && !isPending && mounted) {
            setInitialLoadComplete(true)
        }
    }, [session, isPending, mounted])

    useEffect(() => {
        if (session && tenantId && fetchedTenantId !== tenantId) {
            fetchTenantData()
        }
    }, [session, tenantId, fetchedTenantId])

    // Re-fetch tenant data on route changes so the onboarding guard
    // picks up onboardingComplete after the settings page saves it
    useEffect(() => {
        if (session && tenantId && fetchedTenantId === tenantId) {
            fetchTenantData()
        }
    }, [pathname])

    const fetchTenantData = async () => {
        try {
            const response = await fetch(`/api/tenants/${tenantId}`)
            if (response.ok) {
                const data = await response.json()
                setTenant(data.tenant)
                setFetchedTenantId(tenantId)
            }
        } catch (err) {
            console.error('Error fetching tenant:', err)
        }

        // Load subscription status for banner
        try {
            const resp = await fetch(`/api/subscriptions/usage?tenantId=${tenantId}`)
            if (resp.ok) {
                const data = await resp.json()
                setSubscription(data.usage)
            }
        } catch { /* non-fatal */ }
    }

    // Only show loading spinner on initial load, not on tab refocus
    if (!initialLoadComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
                <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
            </div>
        )
    }

    if (!session) {
        return null
    }

    // ── Onboarding guard ─────────────────────────────────────────────────
    // If tenant hasn't completed onboarding, redirect to settings page
    // (except if we're already on /settings or in the /builder)
    const isSettingsPage = pathname === `/${tenantId}/settings`
    const isBuilderPage = pathname.includes('/builder')

    if (tenant && !tenant.onboardingComplete && !isSettingsPage && !isBuilderPage) {
        router.replace(`/${tenantId}/settings`)
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
                <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
            </div>
        )
    }

    const SIDEBAR_ITEMS = [
        { label: 'Overview', icon: LayoutDashboard, href: `/${tenantId}` },
        { label: 'Sites', icon: Globe, href: `/${tenantId}/sites` },
        ...(sitesId ? [{ label: 'Forms', icon: LayoutTemplate, href: `/${tenantId}/sites/${sitesId}/forms` }] : []),
        { label: 'Branding', icon: Palette, href: `/${tenantId}/branding` },
        { label: 'Media', icon: ImageIcon, href: `/${tenantId}/media` },
        { label: 'Members', icon: Users, href: `/${tenantId}/members` },
        { label: 'Settings', icon: Settings, href: `/${tenantId}/settings` },
    ]

    const userInitials = session.user.name
        ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : session.user.email.substring(0, 2).toUpperCase()

    if (pathname.includes('/builder')) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#fcfdfc] font-sans flex text-gray-900">

            {/* Sidebar Navigation */}
            <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-[#0b1411] to-[#0c1a16] border-r border-white/5 h-screen hidden lg:flex flex-col sticky top-0 overflow-y-auto">
                <div className="h-24 flex items-center px-8 border-b border-white/10 shrink-0 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => router.push('/dashboard')}>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 w-6">
                            <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
                            <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
                            <span className="w-4 h-[3px] bg-white rounded-full" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">{tenant ? tenant.name : 'SitePilot'}</span>
                    </div>
                </div>

                <div className="px-6 py-8 flex-1">
                    <div className="space-y-3">
                        {SIDEBAR_ITEMS.map((item) => {
                            // Exact match for overview, or prefix match for subpages
                            let isActive = item.href === `/${tenantId}`
                                ? pathname === `/${tenantId}`
                                : pathname.startsWith(item.href);

                            if (item.label === 'Sites' && pathname.includes('/forms')) {
                                isActive = false;
                            }

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center py-4 px-5 text-sm font-bold rounded-2xl transition-all group ${isActive
                                        ? 'bg-[#d3ff4a] text-[#0b1411] shadow-[0_0_20px_rgba(211,255,74,0.15)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 mr-4 transition-colors ${isActive ? 'text-[#0b1411]' : 'text-gray-500 group-hover:text-white'}`} />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center p-3 rounded-2xl hover:bg-white/5 transition-colors outline-none shrink-0 border border-transparent hover:border-white/10 group">
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
                            <DropdownMenuItem onClick={() => router.push('/dashboard')} className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-[#f2f4f2] hover:text-[#0b1411]">Return to Dashboard</DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-700 cursor-pointer hover:bg-[#f2f4f2] hover:text-[#0b1411]">Profile Settings</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-2" />
                            <DropdownMenuItem
                                className="py-2.5 px-3 rounded-xl text-sm font-bold cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={async () => {
                                    await signOut()
                                    router.push('/signin')
                                }}
                            >
                                <LogOut className="h-4 w-4 mr-3" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full flex flex-col min-w-0 min-h-screen relative">
                {/* Subscription Warning Banner */}
                {subscription && (
                    <SubscriptionBanner
                        status={subscription.status}
                        isInGracePeriod={subscription.isInGracePeriod}
                        currentPeriodEnd={subscription.currentPeriodEnd}
                        tenantId={tenantId}
                    />
                )}
                {/* Mobile Header */}
                <div className="lg:hidden h-20 flex items-center justify-between px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 shrink-0 w-full">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <div className="flex flex-col gap-0.5 w-5">
                            <span className="w-4 h-[3px] bg-[#d3ff4a] rounded-full" />
                            <span className="w-5 h-[3px] bg-[#00e5ff] rounded-full" />
                            <span className="w-3 h-[3px] bg-[#0b1411] rounded-full" />
                        </div>
                        <span className="ml-2 text-lg font-black uppercase tracking-tight text-[#1d2321] line-clamp-1">{tenant ? tenant.name : 'SitePilot'}</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="text-[#0b1411] p-2 focus:outline-none">
                        <Menu size={24} />
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div className="fixed inset-0 bg-[#0b1411]/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                        <div className="relative w-72 max-w-sm bg-gradient-to-b from-[#0b1411] to-[#0c1a16] h-full shadow-2xl flex flex-col">
                            <div className="h-24 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                                <span className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">{tenant ? tenant.name : 'SitePilot'}</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 p-2 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="px-6 py-8 flex-1 overflow-y-auto">
                                <div className="space-y-3">
                                    {SIDEBAR_ITEMS.map((item) => {
                                        let isActive = item.href === `/${tenantId}`
                                            ? pathname === `/${tenantId}`
                                            : pathname.startsWith(item.href);

                                        if (item.label === 'Sites' && pathname.includes('/forms')) {
                                            isActive = false;
                                        }

                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    router.push(item.href);
                                                }}
                                                className={`w-full flex items-center py-4 px-5 text-sm font-bold rounded-2xl transition-all group ${isActive
                                                    ? 'bg-[#d3ff4a] text-[#0b1411] shadow-[0_0_20px_rgba(211,255,74,0.15)]'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon className={`h-5 w-5 mr-4 transition-colors ${isActive ? 'text-[#0b1411]' : 'text-gray-500 group-hover:text-white'}`} />
                                                {item.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Wrapper */}
                <div className="flex-1 w-full bg-[#fcfdfc] relative z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
