import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { provisionSiteTenant } from "@/lib/aws/cf-tenants";
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from "@/lib/plan-guard";

// Helper — verify user is a member of the given tenant
async function getTenantMembership(userId, tenantId) {
  return prisma.tenantUser.findFirst({
    where: { userId, tenantId },
  });
}

// GET /api/sites?tenantId=xxx  — list all sites for a tenant
export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 },
      );
    }

    const membership = await getTenantMembership(session.user.id, tenantId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sites = await prisma.site.findMany({
      where: { tenantId },
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
        _count: { select: { pages: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("GET /api/sites error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sites" },
      { status: 500 },
    );
  }
}

// POST /api/sites  — create a new site
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, name, slug, description, favicon, theme } =
      await request.json();

    if (!tenantId || !name || !slug) {
      return NextResponse.json(
        { error: "tenantId, name, and slug are required" },
        { status: 400 },
      );
    }

    const membership = await getTenantMembership(session.user.id, tenantId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── PLAN GUARD: Check subscription status & site limit ───────────────────
    try {
      const guard = await getPlanGuard(prisma, tenantId);
      guard.requireActive();
      const currentSiteCount = await prisma.site.count({ where: { tenantId } });
      guard.checkSiteLimit(currentSiteCount);
    } catch (err) {
      if (err instanceof PlanGuardError) {
        return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
      }
      throw err;
    }

    // ── 1. GLOBAL SLUG UNIQUENESS CHECK ─────────────────────────────────────
    const existingGlobal = await prisma.site.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existingGlobal) {
      return NextResponse.json(
        { error: "Site slug is already taken by another user. Please try a different one." },
        { status: 409 },
      );
    }

    // ── 2. CREATE SITE RECORD ───────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: {
          name,
          slug: slug.toLowerCase(),
          description: description || null,
          favicon: favicon || null,
          theme: theme || {
            primaryColor: "#6366f1",
            secondaryColor: "#8b5cf6",
            fontFamily: "Inter, sans-serif",
            headingFont: "Inter, sans-serif",
          },
          globalSettings: {},
          tenantId,
          cfStatus: "PROVISIONING",
        },
      });

      // Create a default "Home" page
      const page = await tx.page.create({
        data: {
          name: "Home",
          slug: "/",
          seo: {
            title: `${name} — Home`,
            description: description || "",
            ogImage: "",
          },
          layout: [],
          sortOrder: 0,
          siteId: site.id,
        },
      });

      return { site, page };
    });

    // ── 3. PROVISION CLOUDFRONT TENANT ──────────────────────────────────────
    // This creates a real tenant and updates KVS to point <slug>.sitepilot.devally.in
    try {
      const provisioning = await provisionSiteTenant(result.site.slug);

      if (provisioning.success) {
        // Update site with provisioning result
        await prisma.site.update({
          where: { id: result.site.id },
          data: {
            cfStatus: provisioning.status || "LIVE",
            cfTenantId: provisioning.tenantId,
            cfTenantArn: provisioning.tenantArn,
            cfConnectionGroupId: provisioning.connectionGroupId,
            // Ensure the domain is also stored in the site record
            domain: provisioning.domain,
          },
        });
      } else {
        throw new Error(provisioning.error || "Provisioning failed");
      }
    } catch (provisionError) {
      console.error("Post-creation provisioning failed:", provisionError);
      await prisma.site.update({
        where: { id: result.site.id },
        data: { cfStatus: "ERROR" },
      });
    }

    return NextResponse.json(
      { site: result.site, page: result.page },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/sites error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create site" },
      { status: 500 },
    );
  }
}

