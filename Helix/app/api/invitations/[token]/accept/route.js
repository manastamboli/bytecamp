import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const { token } = await params
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return NextResponse.redirect(new URL('/dashboard?error=invitation-not-found', appUrl))
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.redirect(new URL('/dashboard?error=invitation-already-processed', appUrl))
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.redirect(new URL('/dashboard?error=invitation-expired', appUrl))
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      // User not logged in — check if they're registered
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email }
      })

      if (existingUser) {
        // Registered → redirect to signin with redirect back here
        return NextResponse.redirect(
          new URL(`/signin?redirect=/api/invitations/${token}/accept`, appUrl)
        )
      } else {
        // Not registered → redirect to signup with email prefilled
        return NextResponse.redirect(
          new URL(`/signup?redirect=/api/invitations/${token}/accept&email=${encodeURIComponent(invitation.email)}`, appUrl)
        )
      }
    }

    // User is authenticated — validate email match
    if (invitation.email !== session.user.email) {
      return NextResponse.redirect(new URL('/dashboard?error=email-mismatch', appUrl))
    }

    // Check email verification
    if (!session.user.emailVerified) {
      return NextResponse.redirect(
        new URL(`/verify-email?redirect=/api/invitations/${token}/accept`, appUrl)
      )
    }

    // Check if already a member
    const existingMember = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: invitation.tenantId
        }
      }
    })

    if (existingMember) {
      // Already a member — just mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })
      return NextResponse.redirect(new URL('/dashboard', appUrl))
    }

    // Add user to tenant and update invitation status
    await prisma.$transaction([
      prisma.tenantUser.create({
        data: {
          userId: session.user.id,
          tenantId: invitation.tenantId,
          role: invitation.role
        }
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })
    ])

    return NextResponse.redirect(new URL('/dashboard', appUrl))
  } catch (error) {
    console.error('Error accepting invitation:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/dashboard?error=accept-failed', appUrl))
  }
}
