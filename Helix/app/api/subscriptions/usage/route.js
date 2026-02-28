/**
 * app/api/subscriptions/usage/route.js
 *
 * GET /api/subscriptions/usage?tenantId=xxx
 *
 * Returns a complete usage summary for the billing dashboard widget.
 * Used by the site dashboard and workspace overview.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { PlanGuard } from '@/lib/plan-guard';

export const runtime = 'nodejs';

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

        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Load tenant + subscription
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const guard = new PlanGuard(tenant.subscription, tenant);

        // Current site count
        const siteCount = await prisma.site.count({ where: { tenantId } });

        // Deployments in current billing cycle
        const periodStart = tenant.subscription?.currentPeriodStart
            ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const deploymentsThisCycle = await prisma.deployment.count({
            where: {
                site: { tenantId },
                createdAt: { gte: periodStart },
            },
        });

        const usage = guard.getUsageSummary(siteCount, tenant.tokenUsage, deploymentsThisCycle);

        return NextResponse.json({ usage });
    } catch (error) {
        console.error('[GET /api/subscriptions/usage]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
