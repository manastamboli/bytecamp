import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper — verify user has access to the site's tenant
async function checkSiteAccess(siteId, userId) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return { site: null, membership: null };

  const membership = await prisma.tenantUser.findFirst({
    where: { userId, tenantId: site.tenantId },
  });

  return { site, membership };
}

// GET /api/sites/[siteId]/pages  — list all pages (metadata only, no layout)
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, membership } = await checkSiteAccess(siteId, session.user.id);

    if (!site)
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const pages = await prisma.page.findMany({
      where: { siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        seo: true,
        sortOrder: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        // Deliberately exclude `layout` for list view performance
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("GET /api/sites/[siteId]/pages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 },
    );
  }
}

// POST /api/sites/[siteId]/pages  — create a new page
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { site, membership } = await checkSiteAccess(siteId, session.user.id);

    if (!site)
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    if (!membership)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, slug, seo, layout } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 },
      );
    }

    // Check slug uniqueness within site
    const existing = await prisma.page.findFirst({ where: { siteId, slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 },
      );
    }

    // Determine next sort order
    const lastPage = await prisma.page.findFirst({
      where: { siteId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (lastPage?.sortOrder ?? -1) + 1;

    const page = await prisma.page.create({
      data: {
        name,
        slug,
        seo: seo || { title: `${site.name} — ${name}`, description: "" },
        layout: layout || [],
        sortOrder,
        siteId,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sites/[siteId]/pages error:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 },
    );
  }
}
