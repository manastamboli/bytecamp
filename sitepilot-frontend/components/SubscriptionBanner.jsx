"use client";

/**
 * components/SubscriptionBanner.jsx
 *
 * A top-of-page warning banner shown when a subscription is PAST_DUE or
 * CANCELLED. Should be injected into dashboard layout when subscription status
 * requires user attention.
 *
 * Props:
 *   status: 'PAST_DUE' | 'CANCELLED' | 'PAUSED'
 *   isInGracePeriod: boolean
 *   currentPeriodEnd: string (ISO date)
 *   tenantId: string
 */

import { useRouter } from "next/navigation";
import { AlertTriangle, XCircle, CreditCard, ArrowRight } from "lucide-react";

export default function SubscriptionBanner({ status, isInGracePeriod, currentPeriodEnd, tenantId }) {
    const router = useRouter();

    if (status === "ACTIVE" || status === "TRIAL" || !status) return null;

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

    let config;

    if (status === "PAST_DUE") {
        config = {
            bg: "bg-amber-500",
            icon: AlertTriangle,
            title: isInGracePeriod
                ? "⚠️ Payment overdue — please update your payment method"
                : "🚫 Subscription expired — publishing and new deployments are restricted",
            sub: isInGracePeriod
                ? `You're within the grace period. Service continues but publishing may be restricted soon.`
                : `Your billing period ended. Upgrade to restore full access.`,
            cta: "Update Payment",
        };
    } else if (status === "CANCELLED") {
        config = {
            bg: "bg-red-500",
            icon: XCircle,
            title: "Subscription cancelled",
            sub: currentPeriodEnd
                ? `Access remains active until ${formatDate(currentPeriodEnd)}. Resubscribe to continue.`
                : "Your account has been downgraded to FREE. Resubscribe to continue.",
            cta: "Resubscribe",
        };
    } else if (status === "PAUSED") {
        config = {
            bg: "bg-gray-700",
            icon: CreditCard,
            title: "Subscription paused",
            sub: "Some features are restricted while your subscription is paused.",
            cta: "Resume Subscription",
        };
    } else {
        return null;
    }

    const Icon = config.icon;

    return (
        <div className={`w-full ${config.bg} text-white px-4 py-3 flex items-center justify-between gap-4 z-50`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{config.title}</p>
                    <p className="text-xs opacity-80 hidden sm:block">{config.sub}</p>
                </div>
            </div>
            <button
                onClick={() => router.push("/pricing")}
                className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all"
            >
                {config.cta}
                <ArrowRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
