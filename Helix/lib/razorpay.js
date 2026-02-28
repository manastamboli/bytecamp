/**
 * lib/razorpay.js
 *
 * Razorpay Service Layer for SitePilot.
 *
 * ⚠️  This file only STRUCTURES the service calls; it does NOT execute any
 *     Razorpay API calls at import time.  All functions must be explicitly
 *     invoked by API routes or webhook handlers.
 *
 * Requires env vars:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

// ─── Client singleton ─────────────────────────────────────────────────────────

let _client = null;

/**
 * Returns the Razorpay client singleton.
 * Throws clearly if env vars are missing.
 */
export function getRazorpayClient() {
    if (_client) return _client;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error(
            '[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables.'
        );
    }

    _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return _client;
}

// ─── Customer Management ──────────────────────────────────────────────────────

/**
 * Create a Razorpay customer for a tenant owner.
 *
 * @param {{ name: string, email: string, contact?: string }} customerData
 * @returns {Promise<{ id: string, name: string, email: string }>}
 */
export async function createRazorpayCustomer({ name, email, contact }) {
    const rz = getRazorpayClient();
    const customer = await rz.customers.create({
        name,
        email,
        contact: contact ?? '',
        fail_existing: '0', // Return existing customer if email already exists
    });
    return customer;
}

/**
 * Fetch an existing Razorpay customer by ID.
 *
 * @param {string} customerId
 */
export async function getRazorpayCustomer(customerId) {
    const rz = getRazorpayClient();
    return rz.customers.fetch(customerId);
}

// ─── Subscription Management ──────────────────────────────────────────────────

/**
 * Create a new Razorpay Subscription.
 *
 * @param {{
 *   planId: string,          // Razorpay plan ID (e.g. "plan_XXXX")
 *   customerId: string,       // Razorpay customer ID
 *   totalCount?: number,      // Billing cycles (omit for recurring)
 *   quantity?: number,
 *   startAt?: number,         // Unix timestamp for deferred start
 *   notifyInfo?: object,
 *   addons?: Array<{ item: { name: string, amount: number, currency: string } }>
 * }} options
 * @returns {Promise<object>} Razorpay Subscription object
 */
export async function createRazorpaySubscription({
    planId,
    customerId,
    totalCount = 12,
    quantity = 1,
    startAt,
    notifyInfo,
    addons,
}) {
    const rz = getRazorpayClient();

    const payload = {
        plan_id: planId,
        customer_id: customerId,
        total_count: totalCount,
        quantity,
        ...(startAt && { start_at: startAt }),
        ...(notifyInfo && { notify_info: notifyInfo }),
        ...(addons && { addons }),
    };

    const subscription = await rz.subscriptions.create(payload);
    return subscription;
}

/**
 * Fetch a Razorpay Subscription by ID.
 *
 * @param {string} subscriptionId
 */
export async function getRazorpaySubscription(subscriptionId) {
    const rz = getRazorpayClient();
    return rz.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel a Razorpay Subscription.
 *
 * @param {string} subscriptionId
 * @param {boolean} cancelAtCycleEnd  If true, cancel at end of current billing cycle
 */
export async function cancelRazorpaySubscription(subscriptionId, cancelAtCycleEnd = true) {
    const rz = getRazorpayClient();
    return rz.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

/**
 * Pause a Razorpay Subscription.
 *
 * @param {string} subscriptionId
 * @param {'now'} [pauseAt] - when to pause
 */
export async function pauseRazorpaySubscription(subscriptionId, pauseAt = 'now') {
    const rz = getRazorpayClient();
    return rz.subscriptions.pause(subscriptionId, { pause_at: pauseAt });
}

/**
 * Resume a paused Razorpay Subscription.
 *
 * @param {string} subscriptionId
 * @param {'now'} [resumeAt]
 */
export async function resumeRazorpaySubscription(subscriptionId, resumeAt = 'now') {
    const rz = getRazorpayClient();
    return rz.subscriptions.resume(subscriptionId, { resume_at: resumeAt });
}

/**
 * Update the plan of an existing Razorpay Subscription (upgrade/downgrade).
 *
 * @param {string} subscriptionId
 * @param {string} newPlanId
 * @returns {Promise<object>}
 */
export async function updateRazorpaySubscriptionPlan(subscriptionId, newPlanId) {
    const rz = getRazorpayClient();
    return rz.subscriptions.update(subscriptionId, {
        plan_id: newPlanId,
    });
}

// ─── Checkout URL Builder ─────────────────────────────────────────────────────

/**
 * Builds the Razorpay hosted checkout URL for a subscription.
 * Razorpay redirects users to this URL to complete payment.
 *
 * @param {{ subscriptionId: string, keyId: string }} params
 * @returns {string}
 */
export function buildCheckoutUrl({ subscriptionId, keyId }) {
    // Standard Razorpay hosted checkout endpoint
    return `https://rzp.io/l/${subscriptionId}`;
}

/**
 * Build parameters for the Razorpay checkout JS SDK (embedded mode).
 *
 * @param {{
 *   subscriptionId: string,
 *   name: string,
 *   description: string,
 *   prefillEmail: string,
 *   prefillName: string,
 *   prefillContact?: string,
 *   callbackUrl: string,
 * }} options
 */
export function buildCheckoutOptions({
    subscriptionId,
    name,
    description,
    prefillEmail,
    prefillName,
    prefillContact,
    callbackUrl,
}) {
    return {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name,
        description,
        prefill: {
            name: prefillName,
            email: prefillEmail,
            contact: prefillContact ?? '',
        },
        callback_url: callbackUrl,
        redirect: true,
    };
}

// ─── Webhook Verification ─────────────────────────────────────────────────────

/**
 * Verify the Razorpay webhook signature.
 *
 * @param {string} rawBody    The raw request body as a string
 * @param {string} signature  The X-Razorpay-Signature header value
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('[Razorpay] Missing RAZORPAY_WEBHOOK_SECRET environment variable.');
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
    );
}

// ─── Plan Sync ────────────────────────────────────────────────────────────────

/**
 * Fetch all plans from Razorpay and return them keyed by interval.
 * Use this to sync Razorpay plans with internal PLANS config.
 * (Call manually from a seed/admin script — not at runtime.)
 *
 * @returns {Promise<Array>}
 */
export async function listRazorpayPlans() {
    const rz = getRazorpayClient();
    const { items } = await rz.plans.all({ count: 100 });
    return items;
}
