/**
 * API route to update SiteVersion.builderData
 *
 * PATCH /api/site-versions/[versionId]
 * Body: { builderData: object }
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    const { versionId } = await params

    // ── Auth ─────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Validate version exists ──────────────────────────────────────────
    const siteVersion = await prisma.siteVersion.findUnique({
      where: { id: versionId },
      include: { site: { select: { tenantId: true } } },
    })

    if (!siteVersion) {
      return NextResponse.json(
        { error: 'Site version not found' },
        { status: 404 }
      )
    }

    // ── Check user belongs to tenant & has edit rights ────────────────────
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: siteVersion.site.tenantId,
        },
      },
    })

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Forbidden — not a member' },
        { status: 403 }
      )
    }

    if (tenantUser.role !== 'OWNER' && tenantUser.role !== 'EDITOR') {
      return NextResponse.json(
        { error: 'Forbidden — insufficient permissions' },
        { status: 403 }
      )
    }

    // ── Parse body ───────────────────────────────────────────────────────
    const body = await request.json()
    const { builderData } = body

    if (!builderData || typeof builderData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid builderData' },
        { status: 400 }
      )
    }

    // ── Update ───────────────────────────────────────────────────────────
    const updated = await prisma.siteVersion.update({
      where: { id: versionId },
      data: { builderData },
    })

    return NextResponse.json({ success: true, updatedAt: updated.updatedAt })
  } catch (error) {
    console.error('[site-versions PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
