import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

    const forms = await prisma.form.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            versions: true
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

export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params
    const body = await request.json()
    const { name, description } = body

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

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create form with initial draft version
    const form = await prisma.form.create({
      data: {
        name,
        slug,
        description,
        tenantId,
        versions: {
          create: {
            versionNumber: 1,
            status: 'DRAFT',
            builderData: {
              id: crypto.randomUUID(),
              name: name,
              elements: [],
              settings: {
                method: 'POST',
                action: '',
                successMessage: 'Thank you! Your form has been submitted.'
              },
              styles: {
                backgroundColor: '#ffffff',
                maxWidth: 800,
                padding: 32
              }
            }
          }
        }
      },
      include: {
        versions: true
      }
    })

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
