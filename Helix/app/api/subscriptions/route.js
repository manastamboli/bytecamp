/**
 * app/api/subscriptions/route.js
 *
 * GET  /api/subscriptions?tenantId=xxx  — Fetch current subscription for a tenant
 * POST /api/subscriptions               — Initiate a new subscription (Step 1 of lifecycle)
 *
 * POST body:
 * {
 *   tenantId: string,
 *   planType: 'STARTER' | 'PRO' | 'ENTERPRISE',
 *   billingCycle?: 'monthly' | 'yearly'
 * }
 *
 * Response on POST:
 * {
 *   subscriptionId: string,           // Internal DB id
 *   razorpaySubscriptionId: string,   // RZP sub id
 *   checkoutOptions: object,          // Pass to Razorpay.js on the client
 *   isNewCustomer: boolean,
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getPlanConfig } from '@/lib/plans';
import {
    createRazorpayCustomer,
    createRazorpaySubscription,
    buildCheckoutOptions,
} from '@/lib/razorpay';
import { GRACE_PERIOD_DAYS } from '@/lib/plans';

export const runtime = 'nodejs';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        // Ensure the user belongs to this tenant
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
        });

        // Also fetch counts for usage display
        const [tenant, siteCount] = await Promise.all([
            prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, tokenUsage: true, tokenLimit: true } }),
            prisma.site.count({ where: { tenantId } }),
        ]);

        // Count deployments in current billing cycle
        let deploymentsThisCycle = 0;
        if (subscription && subscription.currentPeriodStart) {
            deploymentsThisCycle = await prisma.deployment.count({
                where: {
                    site: { tenantId },
                    createdAt: { gte: subscription.currentPeriodStart },
                },
            });
        }

        return NextResponse.json({
            subscription: subscription ?? null,
            usage: {
                sites: siteCount,
                tokens: tenant?.tokenUsage ?? 0,
                tokenLimit: tenant?.tokenLimit ?? 0,
                deployments: deploymentsThisCycle,
            },
        });
    } catch (error) {
        console.error('[GET /api/subscriptions]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId, planType, billingCycle = 'monthly' } = body;

        if (!tenantId || !planType) {
            return NextResponse.json({ error: 'tenantId and planType are required' }, { status: 400 });
        }

        // Ensure the user is an OWNER of this tenant
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId, role: 'OWNER' },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Only tenant owners can manage subscriptions' }, { status: 403 });
        }

        // Validate plan
        const planConfig = getPlanConfig(planType);
        if (!planConfig) {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }
        if (planType === 'FREE') {
            return NextResponse.json({ error: 'Cannot create a paid subscription for FREE plan' }, { status: 400 });
        }
        if (!planConfig.razorpayPlanId) {
            return NextResponse.json({
                error: `Razorpay plan ID not configured for ${planType}. Set RAZORPAY_PLAN_${planType} env var.`
            }, { status: 503 });
        }

        // Fetch tenant + existing subscription
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true, owner: true },
        });
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        let razorpayCustomerId = tenant.subscription?.razorpayCustomerId ?? null;
        let isNewCustomer = false;

        // ── Step 1: Ensure Razorpay customer exists ────────────────────────────
        if (!razorpayCustomerId) {
            const customer = await createRazorpayCustomer({
                name: tenant.owner.name ?? tenant.name,
                email: tenant.owner.email,
            });
            razorpayCustomerId = customer.id;
            isNewCustomer = true;
        }

        // ── Step 2: Create Razorpay subscription (status = created / pending) ─
        const rzSubscription = await createRazorpaySubscription({
            planId: planConfig.razorpayPlanId,
            customerId: razorpayCustomerId,
            totalCount: billingCycle === 'yearly' ? 12 : 120, // 12m or 10y
        });

        // ── Step 3: Upsert internal Subscription row ───────────────────────────
        // Only set TRIAL if we literally trust them to trial first without paying.
        // Otherwise, it sits as PENDING until the Razorpay webhook confirms payment.
        const currentStatus = tenant.subscription?.status;
        const targetStatus = (currentStatus === 'ACTIVE' || currentStatus === 'TRIAL') ? currentStatus : 'PAUSED';

        const subscription = await prisma.subscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                userId: session.user.id,
                razorpayCustomerId,
                razorpaySubscriptionId: rzSubscription.id,
                razorpayPlanId: planConfig.razorpayPlanId,
                planType,
                status: 'PAUSED',       // Requires webhook to flip to ACTIVE
                billingCycle,
            },
            update: {
                // Allow re-initiation if previous was cancelled
                razorpayCustomerId,
                razorpaySubscriptionId: rzSubscription.id,
                razorpayPlanId: planConfig.razorpayPlanId,
                planType,
                status: targetStatus,
                billingCycle,
                cancelAtPeriodEnd: false,
                cancelledAt: null,
            },
        });

        // Determine base URL dynamically
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');

        // Build checkout options for the frontend
        const checkoutOptions = buildCheckoutOptions({
            subscriptionId: rzSubscription.id,
            name: 'SitePilot',
            description: `${planConfig.displayName} Plan – ${billingCycle}`,
            prefillEmail: session.user.email,
            prefillName: session.user.name ?? '',
            callbackUrl: `${appUrl}/api/subscriptions/callback`,
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpaySubscriptionId: rzSubscription.id,
            checkoutOptions,
            isNewCustomer,
        });
    } catch (error) {
        console.error('[POST /api/subscriptions]', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate subscription' }, { status: 500 });
    }
}
