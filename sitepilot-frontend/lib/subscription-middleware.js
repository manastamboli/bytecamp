/**
 * lib/subscription-middleware.js
 *
 * Reusable API middleware that enforces subscription access.
 *
 * Usage pattern — wrap any handler:
 *
 *   import { withSubscription } from '@/lib/subscription-middleware'
 *
 *   export const POST = withSubscription(
 *     async (request, context, guard) => {
 *       // guard is a loaded PlanGuard
 *       guard.requireActive()
 *       guard.checkSiteLimit(siteCount)
 *       // ... your handler logic
 *     },
 *     { requirePlan: 'STARTER' }   // optional: minimum plan required
 *   )
 *
 * Options:
 *   requirePlan?: PlanType   — Minimum plan level required (default: no min)
 *   getTenantId?: (request, context) => Promise<string>  — custom extractor
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { PlanGuard, PlanGuardError, planGuardErrorResponse } from '@/lib/plan-guard';
import { PLAN_HIERARCHY } from '@/lib/plans';

// ─── Core middleware factory ───────────────────────────────────────────────────

/**
 * @param {Function} handler  async (request, context, guard, session) => NextResponse
 * @param {{
 *   requirePlan?: string,
 *   getTenantId?: (request: Request, context: any) => Promise<string|null>
 * }} [options]
 */
export function withSubscription(handler, options = {}) {
    return async function wrappedHandler(request, context) {
        try {
            // 1. Auth check
            const session = await auth.api.getSession({ headers: await headers() });
            if (!session?.user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // 2. Resolve tenantId
            let tenantId;
            if (options.getTenantId) {
                tenantId = await options.getTenantId(request, context);
            } else {
                // Try common sources: params.tenantId, params.siteId→site.tenantId, body.tenantId
                tenantId = context?.params?.tenantId ?? null;

                if (!tenantId && context?.params?.siteId) {
                    const site = await prisma.site.findUnique({
                        where: { id: context.params.siteId },
                        select: { tenantId: true },
                    });
                    tenantId = site?.tenantId ?? null;
                }

                if (!tenantId) {
                    // Try reading from body (once, cached)
                    try {
                        const cloned = request.clone();
                        const body = await cloned.json();
                        tenantId = body?.tenantId ?? null;
                    } catch {
                        // body might not be JSON or already read
                    }
                }
            }

            if (!tenantId) {
                return NextResponse.json({ error: 'Could not resolve tenant for subscription check' }, { status: 400 });
            }

            // 3. Load tenant + subscription
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                include: { subscription: true },
            });

            if (!tenant) {
                return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
            }

            // 4. Build guard
            const guard = new PlanGuard(tenant.subscription, tenant);

            // 5. Check minimum plan requirement
            if (options.requirePlan) {
                const currentIdx = PLAN_HIERARCHY.indexOf(guard.planType);
                const requiredIdx = PLAN_HIERARCHY.indexOf(options.requirePlan);
                if (currentIdx < requiredIdx) {
                    return NextResponse.json(
                        {
                            error: `This feature requires the ${options.requirePlan} plan or higher.`,
                            code: 'PLAN_UPGRADE_REQUIRED',
                            upgrade: true,
                            requiredPlan: options.requirePlan,
                        },
                        { status: 403 }
                    );
                }
            }

            // 6. Delegate to handler
            return await handler(request, context, guard, session);
        } catch (err) {
            if (err instanceof PlanGuardError) {
                return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
            }
            console.error('[withSubscription] Unexpected error:', err);
            return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
        }
    };
}

// ─── Simple guard loader (for inline use in existing routes) ──────────────────

/**
 * Load a PlanGuard and membership check for an existing route.
 * Returns null and sends a response if checks fail — caller should return early.
 *
 * @example
 *   const [guard, err] = await loadGuardForSite(request, siteId, session)
 *   if (err) return err
 *   guard.requireActive()
 */
export async function loadGuardForSite(siteId, session) {
    const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { tenantId: true },
    });

    if (!site) {
        return [null, NextResponse.json({ error: 'Site not found' }, { status: 404 })];
    }

    const membership = await prisma.tenantUser.findFirst({
        where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership) {
        return [null, NextResponse.json({ error: 'Forbidden' }, { status: 403 })];
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: site.tenantId },
        include: { subscription: true },
    });

    return [new PlanGuard(tenant.subscription, tenant), null];
}

/**
 * Load a PlanGuard directly from a tenantId + session (with OWNER check).
 */
export async function loadGuardForTenant(tenantId, session, { requireOwner = false } = {}) {
    const where = requireOwner
        ? { userId: session.user.id, tenantId, role: 'OWNER' }
        : { userId: session.user.id, tenantId };

    const membership = await prisma.tenantUser.findFirst({ where });
    if (!membership) {
        return [null, NextResponse.json({ error: 'Forbidden' }, { status: 403 })];
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { subscription: true },
    });

    if (!tenant) {
        return [null, NextResponse.json({ error: 'Tenant not found' }, { status: 404 })];
    }

    return [new PlanGuard(tenant.subscription, tenant), null];
}
