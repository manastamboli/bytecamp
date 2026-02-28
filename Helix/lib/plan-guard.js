/**
 * lib/plan-guard.js
 *
 * Central Plan Guard — enforces subscription-based feature restrictions.
 *
 * Usage (in any API route):
 *
 *   import { PlanGuard } from '@/lib/plan-guard'
 *   const guard = new PlanGuard(subscription, tenant)
 *   guard.requireActive()               // throws if not active / past grace
 *   guard.checkSiteLimit(currentCount)  // throws if over site limit
 *   guard.checkFeature('customDomains') // throws if feature not in plan
 *
 * All methods return `this` for chaining where applicable.
 * Throwing methods throw a PlanGuardError with a machine-readable code.
 */

import { getPlanConfig, GRACE_PERIOD_DAYS } from './plans.js';
import { getBusinessLimit } from './plans.js';

// ─── Error class ──────────────────────────────────────────────────────────────

export class PlanGuardError extends Error {
    /**
     * @param {string} message  Human-readable message
     * @param {string} code     Machine-readable code for the UI to act on
     * @param {number} [httpStatus]
     */
    constructor(message, code, httpStatus = 403) {
        super(message);
        this.name = 'PlanGuardError';
        this.code = code;
        this.httpStatus = httpStatus;
    }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Convert a PlanGuardError into a { error, code, upgrade } JSON payload
 * suitable for NextResponse.json().
 */
export function planGuardErrorResponse(err) {
    return {
        error: err.message,
        code: err.code,
        upgrade: true,
    };
}

// ─── Guard class ──────────────────────────────────────────────────────────────

export class PlanGuard {
    /**
     * @param {import('@prisma/client').Subscription | null} subscription
     * @param {import('@prisma/client').Tenant} tenant
     */
    constructor(subscription, tenant) {
        this.subscription = subscription;
        this.tenant = tenant;

        // Effective plan: derive from subscription if present, else tenant.plan
        this.planType = subscription?.planType ?? tenant?.plan ?? 'FREE';
        this.planConfig = getPlanConfig(this.planType);
        this.status = subscription?.status ?? 'ACTIVE'; // FREE tenants with no sub = ACTIVE
    }

    // ── Status checks ────────────────────────────────────────────────────────

    /**
     * Returns true if the subscription is functionally active.
     * Includes ACTIVE, TRIAL, and PAST_DUE within grace period.
     */
    get isActive() {
        if (!this.subscription) {
            // FREE plan without a subscription record → always active
            return this.planType === 'FREE';
        }

        const { status, gracePeriodEnd } = this.subscription;

        if (status === 'ACTIVE' || status === 'TRIAL') return true;

        if (status === 'PAST_DUE') {
            // Check if still within grace period
            if (gracePeriodEnd && new Date() < new Date(gracePeriodEnd)) {
                return true;
            }
            return false;
        }

        return false; // CANCELLED, PAUSED
    }

    get isPastDue() {
        return this.subscription?.status === 'PAST_DUE';
    }

    get isInGracePeriod() {
        if (!this.isPastDue) return false;
        const { gracePeriodEnd } = this.subscription;
        return gracePeriodEnd && new Date() < new Date(gracePeriodEnd);
    }

    get isCancelled() {
        return this.subscription?.status === 'CANCELLED';
    }

    get isPaused() {
        return this.subscription?.status === 'PAUSED';
    }

    // ── Requirement guards (throw on failure) ────────────────────────────────

    /**
     * Throw PlanGuardError if the tenant does not have an active subscription.
     * Call this at the top of any protected API route.
     */
    requireActive() {
        if (!this.isActive) {
            if (this.isPastDue) {
                throw new PlanGuardError(
                    'Your subscription payment is past due. Please update your payment method.',
                    'PAST_DUE',
                    402
                );
            }
            if (this.isCancelled) {
                throw new PlanGuardError(
                    'Your subscription has been cancelled. Please resubscribe to continue.',
                    'SUBSCRIPTION_CANCELLED',
                    402
                );
            }
            if (this.isPaused) {
                throw new PlanGuardError(
                    'Your subscription is currently paused.',
                    'SUBSCRIPTION_PAUSED',
                    402
                );
            }
            throw new PlanGuardError(
                'Your subscription is not active.',
                'SUBSCRIPTION_INACTIVE',
                402
            );
        }
        return this;
    }

