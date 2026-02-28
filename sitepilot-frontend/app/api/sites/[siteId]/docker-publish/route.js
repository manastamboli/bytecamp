import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import DeploymentService from '@/lib/deploy/DeploymentService'

export const runtime = 'nodejs'

const deploymentService = new DeploymentService(prisma)

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sites/[siteId]/docker-publish
//
// Generates an isolated Docker backend for the site and runs it.
//
// Body (JSON — all optional):
//   tables:  Array<{ name, columns: Array<{ name, type, constraints? }> }>
//   routes:  Array<{ method, path, table, action }>
//
// If omitted, sensible defaults (contacts CRUD) are generated.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params

    // ── Verify site exists and user has OWNER or EDITOR role ──────────────
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true, name: true, slug: true },
    })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    })
    if (!membership || membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Parse optional body ───────────────────────────────────────────────
    let tables = null
    let routes = null
    try {
      const body = await request.json()
      tables = body?.tables || null
      routes = body?.routes || null
    } catch {
      // Body is optional — defaults will be used
    }

    // ── Deploy (or redeploy) ──────────────────────────────────────────────
    const deployment = await deploymentService.deploy({
      siteId,
      tables,
      routes,
    })

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        status: deployment.status,
        backendPort: deployment.backendPort,
        dbPort: deployment.dbPort,
        backendUrl: `http://localhost:${deployment.backendPort}`,
        healthUrl: `http://localhost:${deployment.backendPort}/health`,
      },
      message: `Backend deployed on port ${deployment.backendPort}`,
    })
  } catch (error) {
    console.error('[docker-publish] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to deploy backend' },
      { status: 500 },
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sites/[siteId]/docker-publish
//
// Returns the current Docker deployment status for this site.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true },
    })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const status = await deploymentService.getStatus(siteId)

    if (!status) {
      return NextResponse.json({ deployed: false })
    }

    return NextResponse.json({
      deployed: true,
      deployment: {
        id: status.id,
        status: status.status,
        containerStatus: status.containerStatus,
        backendPort: status.backendPort,
        dbPort: status.dbPort,
        backendUrl: status.backendUrl,
        healthUrl: `${status.backendUrl}/health`,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt,
      },
    })
  } catch (error) {
    console.error('[docker-publish] GET Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch deployment status' },
      { status: 500 },
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sites/[siteId]/docker-publish
//
// Stops and destroys the Docker deployment for this site.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true },
    })
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    })
    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only OWNER can destroy deployments' }, { status: 403 })
    }

    await deploymentService.destroy(siteId)

    return NextResponse.json({ success: true, message: 'Deployment destroyed' })
  } catch (error) {
    console.error('[docker-publish] DELETE Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to destroy deployment' },
      { status: 500 },
    )
  }
}
