/**
 * app/api/subscriptions/upgrade/route.js
 *
 * POST /api/subscriptions/upgrade
 *
 * Body: { tenantId: string, planType: 'STARTER'|'PRO'|'ENTERPRISE' }
 *
 * Upgrade: Immediate unlock at DB level (Razorpay plan change propagates via webhook).
 * Downgrade: DB flag set; plan applied at next billing cycle via webhook.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getPlanConfig, getPlanChangeType, getTokenLimit } from '@/lib/plans';
import { updateRazorpaySubscriptionPlan } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId, planType } = await request.json();

        if (!tenantId || !planType) {
            return NextResponse.json({ error: 'tenantId and planType are required' }, { status: 400 });
        }

        // Only OWNER can change plan
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId, role: 'OWNER' },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Only owners can change plans' }, { status: 403 });
        }

        const planConfig = getPlanConfig(planType);
        if (!planConfig) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }
        if (!planConfig.razorpayPlanId) {
            return NextResponse.json({ error: `Razorpay plan ID not configured for ${planType}` }, { status: 503 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const subscription = tenant.subscription;
        if (!subscription) {
            return NextResponse.json({ error: 'No subscription found for this tenant' }, { status: 404 });
        }

        const changeType = getPlanChangeType(subscription.planType, planType);

        if (changeType === 'same') {
            return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
        }

        // Tell Razorpay to switch plan
        if (subscription.razorpaySubscriptionId) {
            await updateRazorpaySubscriptionPlan(subscription.razorpaySubscriptionId, planConfig.razorpayPlanId);
        }

        // For upgrades: apply immediately in DB
        // For downgrades: Razorpay applies at period end; DB updated on webhook
        let updatedSubscription;
        if (changeType === 'upgrade') {
            const newTokenLimit = getTokenLimit(planType);
            updatedSubscription = await prisma.$transaction(async (tx) => {
                const sub = await tx.subscription.update({
                    where: { tenantId },
                    data: {
                        planType,
                        razorpayPlanId: planConfig.razorpayPlanId,
                    },
                });
                await tx.tenant.update({
                    where: { id: tenantId },
                    data: {
                        plan: planType,
                        tokenLimit: newTokenLimit === -1 ? 9999999 : newTokenLimit,
                    },
                });
                return sub;
            });
        } else {
            // Downgrade — mark pending, applied on next billing via webhook
            updatedSubscription = await prisma.subscription.update({
                where: { tenantId },
                data: {
                    // We store the pending plan in razorpayPlanId — webhook will finalise planType
                    razorpayPlanId: planConfig.razorpayPlanId,
                },
            });
        }

        return NextResponse.json({
            success: true,
            changeType,
            planType,
            message: changeType === 'upgrade'
                ? `Upgraded to ${planConfig.displayName} — features are now active.`
                : `Downgrade to ${planConfig.displayName} scheduled for your next billing date.`,
        });
    } catch (error) {
        console.error('[POST /api/subscriptions/upgrade]', error);
        return NextResponse.json({ error: error.message || 'Failed to change plan' }, { status: 500 });
    }
}
