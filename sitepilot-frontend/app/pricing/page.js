"use client";

// This page uses auth hooks + useSearchParams — cannot be statically prerendered
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import { Inter } from "next/font/google";
import { CheckCircle2, Zap, XCircle, AlertTriangle, ArrowRight, CheckCheck } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const FADE_UP = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.8 } },
};

const STAGGER = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const FEATURE_LABELS = {
    customDomains: "Custom Domains",
    multiPage: "Multi-Page Sites",
    analytics: "Site Analytics",
    prioritySupport: "Priority Support",
    whiteLabel: "White Label",
    apiAccess: "API Access",
    premiumComponents: "Premium Components",
};

const LIMIT_LABELS = {
    businesses: 'Workspaces',
    sites: 'Sites / Workspace',
    pagesPerSite: 'Pages / Site',
    deploymentsPerMonth: 'Deployments / Month',
    tokenLimit: 'AI Tokens',
    analyticsRetentionDays: 'Analytics Retention',
    teamMembers: 'Team Members',
    storageGB: 'Storage',
};

const LIMIT_FORMAT = {
    businesses: (v) => v === -1 ? 'Unlimited' : v === 0 ? 'Requires Plan' : String(v),
    tokenLimit: (v) => v === -1 ? 'Unlimited' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
    storageGB: (v) => v === -1 ? 'Unlimited' : `${v}GB`,
    analyticsRetentionDays: (v) => v === -1 ? '1 Year+' : `${v}d`,
    sites: (v) => v === -1 ? 'Unlimited' : String(v),
    pagesPerSite: (v) => v === -1 ? 'Unlimited' : String(v),
    deploymentsPerMonth: (v) => v === -1 ? 'Unlimited' : String(v),
    teamMembers: (v) => v === -1 ? 'Unlimited' : String(v),
};

// Order in which limits appear on the card
const LIMIT_ORDER = ['businesses', 'sites', 'pagesPerSite', 'deploymentsPerMonth', 'tokenLimit', 'teamMembers', 'storageGB'];

function formatPrice(price, currency) {
    if (price === 0) return "Free";
    if (currency === "INR") return `₹${price.toLocaleString("en-IN")}`;
    return `$${price}`;
}

const STATUS_CONFIG = {
    ACTIVE: { label: "Your Plan", color: "text-emerald-600", bg: "bg-emerald-50" },
    TRIAL: { label: "Trial Active", color: "text-blue-600", bg: "bg-blue-50" },
    PAST_DUE: { label: "Payment Due", color: "text-amber-600", bg: "bg-amber-50" },
    CANCELLED: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50" },
};

