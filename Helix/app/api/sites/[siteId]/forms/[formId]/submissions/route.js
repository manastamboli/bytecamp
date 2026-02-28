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

// GET /api/sites/[siteId]/forms/[formId]/submissions - Get all submissions for a form
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

    // Verify form belongs to this site
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        siteId
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Fetch submissions
    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.formSubmission.count({
        where: { formId }
      })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// DELETE /api/sites/[siteId]/forms/[formId]/submissions - Delete a submission
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
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        siteId
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get submission ID from request body
    const body = await request.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
    }

    // Delete the specific submission
    await prisma.formSubmission.delete({
      where: {
        id: submissionId,
        formId // Ensure it belongs to this form
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