    /**
     * Require a paid subscription (block FREE plan users from creating resources).
     * FREE plan has businesses:0 — user must subscribe before creating any business.
     */
    requirePaidSubscription() {
        const businessLimit = getBusinessLimit(this.planType);
        if (businessLimit === 0) {
            throw new PlanGuardError(
                'You need an active subscription to create workspaces. Please choose a plan to get started.',
                'SUBSCRIPTION_REQUIRED',
                403
            );
        }
        return this.requireActive();
    }

    /**
     * Throw PlanGuardError if a site limit would be exceeded.
     * @param {number} currentSiteCount  Current number of sites for the tenant
     */
    checkSiteLimit(currentSiteCount) {
        const limit = this.planConfig.limits.sites;
        if (limit !== -1 && currentSiteCount >= limit) {
            throw new PlanGuardError(
                `Your ${this.planConfig.displayName} plan allows up to ${limit} site${limit === 1 ? '' : 's'} per workspace. Please upgrade to add more.`,
                'SITE_LIMIT_EXCEEDED',
                403
            );
        }
        return this;
    }

    /**
     * Throw PlanGuardError if the business (tenant) limit would be exceeded.
     * @param {number} currentBusinessCount  Number of businesses/workspaces user currently owns
     */
    checkBusinessLimit(currentBusinessCount) {
        const limit = getBusinessLimit(this.planType);
        if (limit === 0) {
            throw new PlanGuardError(
                'You need an active subscription to create workspaces. Please choose a plan.',
                'SUBSCRIPTION_REQUIRED',
                403
            );
        }
        if (limit !== -1 && currentBusinessCount >= limit) {
            throw new PlanGuardError(
                `Your ${this.planConfig.displayName} plan allows up to ${limit} workspace${limit === 1 ? '' : 's'}. Please upgrade to create more.`,
                'BUSINESS_LIMIT_EXCEEDED',
                403
            );
        }
        return this;
    }

    /**
     * Throw PlanGuardError if the page-per-site limit would be exceeded.
     * @param {number} currentPageCount
     */
    checkPageLimit(currentPageCount) {
        const limit = this.planConfig.limits.pagesPerSite;
        if (limit !== -1 && currentPageCount >= limit) {
            throw new PlanGuardError(
                `Your ${this.planConfig.displayName} plan allows up to ${limit} page${limit === 1 ? '' : 's'} per site. Please upgrade to add more.`,
                'PAGE_LIMIT_EXCEEDED',
                403
            );
        }
        return this;
    }

    /**
     * Throw PlanGuardError if a deployment limit (monthly) would be exceeded.
     * Pass in the count of deployments this billing cycle.
     * @param {number} deploymentsThisCycle
     */
    checkDeploymentLimit(deploymentsThisCycle) {
        const limit = this.planConfig.limits.deploymentsPerMonth;
        if (limit !== -1 && deploymentsThisCycle >= limit) {
            throw new PlanGuardError(
                `Your ${this.planConfig.displayName} plan allows up to ${limit} deployments per month. Please upgrade for unlimited deployments.`,
                'DEPLOYMENT_LIMIT_EXCEEDED',
                403
            );
        }
        return this;
    }

    /**
     * Throw PlanGuardError if a token usage limit would be exceeded.
     * @param {number} currentTokenUsage
     * @param {number} tokensRequested
     */
    checkTokenLimit(currentTokenUsage, tokensRequested = 0) {
        const limit = this.planConfig.limits.tokenLimit;
        if (limit !== -1 && currentTokenUsage + tokensRequested > limit) {
            throw new PlanGuardError(
                `You have reached the AI token limit for your ${this.planConfig.displayName} plan (${limit.toLocaleString()} tokens). Please upgrade to continue.`,
                'TOKEN_LIMIT_EXCEEDED',
                403
            );
        }
        return this;
    }

