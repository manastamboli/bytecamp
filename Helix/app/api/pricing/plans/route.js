/**
 * app/api/pricing/plans/route.js
 *
 * GET /api/pricing/plans?tenantId=xxx  (tenantId optional — for authenticated context)
 *
 * Returns the full plan configuration for the pricing page, enriched with
 * the user's current subscription status if authenticated and tenantId is given.
 *
 * This is the backend source of truth for the pricing page.
 * Frontend never hardcodes prices or plan features.
 */

import { NextResponse } from "next/server";
import { getPricingPlans } from "@/lib/plans";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
    const plans = getPricingPlans();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let currentSubscription = null;
    let currentPlan = "FREE";

    // Optionally enrich with user's current plan
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user && tenantId) {
            const membership = await prisma.tenantUser.findFirst({
                where: { userId: session.user.id, tenantId },
            });
            if (membership) {
                const sub = await prisma.subscription.findUnique({ where: { tenantId } });
                currentSubscription = sub;
                currentPlan = sub?.planType ?? "FREE";
            }
        }
    } catch {
        // Not authenticated or tenantId invalid — still return plans
    }

    // Serialize plans (remove env-private razorpayPlanId)
    const publicPlans = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        limits: plan.limits,
        features: plan.features,
        isCurrent: plan.id === currentPlan,
        canSubscribe: plan.id !== "FREE" && !!plan.razorpayPlanId,
    }));

    return NextResponse.json({
        plans: publicPlans,
        currentPlan,
        subscription: currentSubscription
            ? {
                status: currentSubscription.status,
                currentPeriodEnd: currentSubscription.currentPeriodEnd,
                cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
            }
            : null,
    });
}
