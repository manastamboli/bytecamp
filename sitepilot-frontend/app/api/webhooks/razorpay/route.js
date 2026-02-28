/**
 * app/api/webhooks/razorpay/route.js
 *
 * Razorpay Webhook Handler
 *
 * Events handled:
 *   subscription.activated   → Mark ACTIVE, grant full access
 *   subscription.charged     → Refresh billing period
 *   payment.captured         → Alias for .charged (payment success)
 *   subscription.payment_failed → Mark PAST_DUE, set grace period
 *   subscription.paused      → Mark PAUSED
 *   subscription.cancelled   → Mark CANCELLED, downgrade to FREE
 *   subscription.completed   → Mark CANCELLED (cycle ended naturally)
 *   subscription.resumed     → Mark ACTIVE again
 *
 * Idempotency: we store the last processed webhook event ID in the
 * Subscription.lastWebhookEventId column and skip re-processing.
 *
 * Security: signature verified via X-Razorpay-Signature header.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { getTokenLimit, GRACE_PERIOD_DAYS } from '@/lib/plans';

export const runtime = 'nodejs';

// Raw body required for signature verification
export const dynamic = 'force-dynamic';

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
    let rawBody;
    let event;

    // 1. Read raw body
    try {
        rawBody = await request.text();
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 2. Verify signature
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    let signatureValid = false;
    try {
        signatureValid = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
        console.error('[Webhook] Signature verification setup error:', err.message);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 500 });
    }

    if (!signatureValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Extract event metadata
    const eventType = event.event;
    const eventId = event.id ?? event.payload?.subscription?.entity?.id ?? null;
    console.log(`[Webhook] Received: ${eventType} | id: ${eventId}`);

    // 4. Route to handler
    try {
        await handleEvent(eventType, event, eventId);
    } catch (err) {
        console.error(`[Webhook] Handler error for ${eventType}:`, err.message);
        // Return 200 to prevent Razorpay retries for errors we can't recover from
        return NextResponse.json({ received: true, error: err.message });
    }

    return NextResponse.json({ received: true });
}

// ─── Event router ─────────────────────────────────────────────────────────────

async function handleEvent(eventType, event, eventId) {
    const subscriptionEntity = event.payload?.subscription?.entity;
    const paymentEntity = event.payload?.payment?.entity;

    switch (eventType) {
        case 'subscription.activated':
            return onSubscriptionActivated(subscriptionEntity, eventId);

        case 'subscription.charged':
        case 'payment.captured':
            return onPaymentCaptured(subscriptionEntity, paymentEntity, eventId);

        case 'subscription.payment_failed':
            return onPaymentFailed(subscriptionEntity, eventId);

        case 'subscription.paused':
            return onSubscriptionPaused(subscriptionEntity, eventId);

        case 'subscription.cancelled':
        case 'subscription.completed':
            return onSubscriptionCancelled(subscriptionEntity, eventId);

        case 'subscription.resumed':
            return onSubscriptionResumed(subscriptionEntity, eventId);

        default:
            console.log(`[Webhook] Unhandled event: ${eventType}`);
    }
}

// ─── Idempotency helper ───────────────────────────────────────────────────────

/**
 * Check if this event was already processed.
 * @param {string} razorpaySubscriptionId
 * @param {string} eventId
 * @returns {Promise<import('@prisma/client').Subscription | null>} null if already processed
 */
async function loadSubscriptionForWebhook(razorpaySubscriptionId, eventId) {
    if (!razorpaySubscriptionId) {
        console.warn('[Webhook] No razorpaySubscriptionId in event');
        return null;
    }

    const subscription = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId },
    });

    if (!subscription) {
        console.warn(`[Webhook] Subscription not found for RZP id: ${razorpaySubscriptionId}`);
        return null;
    }

    // Idempotency check
    if (eventId && subscription.lastWebhookEventId === eventId) {
        console.log(`[Webhook] Already processed event ${eventId} — skipping`);
        return null;
    }

    return subscription;
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/** subscription.activated → Grant full access */
async function onSubscriptionActivated(entity, eventId) {
    const subscription = await loadSubscriptionForWebhook(entity?.id, eventId);
    if (!subscription) return;

    const periodStart = entity.current_start ? new Date(entity.current_start * 1000) : new Date();
    const periodEnd = entity.current_end ? new Date(entity.current_end * 1000) : null;
    const planType = subscription.planType; // Already set during initiation

    await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                gracePeriodEnd: null,
                cancelAtPeriodEnd: false,
                cancelledAt: null,
                lastWebhookEventId: eventId,
            },
        });

        // Sync tenant plan + token limit
        const newTokenLimit = getTokenLimit(planType);
        await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: {
                plan: planType,
                tokenLimit: newTokenLimit === -1 ? 9999999 : newTokenLimit,
            },
        });
    });

    console.log(`[Webhook] ✅ Subscription ACTIVATED for tenant ${subscription.tenantId} — plan: ${planType}`);
}