    /**
     * Throw PlanGuardError if a specific feature is not available on the plan.
     * @param {'customDomains'|'multiPage'|'analytics'|'prioritySupport'|'whiteLabel'|'apiAccess'|'premiumComponents'} featureKey
     */
    checkFeature(featureKey) {
        if (!this.planConfig.features[featureKey]) {
            throw new PlanGuardError(
                `The "${featureKey}" feature is not available on your ${this.planConfig.displayName} plan. Please upgrade.`,
                'FEATURE_NOT_AVAILABLE',
                403
            );
        }
        return this;
    }

    // ── Soft checks (return boolean, don't throw) ────────────────────────────

    /** @param {string} featureKey */
    hasFeature(featureKey) {
        return !!this.planConfig.features[featureKey];
    }

    canAddSite(currentSiteCount) {
        const limit = this.planConfig.limits.sites;
        return limit === -1 || currentSiteCount < limit;
    }

    canCreateBusiness(currentBusinessCount) {
        const limit = getBusinessLimit(this.planType);
        if (limit === 0) return false;
        return limit === -1 || currentBusinessCount < limit;
    }

    canAddPage(currentPageCount) {
        const limit = this.planConfig.limits.pagesPerSite;
        return limit === -1 || currentPageCount < limit;
    }

    canDeploy(deploymentsThisCycle) {
        const limit = this.planConfig.limits.deploymentsPerMonth;
        return limit === -1 || deploymentsThisCycle < limit;
    }

    canUseTokens(currentUsage, requested) {
        const limit = this.planConfig.limits.tokenLimit;
        return limit === -1 || currentUsage + requested <= limit;
    }

    // ── Usage summary (for dashboard display) ────────────────────────────────

    /**
     * Returns a usage summary object for rendering in the dashboard.
     */
    getUsageSummary(currentSiteCount, currentTokenUsage, deploymentsThisCycle) {
        const limits = this.planConfig.limits;
        return {
            plan: this.planType,
            planDisplayName: this.planConfig.displayName,
            status: this.status,
            isActive: this.isActive,
            isPastDue: this.isPastDue,
            isInGracePeriod: this.isInGracePeriod,
            currentPeriodEnd: this.subscription?.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: this.subscription?.cancelAtPeriodEnd ?? false,

            sites: {
                used: currentSiteCount,
                limit: limits.sites,
                unlimited: limits.sites === -1,
                percent: limits.sites === -1 ? 0 : Math.min(100, Math.round((currentSiteCount / limits.sites) * 100)),
            },
            tokens: {
                used: currentTokenUsage,
                limit: limits.tokenLimit,
                unlimited: limits.tokenLimit === -1,
                percent: limits.tokenLimit === -1 ? 0 : Math.min(100, Math.round((currentTokenUsage / limits.tokenLimit) * 100)),
            },
            deployments: {
                used: deploymentsThisCycle,
                limit: limits.deploymentsPerMonth,
                unlimited: limits.deploymentsPerMonth === -1,
                percent: limits.deploymentsPerMonth === -1 ? 0 : Math.min(100, Math.round((deploymentsThisCycle / limits.deploymentsPerMonth) * 100)),
            },
            features: this.planConfig.features,
        };
    }
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Load a PlanGuard for a tenant from DB (convenience function for API routes).
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} tenantId
 * @returns {Promise<PlanGuard>}
 */
export async function getPlanGuard(prisma, tenantId) {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { subscription: true },
    });

    if (!tenant) {
        throw new PlanGuardError('Tenant not found', 'TENANT_NOT_FOUND', 404);
    }

    return new PlanGuard(tenant.subscription, tenant);
}
