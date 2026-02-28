import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPresignedMediaUrl } from '@/lib/aws/s3-publish'
import { PlanGuard, PlanGuardError, planGuardErrorResponse } from '@/lib/plan-guard'

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, slug, description, logo } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // ── PLAN GUARD: Subscription + business limit check ────────────────────────
    // We need to find the user's best active subscription across all their owned tenants
    const { userId } = { userId: session.user.id }

    const ownedTenantUsers = await prisma.tenantUser.findMany({
      where: { userId, role: 'OWNER' },
      include: { tenant: { include: { subscription: true } } },
    })

    const ownedTenants = ownedTenantUsers.map(tu => tu.tenant)
    const currentBusinessCount = ownedTenants.length

    // Find best subscription
    const STATUS_RANK = { ACTIVE: 4, TRIAL: 3, PAST_DUE: 2, PAUSED: 1, CANCELLED: 0 }
    let bestSubscription = null
    let bestTenant = null
    for (const tenant of ownedTenants) {
      const sub = tenant.subscription
      if (!sub) continue
      const rank = STATUS_RANK[sub.status] ?? -1
      const bestRank = bestSubscription ? (STATUS_RANK[bestSubscription.status] ?? -1) : -1
      if (rank > bestRank) { bestSubscription = sub; bestTenant = tenant }
    }

    // Build guard from best subscription context
    const guard = new PlanGuard(bestSubscription, bestTenant)

    try {
      guard.requirePaidSubscription()
      guard.checkBusinessLimit(currentBusinessCount)
    } catch (err) {
      if (err instanceof PlanGuardError) {
        return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus })
      }
      throw err
    }

    // ── Slug uniqueness ──────────────────────────────────────────────────────
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already exists. Please choose a different one.' },
        { status: 409 }
      )
    }

    // ── Create tenant ────────────────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: {
        id: id || undefined,
        name,
        slug,
        description: description || null,
        logo: logo || null,
        ownerId: session.user.id,
        plan: bestSubscription?.planType ?? 'FREE',
        tokenUsage: 0,
        tokenLimit: 10000
      }
    })

    // Create OWNER membership
    await prisma.tenantUser.create({
      data: {
        userId: session.user.id,
        tenantId: tenant.id,
        role: 'OWNER'
      }
    })

    // Generate presigned URL for logo if present
    let tenantWithLogo = { ...tenant }
    if (tenant.logo) {
      try {
        tenantWithLogo.logoUrl = await getPresignedMediaUrl(tenant.logo, 3600)
      } catch (_) { }
    }

    return NextResponse.json({ tenant: tenantWithLogo }, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: session.user.id },
      include: {
        tenant: {
          include: {
            subscription: { select: { planType: true, status: true, currentPeriodEnd: true } },
            _count: { select: { tenantUsers: true, sites: true } }
          }
        }
      }
    })

    const tenants = await Promise.all(
      tenantUsers.map(async (tu) => {
        const tenant = { ...tu.tenant, userRole: tu.role }
        if (tenant.logo) {
          try {
            tenant.logoUrl = await getPresignedMediaUrl(tenant.logo, 3600)
          } catch (_) { }
        }
        return tenant
      })
    )

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
