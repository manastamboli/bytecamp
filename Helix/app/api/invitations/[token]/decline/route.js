import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { token } = await params
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const invitation = await prisma.invitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return NextResponse.redirect(new URL('/dashboard?error=invitation-not-found', appUrl))
    }

    if (invitation.status === 'PENDING') {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'CANCELLED' }
      })
    }

    // Return a simple HTML page confirming the decline
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Invitation Declined</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
            .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            h2 { color: #111827; margin-bottom: 8px; }
            p { color: #6b7280; margin-bottom: 24px; }
            a { display: inline-block; padding: 10px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
            a:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Invitation Declined</h2>
            <p>You have declined the invitation. No action has been taken.</p>
            <a href="${appUrl}">Go to DevAlly</a>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Error declining invitation:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/dashboard', appUrl))
  }
}
