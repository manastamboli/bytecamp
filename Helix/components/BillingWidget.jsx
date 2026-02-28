"use client";

/**
 * components/BillingWidget.jsx
 *
 * Displays subscription status, usage meters, and upgrade CTA.
 * Used on the tenant dashboard overview page.
 *
 * Props:
 *   tenantId: string
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    Zap,
    Globe,
    BarChart3,
    ArrowUpRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
    ACTIVE: {
        label: "Active",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
    },
    TRIAL: {
        label: "Trial",
        icon: Clock,
        color: "text-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-100",
    },
    PAST_DUE: {
        label: "Payment Due",
        icon: AlertTriangle,
        color: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-50",
        border: "border-red-100",
    },
    PAUSED: {
        label: "Paused",
        icon: Clock,
        color: "text-gray-500",
        bg: "bg-gray-50",
        border: "border-gray-100",
    },
};

function UsageMeter({ label, icon: Icon, used, limit, unlimited, percent, color = "#d3ff4a" }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </div>
                <span className="text-xs font-bold text-gray-700">
                    {unlimited ? (
                        <span className="text-emerald-500">Unlimited</span>
                    ) : (
                        `${used.toLocaleString()} / ${limit.toLocaleString()}`
                    )}
                </span>
            </div>
            {!unlimited && (
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${percent}%`,
                            background: percent > 85 ? "#ef4444" : percent > 60 ? "#f59e0b" : color,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function BillingWidget({ tenantId }) {
    const router = useRouter();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        fetchUsage();
    }, [tenantId]);

    const fetchUsage = async () => {
        try {
            const resp = await fetch(`/api/subscriptions/usage?tenantId=${tenantId}`);
            if (resp.ok) {
                const data = await resp.json();
                setUsage(data.usage);
            }
        } catch (err) {
            console.error("[BillingWidget] Failed to load usage:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded-full w-24 mb-4" />
                <div className="h-8 bg-gray-100 rounded-full w-32 mb-6" />
                <div className="space-y-3">
                    <div className="h-3 bg-gray-100 rounded-full" />
                    <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                </div>
            </div>
        );
    }

    if (!usage) return null;

    const statusCfg = STATUS_CONFIG[usage.status] ?? STATUS_CONFIG.ACTIVE;
    const StatusIcon = statusCfg.icon;

    const isPastDue = usage.isPastDue;
    const isActive = usage.isActive;
    const isFree = usage.plan === "FREE";

    return (
        <div className={`bg-white border rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col gap-6 ${isPastDue ? "border-amber-200" : "border-gray-100"}`}>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1">
                        BILLING PLAN
                    </p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-[#0b1411] tracking-tight uppercase">
                            {usage.planDisplayName}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                        </span>
                    </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#0b1411] flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-[#d3ff4a]" />
                </div>
            </div>

            {/* Past Due Warning */}
            {isPastDue && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Payment Past Due</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            {usage.isInGracePeriod
                                ? "You're in the grace period. Update your payment method to avoid service interruption."
                                : "Your subscription has expired. Publishing and deployments are restricted."}
                        </p>
                    </div>
                </div>
            )}

            {/* Cancellation Notice */}
            {usage.cancelAtPeriodEnd && usage.currentPeriodEnd && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <XCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-gray-700">Cancellation Scheduled</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Access until {formatDate(usage.currentPeriodEnd)}. Features remain available until then.
                        </p>
                    </div>
                </div>
            )}

            {/* Usage Meters */}
            <div className="space-y-4">
                <UsageMeter
                    label="Sites"
                    icon={Globe}
                    used={usage.sites.used}
                    limit={usage.sites.limit}
                    unlimited={usage.sites.unlimited}
                    percent={usage.sites.percent}
                    color="#d3ff4a"
                />
                <UsageMeter
                    label="AI Tokens"
                    icon={Zap}
                    used={usage.tokens.used}
                    limit={usage.tokens.limit}
                    unlimited={usage.tokens.unlimited}
                    percent={usage.tokens.percent}
                    color="#00e5ff"
                />
                <UsageMeter
                    label="Deployments"
                    icon={BarChart3}
                    used={usage.deployments.used}
                    limit={usage.deployments.limit}
                    unlimited={usage.deployments.unlimited}
                    percent={usage.deployments.percent}
                    color="#8bc4b1"
                />
            </div>

            {/* Billing Info */}
            {usage.currentPeriodEnd && !usage.cancelAtPeriodEnd && (
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-4">
                    <span className="font-medium">Next billing date</span>
                    <span className="font-bold text-gray-600">{formatDate(usage.currentPeriodEnd)}</span>
                </div>
            )}

            {/* CTA */}
            {(isFree || isPastDue || !isActive) && (
                <button
                    onClick={() => router.push("/pricing")}
                    className="w-full py-3.5 px-6 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#c0eb3f] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(211,255,74,0.3)]"
                >
                    <ArrowUpRight className="h-4 w-4" />
                    {isPastDue ? "Update Payment Method" : "Upgrade Plan"}
                </button>
            )}

            {!isFree && isActive && !usage.cancelAtPeriodEnd && (
                <button
                    onClick={() => router.push("/pricing")}
                    className="w-full py-3 px-6 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-full hover:border-[#0b1411] hover:text-[#0b1411] transition-all flex items-center justify-center gap-2"
                >
                    Manage Plan
                </button>
            )}
        </div>
    );
}
