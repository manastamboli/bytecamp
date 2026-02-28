import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getPresignedMediaUrl } from '@/lib/aws/s3-publish'

export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params

    // Check if user has access to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId
        }
      }
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            tenantUsers: true,
            sites: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Generate presigned URL for logo if it exists
    let tenantData = { ...tenant }
    if (tenant.logo) {
      try {
        tenantData.logoUrl = await getPresignedMediaUrl(tenant.logo, 3600)
      } catch (error) {
        console.error('Failed to generate presigned URL for tenant logo:', error)
      }
    }

    return NextResponse.json({ tenant: tenantData, userRole: tenantUser.role, isTrueOwner: tenant.ownerId === session.user.id })
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params
    const body = await request.json()

    // Whitelist allowed fields
    const allowedFields = ['name', 'description', 'logo', 'workspaceType', 'defaultMemberRole', 'onboardingComplete', 'brandKit']
    const updates = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    // Check if user is owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant || tenant.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updates
    })

    // Generate presigned URL for logo if it exists
    let tenantData = { ...updatedTenant }
    if (updatedTenant.logo) {
      try {
        tenantData.logoUrl = await getPresignedMediaUrl(updatedTenant.logo, 3600)
      } catch (error) {
        console.error('Failed to generate presigned URL for tenant logo:', error)
      }
    }

    return NextResponse.json({ tenant: tenantData })
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}
