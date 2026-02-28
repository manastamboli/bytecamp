/**
 * lib/plans.js
 *
 * Central plan configuration for SitePilot.
 * This is the SINGLE SOURCE OF TRUTH for plan limits and features.
 * Backend guards and frontend UI both import from here.
 *
 * Plans sync with Razorpay plan IDs via RAZORPAY_PLAN_<PLAN> env vars.
 */

/** @typedef {'FREE'|'STARTER'|'PRO'|'ENTERPRISE'} PlanType */
/** @typedef {'TRIAL'|'ACTIVE'|'PAST_DUE'|'CANCELLED'|'PAUSED'} SubscriptionStatus */

/**
 * Grace period in days after a payment failure before hard restrictions kick in.
 */
export const GRACE_PERIOD_DAYS = 3;

/**
 * Plan hierarchy for upgrade/downgrade comparison.
 * Higher index = higher tier.
 */
export const PLAN_HIERARCHY = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

/**
 * Master plan configuration.
 * All limits of -1 mean "unlimited".
 */
export const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Free',
        displayName: 'Free',
        description: 'Get started with the basics.',
        price: 0,
        currency: 'INR',
        billingCycle: 'monthly',
        // Razorpay plan ID — set to null for FREE (no billing)
        razorpayPlanId: null,

        limits: {
            businesses: 1,              // FREE: 1 workspace allowed for free
            sites: 1,                   // Max sites per business
            pagesPerSite: 1,            // Max pages per site
            deploymentsPerMonth: 3,     // Max deployments per month
            tokenLimit: 5000,           // AI token limit per billing cycle
            analyticsRetentionDays: 7,  // How far back analytics go
            teamMembers: 1,             // Max team members
            storageGB: 0.1,             // Storage in GB
        },

        features: {
            customDomains: false,
            multiPage: false,
            analytics: true,            // Basic analytics only
            prioritySupport: false,
            whiteLabel: false,
            apiAccess: false,
            premiumComponents: false,
        },
    },

    STARTER: {
        id: 'STARTER',
        name: 'Starter',
        displayName: 'Starter',
        description: 'Essential features for growing businesses.',
        price: 199,     // INR per month
        currency: 'INR',
        billingCycle: 'monthly',
        razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER || null,

        limits: {
            businesses: 3,              // Max businesses (workspaces) owned
            sites: 3,                   // Max sites per business
            pagesPerSite: 5,
            deploymentsPerMonth: 20,
            tokenLimit: 50000,
            analyticsRetentionDays: 30,
            teamMembers: 5,
            storageGB: 5,
        },

        features: {
            customDomains: true,
            multiPage: true,
            analytics: true,
            prioritySupport: false,
            whiteLabel: false,
            apiAccess: false,
            premiumComponents: false,
        },
    },

    PRO: {
        id: 'PRO',
        name: 'Pro',
        displayName: 'Pro',
        description: 'Advanced tools for professional teams.',
        price: 399,     // INR per month
        currency: 'INR',
        billingCycle: 'monthly',
        razorpayPlanId: process.env.RAZORPAY_PLAN_PRO || null,

        limits: {
            businesses: 10,             // Max businesses owned
            sites: 10,                  // Max sites per business
            pagesPerSite: -1,           // unlimited
            deploymentsPerMonth: -1,    // unlimited
            tokenLimit: 200000,
            analyticsRetentionDays: 180,
            teamMembers: 25,
            storageGB: 50,
        },

        features: {
            customDomains: true,
            multiPage: true,
            analytics: true,
            prioritySupport: true,
            whiteLabel: false,
            apiAccess: true,
            premiumComponents: true,
        },
    },

    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        displayName: 'Enterprise',
        description: 'Uncapped infrastructure for large organisations.',
        price: 699,     // INR per month
        currency: 'INR',
        billingCycle: 'annual',
        razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE || null,

        limits: {
            businesses: -1,             // Unlimited businesses
            sites: -1,                  // Unlimited sites per business
            pagesPerSite: -1,
            deploymentsPerMonth: -1,
            tokenLimit: -1,             // custom / negotiated
            analyticsRetentionDays: 365,
            teamMembers: -1,
            storageGB: -1,
        },

        features: {
            customDomains: true,
            multiPage: true,
            analytics: true,
            prioritySupport: true,
            whiteLabel: true,
            apiAccess: true,
            premiumComponents: true,
        },
    },
};

/**
 * Get the config for a specific plan.
 * @param {PlanType} planType
 */
export function getPlanConfig(planType) {
    return PLANS[planType] ?? PLANS.FREE;
}

/**
 * Get the token limit for a plan.
 * Returns -1 for unlimited.
 * @param {PlanType} planType
 */
export function getTokenLimit(planType) {
    return getPlanConfig(planType).limits.tokenLimit;
}

/**
 * Get the business (tenant) limit for a plan.
 * Returns -1 for unlimited, 0 for no creation allowed (FREE).
 * @param {PlanType} planType
 */
export function getBusinessLimit(planType) {
    return getPlanConfig(planType).limits.businesses ?? 0;
}

/**
 * Check if planA is higher than planB.
 * @param {PlanType} planA
 * @param {PlanType} planB
 * @returns {boolean}
 */
export function isPlanHigher(planA, planB) {
    return PLAN_HIERARCHY.indexOf(planA) > PLAN_HIERARCHY.indexOf(planB);
}

/**
 * Determine if an upgrade is happening (vs. downgrade or same).
 * @param {PlanType} current
 * @param {PlanType} target
 * @returns {'upgrade'|'downgrade'|'same'}
 */
export function getPlanChangeType(current, target) {
    const diff = PLAN_HIERARCHY.indexOf(target) - PLAN_HIERARCHY.indexOf(current);
    if (diff > 0) return 'upgrade';
    if (diff < 0) return 'downgrade';
    return 'same';
}

/**
 * Returns an ordered array of plan configs for the pricing page.
 */
export function getPricingPlans() {
    return ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map((key) => PLANS[key]);
}
