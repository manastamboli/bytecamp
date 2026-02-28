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

    const members = await prisma.tenantUser.findMany({
      where: {
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
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
    const { email, role = 'EDITOR' } = await request.json()

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant || tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the real workspace owner can add members' },
        { status: 403 }
      )
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    })

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: userToAdd.id,
          tenantId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 409 }
      )
    }

    // Add member
    const newMember = await prisma.tenantUser.create({
      data: {
        userId: userToAdd.id,
        tenantId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params
    const { searchParams } = new URL(request.url)
    const memberUserId = searchParams.get('userId')

    if (!memberUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if requesting user is the real owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant || tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the real workspace owner can remove members' },
        { status: 403 }
      )
    }

    if (tenant.ownerId === memberUserId) {
      return NextResponse.json(
        { error: 'Cannot remove the owner' },
        { status: 400 }
      )
    }

    // Remove member
    await prisma.tenantUser.delete({
      where: {
        userId_tenantId: {
          userId: memberUserId,
          tenantId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