/** subscription.charged / payment.captured → Refresh billing period */
async function onPaymentCaptured(subscriptionEntity, paymentEntity, eventId) {
    const rzSubId = subscriptionEntity?.id ?? paymentEntity?.subscription_id;
    const subscription = await loadSubscriptionForWebhook(rzSubId, eventId);
    if (!subscription) return;

    const periodStart = subscriptionEntity?.current_start
        ? new Date(subscriptionEntity.current_start * 1000)
        : new Date();
    const periodEnd = subscriptionEntity?.current_end
        ? new Date(subscriptionEntity.current_end * 1000)
        : null;

    // If this is a plan change (downgrade applied at billing cycle start)
    // razorpayPlanId in DB might differ from subscription.planType
    // We check if RZP entity plan_id matches our configured plans
    const rzPlanId = subscriptionEntity?.plan_id ?? null;

    let newPlanType = subscription.planType;
    if (rzPlanId && rzPlanId !== subscription.razorpayPlanId) {
        // Find which plan this maps to
        const { PLANS } = await import('@/lib/plans');
        const found = Object.values(PLANS).find(p => p.razorpayPlanId === rzPlanId);
        if (found) {
            newPlanType = found.id;
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'ACTIVE',
                planType: newPlanType,
                razorpayPlanId: rzPlanId ?? subscription.razorpayPlanId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                gracePeriodEnd: null,
                tokenUsageReset: new Date(), // conceptual marker
                lastWebhookEventId: eventId,
            },
        });

        const newTokenLimit = getTokenLimit(newPlanType);
        await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: {
                plan: newPlanType,
                tokenLimit: newTokenLimit === -1 ? 9999999 : newTokenLimit,
                tokenUsage: 0, // Reset usage at billing cycle start
            },
        });
    });

    console.log(`[Webhook] 💳 Payment captured for tenant ${subscription.tenantId} — period: ${periodStart.toISOString()} → ${periodEnd?.toISOString()}`);
}

/** subscription.payment_failed → PAST_DUE + grace period */
async function onPaymentFailed(entity, eventId) {
    const subscription = await loadSubscriptionForWebhook(entity?.id, eventId);
    if (!subscription) return;

    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: 'PAST_DUE',
            gracePeriodEnd,
            lastWebhookEventId: eventId,
        },
    });

    console.log(`[Webhook] ⚠️  Payment FAILED for tenant ${subscription.tenantId} — grace until ${gracePeriodEnd.toISOString()}`);
    // TODO: Trigger billing notification email via lib/email.js
}

/** subscription.paused → PAUSED */
async function onSubscriptionPaused(entity, eventId) {
    const subscription = await loadSubscriptionForWebhook(entity?.id, eventId);
    if (!subscription) return;

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: 'PAUSED',
            lastWebhookEventId: eventId,
        },
    });

    console.log(`[Webhook] ⏸  Subscription PAUSED for tenant ${subscription.tenantId}`);
}

/** subscription.cancelled / subscription.completed → CANCELLED + downgrade to FREE */
async function onSubscriptionCancelled(entity, eventId) {
    const subscription = await loadSubscriptionForWebhook(entity?.id, eventId);
    if (!subscription) return;

    await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
                cancelAtPeriodEnd: false,
                cancelledAt: new Date(),
                lastWebhookEventId: eventId,
            },
        });

        // Downgrade tenant to FREE
        await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: {
                plan: 'FREE',
                tokenLimit: getTokenLimit('FREE'),
            },
        });
    });

    console.log(`[Webhook] ❌ Subscription CANCELLED for tenant ${subscription.tenantId} — downgraded to FREE`);
}

/** subscription.resumed → ACTIVE */
async function onSubscriptionResumed(entity, eventId) {
    const subscription = await loadSubscriptionForWebhook(entity?.id, eventId);
    if (!subscription) return;

    const periodEnd = entity.current_end ? new Date(entity.current_end * 1000) : null;

    await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'ACTIVE',
                gracePeriodEnd: null,
                currentPeriodEnd: periodEnd,
                lastWebhookEventId: eventId,
            },
        });

        await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: { plan: subscription.planType },
        });
    });

    console.log(`[Webhook] ▶️  Subscription RESUMED for tenant ${subscription.tenantId}`);
}
