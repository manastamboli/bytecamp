import { Liveblocks } from '@liveblocks/node'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getCursorColor } from '@/liveblocks.config'

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
})

/**
 * POST /api/liveblocks-auth
 *
 * Authenticates a user for a specific Liveblocks room.
 *
 * Body: { roomId: string }
 *   roomId format: "tenant:{tenantId}:site:{siteId}:page:{pageId}"
 *
 * Security:
 *  - Validates Better Auth session
 *  - Checks user belongs to the tenant
 *  - Checks role is OWNER or EDITOR
 *  - Validates Page belongs to Site and Site belongs to Tenant
 */
export async function POST(request) {
  try {
    // ── 1. Authenticate session via Better Auth ──────────────────────────
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return Response.json(
        { error: 'Unauthorized — no valid session' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userName = session.user.name || session.user.email
    const userAvatar = session.user.image || null

    // ── 2. Parse and validate room ID ────────────────────────────────────
    const body = await request.json()
    // Liveblocks client sends { room: "..." } in the POST body
    const roomId = body.room

    if (!roomId || typeof roomId !== 'string') {
      return Response.json(
        { error: 'Missing or invalid room' },
        { status: 400 }
      )
    }

    // Room ID format: tenant:{tenantId}:site:{siteId}:page:{pageId}
    const parts = roomId.split(':')
    if (
      parts.length !== 6 ||
      parts[0] !== 'tenant' ||
      parts[2] !== 'site' ||
      parts[4] !== 'page'
    ) {
      return Response.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      )
    }

    const tenantId = parts[1]
    const siteId = parts[3]
    const pageId = parts[5]

    // ── 3. Check user belongs to tenant ──────────────────────────────────
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    })

    if (!tenantUser) {
      return Response.json(
        { error: 'Forbidden — you are not a member of this workspace' },
        { status: 403 }
      )
    }

    // ── 4. Check role is OWNER or EDITOR (not VIEWER) ────────────────────
    if (tenantUser.role !== 'OWNER' && tenantUser.role !== 'EDITOR') {
      return Response.json(
        { error: 'Forbidden — viewers cannot access the builder' },
        { status: 403 }
      )
    }

    // ── 5. Validate Page belongs to Site, and Site belongs to Tenant ─────
    const page = await prisma.page.findFirst({
      where: { id: pageId, siteId },
      include: { site: { select: { tenantId: true } } },
    })

    if (!page) {
      return Response.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    if (page.site.tenantId !== tenantId) {
      return Response.json(
        { error: 'Forbidden — page does not belong to this workspace' },
        { status: 403 }
      )
    }

    // ── 6. Prepare Liveblocks session ────────────────────────────────────
    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        color: getCursorColor(Math.abs(hashCode(userId))),
        avatar: userAvatar,
      },
    })

    // Grant full access to this specific room only
    liveblocksSession.allow(roomId, liveblocksSession.FULL_ACCESS)

    // ── 7. Authorize and return token ────────────────────────────────────
    const { status, body: responseBody } =
      await liveblocksSession.authorize()

    return new Response(responseBody, { status })
  } catch (error) {
    console.error('[liveblocks-auth] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Simple hash code for deterministic color assignment.
 * @param {string} str
 * @returns {number}
 */
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}
