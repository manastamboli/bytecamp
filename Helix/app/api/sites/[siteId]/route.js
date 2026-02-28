import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper — fetch site and verify current user has tenant access
async function getSiteWithAccess(siteId, userId) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      pages: {
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!site) return { site: null, membership: null };

  const membership = await prisma.tenantUser.findFirst({
    where: { userId, tenantId: site.tenantId },
  });

  return { site, membership };
}

// GET /api/sites/[siteId]  — get a single site with its page list
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, membership } = await getSiteWithAccess(
      siteId,
      session.user.id,
    );

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ site });
  } catch (error) {
    console.error("GET /api/sites/[siteId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 },
    );
  }
}

// PUT /api/sites/[siteId]  — update site metadata / theme
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, membership } = await getSiteWithAccess(
      siteId,
      session.user.id,
    );

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, favicon, domain, theme, globalSettings } =
      await request.json();

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(favicon !== undefined && { favicon }),
        ...(domain !== undefined && { domain }),
        ...(theme !== undefined && { theme }),
        ...(globalSettings !== undefined && { globalSettings }),
      },
    });

    return NextResponse.json({ site: updated });
  } catch (error) {
    console.error("PUT /api/sites/[siteId] error:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 },
    );
  }
}

// DELETE /api/sites/[siteId]  — delete a site (cascades pages)
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, membership } = await getSiteWithAccess(
      siteId,
      session.user.id,
    );

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    if (
      !membership ||
      (membership.role !== "OWNER" && membership.role !== "EDITOR")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.site.delete({ where: { id: siteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sites/[siteId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 },
    );
  }
}
