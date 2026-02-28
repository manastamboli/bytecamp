import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyDomainOwnership } from "@/lib/aws/dns-verification";

/**
 * POST /api/sites/[siteId]/domains/[domainId]/verify
 * Verify domain ownership via DNS TXT record
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

    // Check if already verified
    if (customDomain.status === "VERIFIED" || customDomain.verifiedAt) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        domain: customDomain,
      });
    }

    // Update status to verifying
    await prisma.customDomain.update({
      where: { id: domainId },
      data: { status: "VERIFYING", lastCheckedAt: new Date() },
    });

    // Verify DNS TXT record
    const verified = await verifyDomainOwnership(
      customDomain.domain,
      customDomain.verificationRecord
    );

    if (verified) {
      // Update domain as verified
      const updatedDomain = await prisma.customDomain.update({
        where: { id: domainId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          lastCheckedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        domain: updatedDomain,
        message: "Domain ownership verified successfully!",
      });
    } else {
      // Verification failed - revert to pending
      await prisma.customDomain.update({
        where: { id: domainId },
        data: {
          status: "PENDING",
          lastCheckedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: false,
        verified: false,
        message: "DNS TXT record not found. Please add the verification record and try again.",
        dnsInstructions: {
          type: "TXT",
          host: `_sitepilot-verify.${customDomain.domain}`,
          value: customDomain.verificationRecord,
        },
      });
    }

  } catch (error) {
    console.error("POST /api/sites/[siteId]/domains/[domainId]/verify error:", error);
    return NextResponse.json(
      { error: "Verification failed", details: error.message },
      { status: 500 }
    );
  }
}
