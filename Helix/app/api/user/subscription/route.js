/**
 * app/api/user/subscription/route.js
 *
 * GET /api/user/subscription
 *
 * Returns the authenticated user's effective subscription state:
 *   - Best active subscription found across all owned tenants
 *   - Current businesses (owned tenant) count
 *   - Whether they can create more businesses
 *   - Business limit for their plan
 *
 * Logic:
 *   A user may own multiple tenants. Each tenant can have its own Subscription.
 *   For the purposes of the /dashboard (creating new workspaces), we use the
 *   "best" subscription found — ACTIVE > TRIAL > PAST_DUE (in grace) > none.
 *
 *   In practice, a user subscribes at the tenant level, but the PLAN determines
 *   how many tenants they can have in total. We treat the highest active plan
 *   as the user's effective plan.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { PlanGuard } from '@/lib/plan-guard';
import { getBusinessLimit, getPlanConfig } from '@/lib/plans';

export const runtime = 'nodejs';

const STATUS_RANK = { ACTIVE: 4, TRIAL: 3, PAST_DUE: 2, PAUSED: 1, CANCELLED: 0 };

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Load all owned tenants with their subscriptions
        const ownedTenantUsers = await prisma.tenantUser.findMany({
            where: { userId, role: 'OWNER' },
            include: {
                tenant: {
                    include: { subscription: true },
                },
            },
        });

        const ownedTenants = ownedTenantUsers.map(tu => tu.tenant);
        const businessCount = ownedTenants.length;

        // Find the best subscription (highest-ranked status + highest plan)
        let bestSubscription = null;
        let bestTenant = null;

        for (const tenant of ownedTenants) {
            const sub = tenant.subscription;
            if (!sub) continue;

            const rank = STATUS_RANK[sub.status] ?? -1;
            const bestRank = bestSubscription ? (STATUS_RANK[bestSubscription.status] ?? -1) : -1;

            if (rank > bestRank) {
                bestSubscription = sub;
                bestTenant = tenant;
            } else if (rank === bestRank && bestSubscription) {
                // Tie-break by plan level
                const plans = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
                if (plans.indexOf(sub.planType) > plans.indexOf(bestSubscription.planType)) {
                    bestSubscription = sub;
                    bestTenant = tenant;
                }
            }
        }

        // Determine effective plan
        const effectivePlan = bestSubscription?.planType ?? 'FREE';
        const planConfig = getPlanConfig(effectivePlan);
        const businessLimit = getBusinessLimit(effectivePlan);

        // Build a guard for the effective state
        const guard = new PlanGuard(bestSubscription, bestTenant);

        // canCreateBusiness: check if they are under their business limit and their sub is functionally active
        const canCreateBusiness = guard.isActive && guard.canCreateBusiness(businessCount);

        // Reason why they can't create a business (for UI messaging)
        let blockReason = null;
        if (!guard.isActive) {
            blockReason = bestSubscription?.status ?? 'INACTIVE'; // PAST_DUE, CANCELLED, PAUSED
        } else if (!canCreateBusiness) {
            blockReason = 'BUSINESS_LIMIT_EXCEEDED';
        }

        return NextResponse.json({
            // Effective subscription
            plan: effectivePlan,
            planConfig: {
                displayName: planConfig.displayName,
                price: planConfig.price,
                currency: planConfig.currency,
                limits: planConfig.limits,
                features: planConfig.features,
            },
            subscription: bestSubscription
                ? {
                    id: bestSubscription.id,
                    status: bestSubscription.status,
                    planType: bestSubscription.planType,
                    currentPeriodEnd: bestSubscription.currentPeriodEnd,
                    cancelAtPeriodEnd: bestSubscription.cancelAtPeriodEnd,
                    gracePeriodEnd: bestSubscription.gracePeriodEnd,
                }
                : null,

            // Business usage
            businessCount,
            businessLimit,
            businessLimitUnlimited: businessLimit === -1,

            // Key flags for UI
            hasSubscription: !!bestSubscription,
            canCreateBusiness,
            blockReason,

            // Which tenant holds the best subscription (for upgrade links)
            subscriptionTenantId: bestTenant?.id ?? null,
        });
    } catch (error) {
        console.error('[GET /api/user/subscription]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
