import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET /api/sites/[siteId]/forms - List all forms for a site
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params

    // Get site and verify access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { tenant: true }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if user has access to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: site.tenantId
        }
      }
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch forms for this site
    const forms = await prisma.form.findMany({
      where: { siteId },
      include: {
        _count: {
          select: {
            versions: true,
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

// POST /api/sites/[siteId]/forms - Create a new form
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Form name is required' },
        { status: 400 }
      )
    }

    // Get site and verify access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { tenant: true }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if user has access to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: site.tenantId
        }
      }
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Ensure unique slug for this site
    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await prisma.form.findFirst({
        where: {
          siteId,
          slug
        }
      })
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create form with initial version
    const form = await prisma.form.create({
      data: {
        name,
        slug,
        description,
        siteId,
        schema: [],
        settings: {
          method: 'POST',
          action: '',
          successMessage: 'Thank you! Your form has been submitted.',
          redirectUrl: '',
          emailNotifications: false
        },
        versions: {
          create: {
            versionNumber: 1,
            schema: [],
            settings: {
              method: 'POST',
              action: '',
              successMessage: 'Thank you! Your form has been submitted.'
            },
            name: 'Initial version'
          }
        }
      },
      include: {
        versions: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
