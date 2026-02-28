import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper — verify user has access to a specific page via its site's tenant
async function getPageWithAccess(siteId, pageId, userId) {
  const page = await prisma.page.findFirst({
    where: { id: pageId, siteId },
  });
  if (!page) return { page: null, membership: null, site: null };

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  const membership = await prisma.tenantUser.findFirst({
    where: { userId, tenantId: site.tenantId },
  });

  return { page, site, membership };
}

// GET /api/sites/[siteId]/pages/[pageId]  — get full page including layout
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, pageId } = await params;
    const { page, membership } = await getPageWithAccess(
      siteId,
      pageId,
      session.user.id,
    );

    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ page });
  } catch (error) {
    console.error("GET /api/sites/[siteId]/pages/[pageId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 },
    );
  }
}

// PUT /api/sites/[siteId]/pages/[pageId]  — save layout, seo, or metadata
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, pageId } = await params;
    const { page, membership } = await getPageWithAccess(
      siteId,
      pageId,
      session.user.id,
    );

    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, slug, seo, layout, sortOrder } = body;

    // Validate slug uniqueness if changing slug
    if (slug && slug !== page.slug) {
      const conflict = await prisma.page.findFirst({ where: { siteId, slug } });
      if (conflict) {
        return NextResponse.json(
          { error: "Another page already uses this slug" },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(seo !== undefined && { seo }),
        ...(layout !== undefined && { layout }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ page: updated });
  } catch (error) {
    console.error("PUT /api/sites/[siteId]/pages/[pageId] error:", error);
    return NextResponse.json({ error: "Failed to save page" }, { status: 500 });
  }
}

// DELETE /api/sites/[siteId]/pages/[pageId]  — delete a page
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, pageId } = await params;
    const { page, membership } = await getPageWithAccess(
      siteId,
      pageId,
      session.user.id,
    );

    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Prevent deleting the last page in a site
    const pageCount = await prisma.page.count({ where: { siteId } });
    if (pageCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last page of a site" },
        { status: 400 },
      );
    }

    await prisma.page.delete({ where: { id: pageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sites/[siteId]/pages/[pageId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}
