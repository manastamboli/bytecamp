/**
 * app/api/subscriptions/callback/route.js
 *
 * GET /api/subscriptions/callback?razorpay_subscription_id=...&razorpay_payment_id=...
 *
 * Razorpay redirects the user here after checkout completion.
 * We do NOT trust the frontend param; the webhook is the authoritative source.
 * This route simply redirects the user to the dashboard with a status query param.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rzSubId = searchParams.get('razorpay_subscription_id');
    const rzPaymentId = searchParams.get('razorpay_payment_id');

    const redirectUrl = new URL(request.url);

    if (!rzSubId || !rzPaymentId) {
        // Payment not completed — redirect back to dashboard
        redirectUrl.pathname = '/dashboard';
        redirectUrl.search = '?status=cancelled';
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect to dashboard — subscription will be activated by webhook
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = `?subscriptionActivated=true&paymentId=${rzPaymentId}`;
    return NextResponse.redirect(redirectUrl);
}
