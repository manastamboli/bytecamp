import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Helper to verify site access
async function verifySiteAccess(siteId, userId) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { tenant: true }
  })

  if (!site) return { site: null, hasAccess: false }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId: site.tenantId
      }
    }
  })

  return { site, hasAccess: !!tenantUser }
}

// GET /api/sites/[siteId]/forms/[formId] - Get a single form
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId, formId } = await params

    const { hasAccess } = await verifySiteAccess(siteId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        siteId
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

// PUT /api/sites/[siteId]/forms/[formId] - Update a form
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId, formId } = await params
    const body = await request.json()
    const { name, description, schema, settings } = body

    const { hasAccess } = await verifySiteAccess(siteId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify form belongs to this site
    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        siteId
      }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Update form
    const form = await prisma.form.update({
      where: { id: formId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(schema !== undefined && { schema }),
        ...(settings !== undefined && { settings })
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

// DELETE /api/sites/[siteId]/forms/[formId] - Delete a form
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId, formId } = await params

    const { hasAccess } = await verifySiteAccess(siteId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify form belongs to this site
    const existingForm = await prisma.form.findFirst({
      where: {
        id: formId,
        siteId
      }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete form (cascade will delete versions and submissions)
    await prisma.form.delete({
      where: { id: formId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