function PlanCard({ plan, currentPlan, subscription, onSelectPlan, loading, tenantId }) {
    const isPro = plan.id === "PRO";
    const isCurrent = plan.isCurrent;
    const isHigher = ["FREE", "STARTER", "PRO", "ENTERPRISE"].indexOf(plan.id) >
        ["FREE", "STARTER", "PRO", "ENTERPRISE"].indexOf(currentPlan);
    const isLower = !isHigher && !isCurrent;
    const statusCfg = isCurrent && subscription ? STATUS_CONFIG[subscription.status] : null;

    const btnLabel = () => {
        if (isCurrent) return "Current Plan";
        if (isHigher) return "Upgrade";
        if (isLower) return "Downgrade";
        return "Subscribe";
    };

    const btnDisabled = isCurrent || plan.id === "FREE";

    return (
        <motion.div
            variants={FADE_UP}
            className={`relative flex flex-col rounded-[2rem] p-8 sm:p-10 transition-all duration-300
                ${isPro
                    ? "bg-[#0b1411] border border-transparent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-15px_rgba(211,255,74,0.15)] md:-translate-y-6"
                    : "bg-white border border-gray-200 hover:border-[#8bc4b1] hover:shadow-xl hover:-translate-y-2"
                }
            `}
        >
            {isPro && (
                <>
                    <div className="absolute top-0 inset-x-0 h-1 bg-[#d3ff4a] rounded-t-[2rem]" />
                    <div className="absolute -top-4 right-8 bg-[#d3ff4a] text-[#0b1411] text-[10px] uppercase font-black tracking-widest py-1.5 px-3 rounded-full">
                        Most Popular
                    </div>
                </>
            )}

            {/* Status badge */}
            {statusCfg && (
                <div className={`absolute top-4 left-8 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                </div>
            )}

            {/* Header */}
            <div className="mt-4 mb-6">
                <h4 className={`text-xl font-bold mb-1 ${isPro ? "text-white" : "text-[#0b1411]"}`}>
                    {plan.displayName}
                </h4>
                <p className={`text-sm min-h-[36px] ${isPro ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.description}
                </p>
            </div>

            {/* Price */}
            <div className={`mb-8 border-b pb-8 ${isPro ? "border-white/10" : "border-gray-100"}`}>
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${isPro ? "text-white" : "text-[#0b1411]"}`}>
                        {formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price !== 0 && (
                        <span className={`text-sm font-medium ${isPro ? "text-gray-500" : "text-gray-500"}`}>
                            /month
                        </span>
                    )}
                </div>
            </div>

            {/* Limits — businesses first, then others in order */}
            <ul className="flex flex-col gap-3 mb-6 flex-1">
                {LIMIT_ORDER.filter(key => plan.limits[key] !== undefined).map((key) => {
                    const val = plan.limits[key];
                    const formatter = LIMIT_FORMAT[key] || String;
                    const formatted = formatter(val);
                    const isBusinesses = key === 'businesses';
                    return (
                        <li key={key} className={`flex items-center gap-3 text-sm font-medium ${isPro ? "text-gray-300" : "text-gray-700"} ${isBusinesses ? 'font-bold' : ''}`}>
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isBusinesses ? (isPro ? 'text-[#d3ff4a]' : 'text-[#0b1411]') : (isPro ? 'text-[#d3ff4a]/60' : 'text-[#8bc4b1]')}`} />
                            <span className="font-black">{formatted}</span>
                            <span className={`${isPro ? "text-gray-500" : "text-gray-400"} ${isBusinesses ? 'font-bold' : ''}`}>{LIMIT_LABELS[key]}</span>
                        </li>
                    );
                })}
            </ul>

            {/* Features */}
            <ul className="flex flex-col gap-2.5 mb-8">
                {Object.entries(plan.features).map(([key, enabled]) => (
                    <li
                        key={key}
                        className={`flex items-center gap-2.5 text-sm font-medium ${enabled
                            ? (isPro ? "text-gray-300" : "text-gray-700")
                            : (isPro ? "text-gray-600 line-through" : "text-gray-300 line-through")
                            }`}
                    >
                        {enabled
                            ? <Zap className={`w-4 h-4 shrink-0 ${isPro ? "text-[#00e5ff]" : "text-[#8bc4b1]"}`} />
                            : <XCircle className="w-4 h-4 shrink-0 text-gray-300" />
                        }
                        {FEATURE_LABELS[key] ?? key}
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                onClick={() => !btnDisabled && onSelectPlan(plan.id)}
                disabled={btnDisabled || loading === plan.id}
                className={`w-full py-4 rounded-full font-bold transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
                    ${isCurrent
                        ? "bg-[#f2f4f2] text-gray-400 cursor-default"
                        : isPro
                            ? "bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f] hover:scale-105 shadow-[0_0_20px_rgba(211,255,74,0.3)]"
                            : "bg-[#0b1411] text-white hover:bg-[#132a25]"
                    }
                `}
            >
                {loading === plan.id ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                ) : (
                    <>
                        {isCurrent && <CheckCheck className="h-4 w-4" />}
                        {btnLabel()}
                        {!isCurrent && !btnDisabled && <ArrowRight className="h-4 w-4" />}
                    </>
                )}
            </button>

            {/* Cancellation note */}
            {isCurrent && subscription?.cancelAtPeriodEnd && (
                <p className="text-xs text-center mt-3 text-amber-500 font-medium">
                    Cancels at period end
                </p>
            )}
        </motion.div>
    );
}

function PricingContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const tenantId = searchParams.get("tenantId");

    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState("FREE");
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(null); // plan id being subscribed to
    const [error, setError] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, [tenantId]);

    const fetchPlans = async () => {
        try {
            const url = tenantId
                ? `/api/pricing/plans?tenantId=${tenantId}`
                : `/api/pricing/plans`;
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                setPlans(data.plans);
                setCurrentPlan(data.currentPlan);
                setSubscription(data.subscription);
            }
        } catch (err) {
            console.error("[Pricing] Failed to load plans:", err);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSelectPlan = async (planId) => {
        if (!session?.user) {
            window.location.href = "/signin?redirect=/pricing";
            return;
        }
        if (!tenantId) {
            window.location.href = "/dashboard";
            return;
        }

        setLoading(planId);
        setError(null);

        try {
            const resp = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, planType: planId, billingCycle: "monthly" }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                setError(data.error ?? "Failed to initiate subscription");
                return;
            }

            // Open Razorpay checkout
            const { checkoutOptions } = data;
            if (typeof window !== "undefined" && window.Razorpay) {
                const rzp = new window.Razorpay(checkoutOptions);
                rzp.open();
            } else {
                // Fallback: load Razorpay SDK
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => {
                    const rzp = new window.Razorpay(checkoutOptions);
                    rzp.open();
                };
                document.head.appendChild(script);
            }
        } catch (err) {
            console.error("[Pricing] Error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={`min-h-screen bg-white text-gray-900 ${inter.className}`}>
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] pt-6 pb-24 md:pb-32">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px]" />
                <AppNavbar />
                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-12 sm:mt-20 text-center">
                    <motion.div initial="hidden" animate="show" variants={STAGGER} className="max-w-3xl mx-auto">
                        <motion.h1 variants={FADE_UP} className="text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-black text-white uppercase tracking-tighter mb-8">
                            Predictable<br />Pricing
                        </motion.h1>
                        <motion.p variants={FADE_UP} className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light mb-10">
                            Clear limits spanning sites, AI usage, and storage.
                            Upgrade or downgrade anytime — no surprises.
                        </motion.p>
                        {subscription && (
                            <motion.div variants={FADE_UP}>
                                {subscription.status === "PAST_DUE" && (
                                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-bold px-5 py-2.5 rounded-full">
                                        <AlertTriangle className="h-4 w-4" />
                                        Payment overdue — update your method below
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Plans Grid */}
            <section className="py-24 sm:py-32 relative -mt-16 z-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    {error && (
                        <div className="mb-8 max-w-xl mx-auto flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-medium">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {initialLoading ? (
                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-white border border-gray-100 rounded-[2rem] p-10 animate-pulse">
                                    <div className="h-6 bg-gray-100 rounded-full w-24 mb-4" />
                                    <div className="h-10 bg-gray-100 rounded-full w-32 mb-8" />
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-100 rounded-full" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={STAGGER}
                            className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto"
                        >
                            {plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    currentPlan={currentPlan}
                                    subscription={subscription}
                                    onSelectPlan={handleSelectPlan}
                                    loading={loading}
                                    tenantId={tenantId}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Footer note */}
                    <div className="max-w-4xl mx-auto px-6 text-center mt-24">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrated Payments Engine</h3>
                        <p className="text-gray-500 text-lg leading-relaxed">
                            SitePilot manages the full subscription lifecycle via Razorpay.
                            Upgrades unlock features instantly. Downgrades apply at your next billing cycle.
                            Plan access is enforced entirely on the backend — no workarounds possible.
                        </p>
                    </div>
                </div>
            </section>

            <AppFooter />
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    );
}
