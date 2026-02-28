import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendInvitationEmail } from '@/lib/email'

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
      where: { id: tenantId },
      select: { name: true, ownerId: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the real workspace owner can invite members' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    })

    if (userToInvite) {
      const existingMember = await prisma.tenantUser.findUnique({
        where: {
          userId_tenantId: {
            userId: userToInvite.id,
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
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId
        }
      }
    })

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 409 }
      )
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        tenantId,
        invitedBy: session.user.id,
        expiresAt,
        status: 'PENDING'
      }
    })

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/api/invitations/${invitation.token}/accept`
    const declineUrl = `${baseUrl}/api/invitations/${invitation.token}/decline`
    const emailSent = await sendInvitationEmail({
      to: email,
      tenantName: tenant.name,
      role,
      acceptUrl,
      declineUrl,
    })

    return NextResponse.json({
      message: emailSent ? 'Invitation sent successfully' : 'Invitation created (email not configured)',
      invitationUrl: !emailSent ? acceptUrl : undefined,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerId: true }
    })

    if (!tenant || tenant.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden. Only real workspace owners can view invitations' }, { status: 403 })
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
