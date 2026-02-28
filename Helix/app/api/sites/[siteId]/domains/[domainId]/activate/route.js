import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { attachDomainToTenant } from "@/lib/aws/cf-domain-attach";
import { updateKVS } from "@/lib/aws/s3-publish";
import { verifyCNAME } from "@/lib/aws/dns-verification";
import { isCertificateIssued } from "@/lib/aws/acm-ssl";

/**
 * POST /api/sites/[siteId]/domains/[domainId]/activate
 * Activate domain - attach to CloudFront and update KVS
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        deployments: {
          where: { isActive: true },
          take: 1,
        },
      },
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

    // Find domain
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Pre-flight checks
    const checks = {
      verified: false,
      sslIssued: false,
      hasActiveDeployment: false,
      hasTenant: false,
    };

    // Check 1: Domain verified
    if (!customDomain.verifiedAt) {
      return NextResponse.json(
        {
          error: "Domain must be verified before activation",
          checks,
        },
        { status: 400 }
      );
    }
    checks.verified = true;

    // Check 2: SSL certificate issued
    if (!customDomain.certificateArn) {
      return NextResponse.json(
        {
          error: "SSL certificate must be requested before activation",
          checks,
        },
        { status: 400 }
      );
    }

    // Verify certificate is actually issued
    const certIssued = await isCertificateIssued(customDomain.certificateArn);
    if (!certIssued) {
      return NextResponse.json(
        {
          error: "SSL certificate is not yet issued. Please complete DNS validation.",
          checks,
        },
        { status: 400 }
      );
    }
    checks.sslIssued = true;

    // Check 3: Site has active deployment
    const activeDeployment = site.deployments[0];
    if (!activeDeployment) {
      return NextResponse.json(
        {
          error: "Site must have an active deployment before connecting a domain",
          checks,
        },
        { status: 400 }
      );
    }
    checks.hasActiveDeployment = true;

    // Check 4: Site has CloudFront tenant
    if (!site.cfTenantId || !site.slug) {
      return NextResponse.json(
        {
          error: "Site CloudFront tenant not configured. Please contact support.",
          checks,
        },
        { status: 400 }
      );
    }
    checks.hasTenant = true;

    console.log(`[Domain Activation] Site cfTenantId: ${site.cfTenantId}`);
    console.log(`[Domain Activation] Site slug: ${site.slug}`);

    // Update status to attaching
    await prisma.customDomain.update({
      where: { id: domainId },
      data: { status: "ATTACHING" },
    });

    // Step 1: Attach domain to CloudFront tenant
    console.log(`[Domain Activation] Attaching domain to CloudFront tenant`);

    const cfResult = await attachDomainToTenant({
      cfTenantId: site.cfTenantId,  // Use CloudFront Identifier, NOT slug
      domain: customDomain.domain,
      certificateArn: customDomain.certificateArn,
    });

    console.log(`[Domain Activation] CloudFront attachment result:`, cfResult);

    // Step 2: Update KVS mapping for custom domain
    console.log(`[Domain Activation] Updating KVS mapping`);

    const kvsResult = await updateKVS(
      customDomain.domain, // Use custom domain as key
      activeDeployment.s3Key // Same S3 path as site's active deployment
    );

    console.log(`[Domain Activation] KVS update result:`, kvsResult);

    // Update domain with CloudFront details
    const updatedDomain = await prisma.customDomain.update({
      where: { id: domainId },
      data: {
        attachedToCF: true,
        attachedAt: new Date(),
        cnameTarget: cfResult.cnameTarget,
        status: "DNS_PENDING",
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
      checks,
      message: "Domain attached to CloudFront. Add CNAME record to activate.",
      dnsInstructions: {
        type: "CNAME",
        host: customDomain.domain,
        value: cfResult.cnameTarget,
        message: `Add a CNAME record for ${customDomain.domain} pointing to ${cfResult.cnameTarget}`,
      },
    });

  } catch (error) {
    console.error("POST /api/sites/[siteId]/domains/[domainId]/activate error:", error);

    // Update domain status to failed
    const { domainId } = await params;
    try {
      await prisma.customDomain.update({
        where: { id: domainId },
        data: { status: "FAILED" },
      });
    } catch (updateError) {
      console.error("Failed to update domain status:", updateError);
    }

    return NextResponse.json(
      { error: "Domain activation failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites/[siteId]/domains/[domainId]/activate
 * Check if domain CNAME is configured and activate if ready
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

    // Verify access
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

    // Find domain
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Check if already active
    if (customDomain.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        active: true,
        domain: customDomain,
      });
    }

    // Check if CNAME is configured
    if (!customDomain.cnameTarget) {
      return NextResponse.json({
        success: false,
        active: false,
        message: "Domain not yet attached to CloudFront",
      });
    }

    // Verify CNAME DNS record
    const cnameVerified = await verifyCNAME(
      customDomain.domain,
      customDomain.cnameTarget
    );

    // Update domain
    const updatedDomain = await prisma.customDomain.update({
      where: { id: domainId },
      data: {
        cnameVerified,
        status: cnameVerified ? "ACTIVE" : customDomain.status,
        activatedAt: cnameVerified && !customDomain.activatedAt
          ? new Date()
          : customDomain.activatedAt,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      active: cnameVerified,
      cnameVerified,
      domain: updatedDomain,
      message: cnameVerified
        ? "Domain is now active!"
        : "CNAME record not yet configured or propagated",
    });

  } catch (error) {
    console.error("GET /api/sites/[siteId]/domains/[domainId]/activate error:", error);
    return NextResponse.json(
      { error: "Failed to check activation status", details: error.message },
      { status: 500 }
    );
  }
}
