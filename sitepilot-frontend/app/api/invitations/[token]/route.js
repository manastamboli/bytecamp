import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const { token } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            logo: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      )
    }

    if (new Date() > invitation.expiresAt) {
      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
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

    const { token } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      )
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation email matches user's email
    if (invitation.email !== session.user.email) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      )
    }

    // Check if user email is verified (only add members who are verified)
    if (!session.user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before accepting invitations' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: invitation.tenantId
        }
      }
    })

    if (existingMember) {
      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      return NextResponse.json({
        message: 'You are already a member of this workspace',
        tenantId: invitation.tenantId
      })
    }

    // Add user to tenant
    await prisma.tenantUser.create({
      data: {
        userId: session.user.id,
        tenantId: invitation.tenantId,
        role: invitation.role
      }
    })

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })

    return NextResponse.json({ 
      message: 'Invitation accepted successfully',
      tenantId: invitation.tenantId
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
