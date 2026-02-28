/**
 * app/api/subscriptions/cancel/route.js
 *
 * POST /api/subscriptions/cancel
 *
 * Body: { tenantId: string }
 *
 * Sets cancelAtPeriodEnd = true on the Razorpay subscription and updates DB.
 * User keeps access until currentPeriodEnd.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { cancelRazorpaySubscription } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = await request.json();
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        // Only OWNER can cancel
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId, role: 'OWNER' },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Only owners can cancel a subscription' }, { status: 403 });
        }

        const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
        if (!subscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }
        if (!subscription.razorpaySubscriptionId) {
            return NextResponse.json({ error: 'No Razorpay subscription linked' }, { status: 400 });
        }

        // Tell Razorpay to cancel at end of billing cycle
        await cancelRazorpaySubscription(subscription.razorpaySubscriptionId, true);

        // Update DB
        const updated = await prisma.subscription.update({
            where: { tenantId },
            data: {
                cancelAtPeriodEnd: true,
                cancelledAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: updated.currentPeriodEnd,
            message: 'Your subscription will be cancelled at the end of the current billing cycle.',
        });
    } catch (error) {
        console.error('[POST /api/subscriptions/cancel]', error);
        return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
    }
}
