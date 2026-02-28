import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId, formId } = await params
    const body = await request.json()
    const { builderData, status, name, description } = body

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

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })

    if (!form || form.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Check if we're updating existing draft or creating new version
    const draftVersion = form.versions.find(v => v.status === 'DRAFT')

    let version
    if (draftVersion) {
      // Update existing draft
      version = await prisma.formVersion.update({
        where: { id: draftVersion.id },
        data: {
          builderData,
          name,
          description,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new version
      const latestVersion = form.versions[0]
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

      version = await prisma.formVersion.create({
        data: {
          formId,
          versionNumber: nextVersionNumber,
          status: status || 'DRAFT',
          builderData,
          name,
          description,
          publishedAt: status === 'PUBLISHED' ? new Date() : null
        }
      })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Error saving form version:', error)
    return NextResponse.json(
      { error: 'Failed to save form version' },
      { status: 500 }
    )
  }
}
