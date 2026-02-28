import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateVerificationToken, isValidDomain } from "@/lib/aws/dns-verification";
import { getPlanGuard, PlanGuardError, planGuardErrorResponse } from "@/lib/plan-guard";

/**
 * GET /api/sites/[siteId]/domains
 * List all custom domains for a site
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all custom domains for this site
    const domains = await prisma.customDomain.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ domains, count: domains.length });

  } catch (error) {
    console.error("GET /api/sites/[siteId]/domains error:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites/[siteId]/domains
 * Add a new custom domain
 * 
 * Body: { domain: string }
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { domain } = await request.json();

    // Validate domain format
    if (!domain || !isValidDomain(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── PLAN GUARD: customDomains feature gate ──────────────────────────
    try {
      const guard = await getPlanGuard(prisma, site.tenantId);
      guard.requireActive();
      guard.checkFeature('customDomains');
    } catch (err) {
      if (err instanceof PlanGuardError) {
        return NextResponse.json(planGuardErrorResponse(err), { status: err.httpStatus });
      }
      throw err;
    }

    // Check if domain is already taken
    const existingDomain = await prisma.customDomain.findUnique({
      where: { domain: domain.toLowerCase() },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: "Domain is already in use" },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationValue = generateVerificationToken(domain);
    const verificationRecord = `_sitepilot-verify.${domain}`;

    // Create domain record
    const customDomain = await prisma.customDomain.create({
      data: {
        domain: domain.toLowerCase(),
        siteId,
        status: "PENDING",
        verificationRecord: verificationValue,
      },
    });

    return NextResponse.json({
      domain: customDomain,
      dnsInstructions: {
        type: "TXT",
        host: verificationRecord,
        value: verificationValue,
        message: `Add a TXT record at ${verificationRecord} with value: ${verificationValue}`,
      },
    });

  } catch (error) {
    console.error("POST /api/sites/[siteId]/domains error:", error);
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}
